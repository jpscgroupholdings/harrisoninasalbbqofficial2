import { CreateOrderPayload } from "@/types/OrderTypes";
import { TaxBreakdown } from "./checkoutPricing.service";
import { ResolvedCartItem } from "./checkoutInventory.service";
import { ClientSession } from "mongoose";
import { Order } from "@/models/Orders";
import { FULFILLMENT_TYPE, FulfillmentType, ORDER_STATUSES } from "@/types/orderConstants";
import { inngest } from "@/inngest/client";
import { EMAIL_FROM, resend } from "@/lib/resend";
import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
import ReservationConfirmedEmail from "@/app/emails/ReservationConfirmedEmail";
import { fetchBranch } from "../branch/branch.service";

export async function persistOrder(
  body: CreateOrderPayload,
  branch: Awaited<ReturnType<typeof fetchBranch>>,
  orderItems: ResolvedCartItem["orderItem"][],
  tax: TaxBreakdown,
  checkoutId: string,
  referenceNumber: string,
  customerId: string | null,
  session: ClientSession,
  fulfillment?: {
    fulfillmentType: FulfillmentType;
    shippingAddress?: CreateOrderPayload["shippingAddress"];
  },
) {
  const {
    branchId,
    firstName,
    lastName,
    customerEmail,
    customerPhone,
    paymentMethod,
    notes,
    reservation,
  } = body;
  const fulfillmentType = fulfillment?.fulfillmentType ?? FULFILLMENT_TYPE.DELIVERY;
  const shippingAddress = fulfillment?.shippingAddress ?? body.shippingAddress;
  const {
    vatableSales,
    vatAmount,
    totalAmount,
    subtotalAmount,
    discountAmount,
    productDiscountAmount,
    productDiscountPromotions,
    orderDiscountAmount,
    orderDiscountPromotionId,
    orderDiscountPromotionName,
    discountCode,
    voucherDiscountAmount,
    deliveryFeeAmount,
    rawDeliveryFee,
    deliveryDistanceKm,
    deliveryBillableKm,
    freeDeliveryApplied,
  } = tax;

  const order = await Order.create(
    [
      {
        branchId,
        customerId,
        branchSnapshot: {
          name: branch.name,
          code: branch.code,
          address: branch.address,
          contactNumber: branch.contactNumber,
          location: branch.location,
        },
        status:
          paymentMethod === "maya"
            ? ORDER_STATUSES.PENDING_PAYMENT
            : fulfillmentType === FULFILLMENT_TYPE.DINE_IN
              ? ORDER_STATUSES.CONFIRMED
              : ORDER_STATUSES.PENDING,
        fulfillmentType,
        items: orderItems,
        // Include reservation details for dine-in orders
        ...(fulfillmentType === FULFILLMENT_TYPE.DINE_IN && reservation && {
          reservation: {
            scheduledAt: new Date(reservation.scheduledAt),
            partySize: reservation.partySize,
          },
          // Only set confirmedAt for COD dine-in (Maya gets it on payment webhook)
          ...(paymentMethod !== "maya" && { "timeline.confirmedAt": new Date() }),
        }),
        paymentInfo: {
          checkoutId,
          referenceNumber,
          firstName,
          lastName,
          customerEmail,
          customerPhone,
          paymentMethod,
          shippingAddress,
        },
        total: {
          vatableSales,
          vatAmount,
          totalAmount,
          subtotalAmount,
          discountAmount,
          productDiscountAmount,
          productDiscountPromotions: productDiscountPromotions.map(
            (promotion) => ({
              promotionId: promotion.promotionId,
              name: promotion.name,
              productId: promotion.productId,
              productName: promotion.productName,
              discountAmount: promotion.discountAmount,
            }),
          ),
          orderDiscountAmount,
          orderDiscountPromotionId,
          orderDiscountPromotionName,
          discountCode,
          voucherDiscountAmount,
          deliveryFeeAmount,
          rawDeliveryFee,
          deliveryDistanceKm,
          deliveryBillableKm,
          freeDeliveryApplied,
        },
        notes,
      },
    ],
    { session },
  );

  return order[0];
}

export async function dispatchOrderCreatedEvent(
  orderId: string,
  referenceNumber: string,
  paymentMethod: string,
): Promise<void> {
  await inngest.send({
    name: "order/created",
    data: { orderId, referenceNumber, paymentMethod },
  });
}

export async function sendOrderConfirmationEmail(
  order: Awaited<ReturnType<typeof persistOrder>>,
): Promise<void> {
  // Only COD dine-in gets the reservation confirmed email.
  // Maya dine-in starts as pending_payment and gets the standard payment email.
  const isCodDineIn =
    order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN &&
    order.paymentInfo.paymentMethod !== "maya";

  const { error: emailError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: order.paymentInfo.customerEmail,
    subject: isCodDineIn
      ? `Reservation Confirmed — ${order.branchSnapshot?.name ?? "Harrison's"}`
      : "Payment Needed!",
    react: isCodDineIn
      ? ReservationConfirmedEmail({ order })
      : OrderMessageEmail({ order }),
  });

  if (emailError) {
    console.error("[Order] Failed to send email:", emailError);
  }
}
