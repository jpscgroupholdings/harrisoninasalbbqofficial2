import { inngest } from "../client";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Inventory } from "@/models/Inventory";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";

export const expireOrder = inngest.createFunction(
  { id: "expire-pending-order", triggers: { event: "order/created" } },
  async ({ event, step }) => {
    const sleepDuration = event.data.paymentMethod === "maya" ? "30m" : "4h";

    // Wait 30 minutes before doing anything
    await step.sleep("wait-for-payment-window", sleepDuration);

    // After 30 mins, check and expire if still pending
    await step.run("check-and-expire-order", async () => {
      await connectDB();

      const order = await Order.findById(event.data.orderId);

      if (!order) {
        return { skipped: true, reason: "Order not found" };
      }

      // Only expire if still PENDING (not paid, cancelled, etc.)
      if (order.status !== ORDER_STATUSES.PENDING) {
        return { skipped: true, reason: `Order is already ${order.status}` };
      }

      if (
        order.paymentInfo?.paymentMethod === "maya" &&
        order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS
      ) {
        return {
          skipped: true,
          reason: "Payment method is maya and already paid.",
        };
      }

      // Release reserved inventory for each item
      await Inventory.updateMany(
        { branchId: order.branchId, "reservations.orderId": order._id },
        { $pull: { reservations: { orderId: order._id } } },
      );

      // Mark order as expired
      await Order.findByIdAndUpdate(order._id, {
        status: ORDER_STATUSES.EXPIRED,
        "timeline.expiredAt": new Date(),
      });

      return { expired: true, orderId: order._id };
    });
  },
);
