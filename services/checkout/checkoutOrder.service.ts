import { CreateOrderPayload } from "@/types/OrderTypes";
import { TaxBreakdown } from "./checkoutPricing.service";
import { ResolvedCartItem } from "./checkoutInventory.service";
import { ClientSession } from "mongoose";
import { Order } from "@/models/Orders";
import { FULFILLMENT_TYPE, FulfillmentType, ORDER_STATUSES } from "@/types/orderConstants";
import { inngest } from "@/inngest/client";
import { EMAIL_FROM, resend } from "@/lib/resend";
import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
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
        // Maya orders start as pending_payment (awaiting webhook).
        // All other orders start as pending — admin must "Accept" to confirm.
        status:
          paymentMethod === "maya"
            ? ORDER_STATUSES.PENDING_PAYMENT
            : ORDER_STATUSES.PENDING,
        fulfillmentType,
        items: orderItems,
        // Include reservation details for dine-in orders
        ...(fulfillmentType === FULFILLMENT_TYPE.DINE_IN && reservation && {
          reservation: {
            scheduledAt: new Date(reservation.scheduledAt),
            partySize: reservation.partySize,
          },
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
  // All orders at creation are either:
  // - COD → pending (awaiting admin acceptance)
  // - Maya → pending_payment (awaiting payment)
  // Reservation confirmed emails are sent when admin accepts (PATCH route).
  const isMaya = order.paymentInfo.paymentMethod === "maya";

  const { error: emailError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: order.paymentInfo.customerEmail,
    subject: isMaya ? "Payment Needed!" : "Order Received!",
    react: OrderMessageEmail({ order }),
  });

  if (emailError) {
    console.error("[Order] Failed to send email:", emailError);
  }
}
