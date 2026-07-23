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
  assertBranchCanAcceptOrders,
  assertReservationLimits,
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
  dispatchOrderCreatedEvent,
  persistOrder,
  sendOrderConfirmationEmail,
} from "@/services/checkout/checkoutOrder.service";
import { fetchBranch } from "@/services/branch/branch.service";
import { logOrderCreated } from "@/services/activityLog.service";
import { notifyNewOrder } from "@/services/notification.service";
import { getAPIError } from "@/lib/getApiError";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";

const MINIMUM_AMOUNT = 100;

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Guard: store open?
    await assertStoreIsOpen(session);

    // 2. Parse & validate body early so we have branchId for capacity check
    const body: CreateOrderPayload = await request.json();
    await assertValidPayload(body, session);
    if (body.paymentMethod !== "cod") {
      throw new Error("Invalid payment method for COD checkout.");
    }

    // 3. Guard: branch capacity — blocks checkout if at limit
    await assertBranchCanAcceptOrders(body.branchId, body.fulfillmentType, session);

    // 3.1 Guard: reservation limits — blocks dine-in if hourly/daily cap reached
    if (body.fulfillmentType === FULFILLMENT_TYPE.DINE_IN) {
      await assertReservationLimits(body.branchId, body.reservation, session);
    }

    // 4. Auth (optional customer)
    const customer = await requireBetterAuth(request);
    const customerId = customer?._id ?? null;

    const promoCardDiscount =
      body.applyPromoCardDiscount === true
        ? await assertCanUsePromoCardDiscount(customerId, session)
        : null;

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    // 4.1 Resolve final delivery/pickup/dine-in details server-side.
    const fulfillment = await resolveCheckoutFulfillment({
      fulfillmentType: body.fulfillmentType,
      branch,
      shippingAddress: body.shippingAddress,
      reservation: body.reservation,
      pickupTime: body.pickupTime,
      session,
    });

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

    // Free delivery: check eligibility after subtotal is known (cart was resolved in step 5).
    const freeDeliveryApplied = isFreeDeliveryEligible(
      fulfillment.fulfillmentType,
      fulfillment.distanceKm,
      productDiscountedTotal,
    );

    const tax = computeTax(
      totalPrice,
      productDiscountResolution,
      body.applyPromoCardDiscount === true,
      promoCardDiscount?.discountRate,
      promoCardDiscount?.discountCode,
      voucherDiscountAmount,
      orderDiscountPromotion,
      fulfillment.deliveryFee,
      fulfillment.distanceKm,
      fulfillment.billableKm,
      freeDeliveryApplied,
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
        paymentMethod: "cod",
        totalAmount: tax.totalAmount,
        fulfillmentType: fulfillment.fulfillmentType,
        session,
      });
    }

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
      notifyNewOrder({
        orderId: order._id.toString(),
        branchId: body.branchId,
        referenceNumber,
        customerName: `${body.firstName} ${body.lastName}`,
        totalAmount: tax.totalAmount,
        fulfillmentType: fulfillment.fulfillmentType,
        paymentMethod: "cod",
      }),
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
    return getAPIError(error, 500, {fallbackMessage: "Failed to checkout!"});
  } finally {
    await session.endSession();
  }
}
