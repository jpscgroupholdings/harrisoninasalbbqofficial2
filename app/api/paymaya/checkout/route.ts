import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";
import { calculatePromoCardTotal } from "@/lib/promoCard";
import { redeemCustomerVoucher } from "@/services/promoCardBenefits";
import {
  incrementOrderDiscountRedemption,
  resolveOrderDiscountPromotion,
} from "@/lib/order-promotions/order-promotion.application";
import {
  incrementProductDiscountRedemptions,
  resolveProductDiscountPromotions,
} from "@/lib/product-promotions/product-promotion.application";
import {
  assertCanUsePromoCardDiscount,
  assertStoreIsOpen,
  assertValidPayload,
} from "@/services/checkout/checkoutValidation.service";
import {
  computeTax,
} from "@/services/checkout/checkoutPricing.service";
import { resolveCheckoutFulfillment } from "@/services/checkout/checkoutFulfillment.service";
import { isFreeDeliveryEligible } from "@/lib/deliveryFee";
import {
  reserveInventory,
  resolveCart,
} from "@/services/checkout/checkoutInventory.service";
import {
  buildMayaPayload,
  createMayaCheckout,
} from "@/services/payments/mayaCheckout";
import {
  dispatchOrderCreatedEvent,
  persistOrder,
  sendOrderConfirmationEmail,
} from "@/services/checkout/checkoutOrder.service";
import { fetchBranch } from "@/services/branch/branch.service";
import { logOrderCreated } from "@/services/activityLog.service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MINIMUM_AMOUNT = 100;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Guard: store open?
    await assertStoreIsOpen(session);

    // 2. Auth (optional customer)
    const customer = await requireBetterAuth(request);
    const customerId = customer?._id ?? null;

    // 3. Parse & validate body
    const body: CreateOrderPayload = await request.json();
    assertValidPayload(body);
    if (body.paymentMethod !== "maya") {
      throw new Error("Invalid payment method for Maya checkout.");
    }

    const shouldApplyPromoCardDiscount = body.applyPromoCardDiscount === true;
    const promoCardDiscount =
      shouldApplyPromoCardDiscount
        ? await assertCanUsePromoCardDiscount(customerId, session)
        : null;

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    const fulfillment = resolveCheckoutFulfillment({
      fulfillmentType: body.fulfillmentType,
      branch,
      shippingAddress: body.shippingAddress,
    });

    // 5. Resolve cart items + reserve inventory
    const { totalPrice, orderItems, mayaItems } = await resolveCart(
      body.items,
      body.branchId,
      session,
    );

    // 6. Tax breakdown
    const productDiscountResolution = await resolveProductDiscountPromotions(
      orderItems,
      session,
    );
    const productDiscountedTotal =
      productDiscountResolution.discountedSubtotalAmount;
    const promoAdjustedTotal = body.applyPromoCardDiscount
      ? calculatePromoCardTotal(
          productDiscountedTotal,
          promoCardDiscount?.discountRate,
        )
      : productDiscountedTotal;
    const orderDiscountPromotion = await resolveOrderDiscountPromotion(
      productDiscountedTotal,
      promoAdjustedTotal,
      session,
    );
    const voucherDiscountAmount = await redeemCustomerVoucher(
      customerId,
      Math.min(
        Math.max(0, Number(body.voucherAmount ?? 0)),
        Math.max(
          promoAdjustedTotal - (orderDiscountPromotion?.discountAmount ?? 0),
          0,
        ),
      ),
      session,
    );

    // 6.1 Free delivery: check eligibility after subtotal is known (cart was resolved in step 5).
    const freeDeliveryApplied = isFreeDeliveryEligible(
      fulfillment.fulfillmentType,
      fulfillment.distanceKm,
      productDiscountedTotal,
    );

    const tax = computeTax(
      totalPrice,
      productDiscountResolution,
      shouldApplyPromoCardDiscount,
      promoCardDiscount?.discountRate,
      promoCardDiscount?.discountCode,
      voucherDiscountAmount,
      orderDiscountPromotion,
      fulfillment.deliveryFee,
      fulfillment.distanceKm,
      fulfillment.billableKm,
      freeDeliveryApplied,
    );

    if (tax.totalAmount < MINIMUM_AMOUNT)
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);

    await incrementOrderDiscountRedemption(orderDiscountPromotion, session);
    await incrementProductDiscountRedemptions(
      productDiscountResolution.appliedPromotions,
      session,
    );

    // 7. Maya checkout
    const referenceNumber = `ORDER-${Date.now()}`;
    const mayaPayload = buildMayaPayload(body, mayaItems, tax, referenceNumber);
    const { checkoutId, redirectUrl } = await createMayaCheckout(mayaPayload);

    // 8. Persist order
    const order = await persistOrder(
      body,
      branch,
      orderItems,
      tax,
      checkoutId,
      referenceNumber,
      customerId,
      session,
      fulfillment,
    );

    // 9. Reserve inventory now that we have orderId
    await reserveInventory(orderItems, body.branchId, order._id, session);

    // 10. Log the order creation
    if (customerId) {
      await logOrderCreated({
        orderId: order._id,
        customerId,
        branchId: body.branchId,
        referenceNumber,
        paymentMethod: "maya",
        totalAmount: tax.totalAmount,
        fulfillmentType: fulfillment.fulfillmentType,
        session,
      });
    }

    const paymentMethod = order?.paymentInfo?.paymentMethod;

    await session.commitTransaction();

    // 10. Side effects (after commit — failures are non-fatal)
    await Promise.allSettled([
      dispatchOrderCreatedEvent(
        order._id.toString(),
        referenceNumber,
        paymentMethod,
      ),
      sendOrderConfirmationEmail(order),
    ]);

    return NextResponse.json(
      {
        orderId: order._id.toString(),
        referenceNumber,
        checkoutId,
        redirectUrl,
        status: order.status,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to checkout!" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
