/**
 * UPCOMING RESERVATION ALERT — Inngest event-driven
 *
 * Triggered when a dine-in order with a reservation is created.
 * Sleeps until 30 minutes before the scheduled time, then creates
 * a notification so staff can prepare.
 *
 * If the reservation is less than 30 min away, notifies immediately.
 * If the order is cancelled/expired before the sleep ends, skips.
 */

import { inngest } from "../client";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { notifyUpcomingReservation } from "@/services/notification.service";
import "@/models/Notification";

const ADVANCE_NOTICE_MS = 30 * 60 * 1000; // 30 minutes

export const upcomingReservationAlert = inngest.createFunction(
  {
    id: "upcoming-reservation-alert",
    triggers: { event: "order/created" },
  },
  async ({ event, step }) => {
    // Only process dine-in orders
    await step.run("validate-dine-in", async () => {
      await connectDB();
      const order = await Order.findById(event.data.orderId).lean();

      if (!order) throw new Error("Order not found");
      if (order.fulfillmentType !== "dine_in" || !order.reservation?.scheduledAt) {
        // Not a dine-in reservation — bail out early
        return { skipped: true, reason: "Not a dine-in reservation" };
      }

      return {
        skipped: false,
        scheduledAt: order.reservation.scheduledAt,
        customerName: `${order.paymentInfo?.firstName ?? ""} ${order.paymentInfo?.lastName ?? ""}`.trim(),
        partySize: order.reservation.partySize ?? 1,
        referenceNumber: order.paymentInfo?.referenceNumber ?? "",
        branchId: order.branchId.toString(),
      };
    });

    // Calculate sleep duration: wake up 30 min before scheduled time
    const sleepUntil = await step.run("calculate-sleep", async () => {
      await connectDB();
      const order = await Order.findById(event.data.orderId).lean();
      if (!order?.reservation?.scheduledAt) return null;

      const scheduledTime = new Date(order.reservation.scheduledAt).getTime();
      const alertTime = scheduledTime - ADVANCE_NOTICE_MS;

      // If alert time is already in the past, don't sleep — fire immediately
      if (alertTime <= Date.now()) return null;

      return new Date(alertTime).toISOString();
    });

    if (sleepUntil) {
      await step.sleepUntil("wait-until-30min-before", sleepUntil);
    }

    // Final check: is the order still active?
    await step.run("notify-if-still-active", async () => {
      await connectDB();
      const order = await Order.findById(event.data.orderId).lean();

      if (!order) return { skipped: true, reason: "Order not found" };

      // Skip if order was cancelled, expired, or failed
      const terminalStatuses = [
        ORDER_STATUSES.CANCELLED,
        ORDER_STATUSES.EXPIRED,
        ORDER_STATUSES.FAILED,
      ];
      if (terminalStatuses.includes(order.status)) {
        return { skipped: true, reason: `Order is ${order.status}` };
      }

      if (!order.reservation?.scheduledAt) {
        return { skipped: true, reason: "No reservation found" };
      }

      await notifyUpcomingReservation({
        orderId: order._id.toString(),
        branchId: order.branchId.toString(),
        referenceNumber: order.paymentInfo?.referenceNumber ?? "",
        customerName: `${order.paymentInfo?.firstName ?? ""} ${order.paymentInfo?.lastName ?? ""}`.trim(),
        partySize: order.reservation.partySize ?? 1,
        scheduledAt: order.reservation.scheduledAt.toISOString(),
      });

      return { notified: true };
    });
  },
);
