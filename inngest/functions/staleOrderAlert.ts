/**
 * STALE ORDER ALERT — Inngest cron (every 5 minutes)
 *
 * Scans for pending orders that have been waiting >15 minutes
 * without being accepted by staff. Creates a notification so
 * admins don't forget about them.
 *
 * Only fires once per order (guarded by the Notification model's
 * metadata.orderId + type:"stale_order" check).
 */

import { inngest } from "../client";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Notification } from "@/models/Notification";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { notifyStaleOrder } from "@/services/notification.service";
import "@/models/Notification";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export const staleOrderAlert = inngest.createFunction(
  {
    id: "stale-order-alert",
    triggers: [{ cron: "*/5 * * * *" }], // every 5 minutes
  },
  async ({ step }) => {
    await step.run("check-stale-orders", async () => {
      await connectDB();

      const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

      // Find orders still pending beyond the threshold
      const staleOrders = await Order.find({
        status: {
          $in: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PENDING_PAYMENT],
        },
        createdAt: { $lt: cutoff },
      })
        .select("_id branchId paymentInfo createdAt")
        .lean();

      if (staleOrders.length === 0) return { checked: 0, notified: 0 };

      let notified = 0;

      for (const order of staleOrders) {
        // Skip if we already sent a stale notification for this order
        const alreadyNotified = await Notification.exists({
          type: "stale_order",
          "metadata.orderId": order._id.toString(),
        });

        if (alreadyNotified) continue;

        const pendingMinutes = Math.round(
          (Date.now() - new Date(order.createdAt).getTime()) / 60000,
        );

        await notifyStaleOrder({
          orderId: order._id.toString(),
          branchId: order.branchId.toString(),
          referenceNumber: order.paymentInfo?.referenceNumber ?? "",
          pendingMinutes,
        });

        notified++;
      }

      return { checked: staleOrders.length, notified };
    });
  },
);
