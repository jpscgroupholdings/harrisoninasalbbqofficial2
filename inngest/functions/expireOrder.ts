import { inngest } from "../client";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Inventory } from "@/models/Inventory";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";
import { refundCustomerVoucher } from "@/services/promoCardBenefits";
import { ACTOR_TYPE, logActivity } from "@/services/activityLog.service";

export const expireOrder = inngest.createFunction(
  { id: "expire-pending-order", triggers: { event: "order/created" } },
  async ({ event, step }) => {
    const sleepDuration = event.data.paymentMethod === "maya" ? "30m" : "4h";
    // Wait 30 minutes before doing anything
    await step.sleep("wait-for-payment-window", sleepDuration);
    // After the payment/order window, check and expire if still awaiting action.
    await step.run("check-and-expire-order", async () => {
      await connectDB();

      const order = await Order.findById(event.data.orderId);

      if (!order) {
        return { skipped: true, reason: "Order not found" };
      }

      const expirableStatuses = [
        ORDER_STATUSES.PENDING_PAYMENT,
        ORDER_STATUSES.PENDING,
      ];

      if (!expirableStatuses.includes(order.status)) {
        return {
          skipped: true,
          reason: `Order is in status "${order.status}" — already progressed beyond expirable states`,
        };
      }

      // Check if Maya payment is genuinely confirmed
      const isPaymentConfirmed =
        order.paymentInfo?.paymentMethod === "maya" &&
        order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS &&
        !!order.paymentInfo?.paymentId;

      if (isPaymentConfirmed) {
        return {
          skipped: true,
          reason: `Maya payment is confirmed (paymentId: ${order.paymentInfo?.paymentId}, status: ${order.paymentInfo?.paymentStatus}) — order is legitimately paid`,
        };
      }

      // Determine expiration reason for logging before we mutate anything
      const expirationReason = resolveExpirationReason(order);

      // Release reserved inventory for each item
      await Inventory.updateMany(
        { branchId: order.branchId, "reservations.orderId": order._id },
        { $pull: { reservations: { orderId: order._id } } },
      );

      await refundCustomerVoucher(
        order.customerId,
        order.total?.voucherDiscountAmount ?? 0,
      );
      // Mark order as expired
      await Order.findByIdAndUpdate(order._id, {
        status: ORDER_STATUSES.EXPIRED,
        "timeline.expiredAt": new Date(),
      });

      // Log the expiration
      await logActivity({
        branchId: order.branchId,
        actor: { actorType: ACTOR_TYPE.SYSTEM },
        target: {
          entityType: "Order",
          entityId: order._id,
          label: event.data.referenceNumber,
        },
        category: "order",
        action: "order.expired",
        summary: `Order ${event.data.referenceNumber} expired automatically — ${expirationReason}`,
        metadata: {
          paymentMethod:
            order.paymentInfo?.paymentMethod ?? event.data.paymentMethod,
          previousStatus: order.status,
          expirationReason,
        },
      });

      return { expired: true, orderId: order._id, reason: expirationReason };
    });
  },
);

function resolveExpirationReason(order: {
  status: string;
  paymentInfo?: {
    paymentMethod?: string;
    paymentStatus?: string;
    paymentId?: string;
  };
}): string {
  if (order.status === ORDER_STATUSES.PENDING_PAYMENT) {
    return "Payment window elapsed — Maya payment was never completed";
  }

  if (order.status === ORDER_STATUSES.PENDING) {
    const method = order.paymentInfo?.paymentMethod;

    if (method === "maya") {
      const hasId = !!order.paymentInfo?.paymentId;
      const hasSuccess =
        order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS;

      if (!hasId && !hasSuccess) {
        return "Order reached pending status without a confirmed Maya payment — possible bypass attempt";
      }
      if (!hasId) {
        return "Payment status shows success but no paymentId recorded — treating as unconfirmed";
      }
      if (!hasSuccess) {
        return "PaymentId exists but status is not success — payment likely failed or is still processing";
      }
    }

    if (method === "cod") {
      return "COD order exceeded the confirmation window without being accepted by staff";
    }

    return `Order in pending status exceeded expiration window (method: ${method ?? "unknown"})`;
  }

  return `Order in status "${order.status}" exceeded expiration window`;
}
