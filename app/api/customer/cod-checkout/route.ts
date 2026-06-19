import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";
import { redeemCustomerVoucher } from "@/services/promoCardBenefits";
import { calculatePromoCardTotal } from "@/lib/promoCard";
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
  fetchBranch,
  resolveDeliveryFee,
} from "@/services/checkout/checkoutPricing.service";
import {
  reserveInventory,
  resolveCart,
} from "@/services/checkout/checkoutInventory.service";
import {
  dispatchOrderCreatedEvent,
  persistOrder,
  sendOrderConfirmationEmail,
} from "@/services/checkout/checkoutOrder.service";

const MINIMUM_AMOUNT = 100;

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
    if (body.paymentMethod !== "cod") {
      throw new Error("Invalid payment method for COD checkout.");
    }

    const promoCardDiscount =
      body.applyPromoCardDiscount === true
        ? await assertCanUsePromoCardDiscount(customerId, session)
        : null;

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    // 4.1 Resolve delivery fee
    const deliveryFeeEstimate = resolveDeliveryFee(
      branch,
      body.shippingAddress,
    );

    // 5. Resolve cart items + reserve inventory
    const { totalPrice, orderItems } = await resolveCart(
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
    const tax = computeTax(
      totalPrice,
      productDiscountResolution,
      body.applyPromoCardDiscount === true,
      promoCardDiscount?.discountRate,
      promoCardDiscount?.discountCode,
      voucherDiscountAmount,
      orderDiscountPromotion,
      deliveryFeeEstimate.deliveryFee,
      deliveryFeeEstimate.distanceKm,
      deliveryFeeEstimate.billableKm,
    );

    if (tax.totalAmount < MINIMUM_AMOUNT) {
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);
    }

    await incrementOrderDiscountRedemption(orderDiscountPromotion, session);
    await incrementProductDiscountRedemptions(
      productDiscountResolution.appliedPromotions,
      session,
    );

    const referenceNumber = `ORDER-${Date.now()}`;

    // COD has no checkout gateway — pass empty string for checkoutId
    const checkoutId = "";

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
    );

    // 9. Reserve inventory now that we have orderId
    await reserveInventory(orderItems, body.branchId, order._id, session);
    await session.commitTransaction();

    const paymentMethod = order?.paymentInfo?.paymentMethod;

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
        success: true,
        referenceNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to checkout!",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
