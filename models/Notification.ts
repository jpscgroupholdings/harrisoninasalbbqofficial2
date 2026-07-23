/**
 * NOTIFICATION SCHEMA
 *
 * Stores admin-panel notifications for events like new orders,
 * low stock alerts, payment confirmations, etc.
 *
 * Notifications are branch-scoped and role-targeted.
 * Each staff member tracks their own read state via the readBy array.
 */

import { model, models, Schema } from "mongoose";
import { NOTIFICATION_TYPES, NotificationType } from "@/types/notification";

const ReadBySchema = new Schema(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const NotificationSchema = new Schema(
  {
    /** Broad event category */
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },

    /** Short headline, e.g. "New Order #OR-001" */
    title: { type: String, required: true },

    /** Longer description shown in the dropdown */
    message: { type: String, required: true },

    /** Which branch this notification belongs to */
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    /** Which staff roles should see this (e.g. ["superadmin", "admin", "cashier"]) */
    targetRoles: {
      type: [String],
      default: ["superadmin", "admin", "cashier"],
    },

    /** Optional deep link into the admin panel (e.g. "/orders?id=xxx") */
    link: { type: String, default: null },

    /** Arbitrary extra data (orderId, productId, etc.) */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /** Staff members who have read this notification */
    readBy: {
      type: [ReadBySchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Optimise common queries
NotificationSchema.index({ branchId: 1, createdAt: -1 });
NotificationSchema.index({ "readBy.staffId": 1 });

export const Notification =
  models.Notification || model("Notification", NotificationSchema);
