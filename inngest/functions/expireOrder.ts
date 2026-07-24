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
    // Maya: 6h — webhook may fail/retry (Maya retries: immediate → 5m → 15m → 45m).
    // The longer window gives admin time to notice and manually verify payment
    // before a paid order is accidentally expired. If in doubt, admin can check
    // the Maya dashboard and manually update the order.
    // COD: 8h — gives admin time to review and manage manually.
    const sleepDuration = event.data.paymentMethod === "maya" ? "6h" : "8h";

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

      // ── PAID = SKIP EXPIRY ──────────────────────────────────────────
      // As long as the order is paid, never auto-expire it.
      // Paid orders in pending are waiting for admin to accept —
      // admin manages them manually (accept, cancel, or refund).
      const isPaymentConfirmed =
        order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS &&
        !!order.paymentInfo?.paymentId;

      if (isPaymentConfirmed) {
        return {
          skipped: true,
          reason: `Order is paid (paymentId: ${order.paymentInfo?.paymentId}) — paid orders are managed manually by admin, not auto-expired`,
        };
      }

      // ── NOT PAID = EXPIRE ───────────────────────────────────────────
      // Maya: payment was never completed → expire
      // COD: no payment by design → expire after the extended window
      // Reservation not paid (Maya stuck in pending_payment) → expire

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
        terminationDetails: {
          reason: expirationReason,
          changedByRole: "system",
          changedAt: new Date(),
        },
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
  fulfillmentType?: string;
  paymentInfo?: {
    paymentMethod?: string;
    paymentStatus?: string;
    paymentId?: string;
  };
}): string {
  const method = order.paymentInfo?.paymentMethod;
  const isDineIn = order.fulfillmentType === "dine_in";

  if (order.status === ORDER_STATUSES.PENDING_PAYMENT) {
    return "Payment window elapsed — Maya payment was never completed";
  }

  if (order.status === ORDER_STATUSES.PENDING) {
    if (method === "maya") {
      return "Maya order in pending without confirmed payment — webhook may have failed or payment was never completed";
    }

    if (method === "cod" && isDineIn) {
      return "COD reservation exceeded the expiry window without being accepted by admin";
    }

    if (method === "cod") {
      return "COD order exceeded the expiry window without being accepted by staff";
    }

    return `Order in pending status exceeded expiration window (method: ${method ?? "unknown"})`;
  }

  return `Order in status "${order.status}" exceeded expiration window`;
}
