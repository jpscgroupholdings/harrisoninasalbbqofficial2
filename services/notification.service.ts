/**
 * NOTIFICATION SERVICE
 *
 * Type-safe helpers for creating and managing admin notifications.
 * Follows the fire-and-forget pattern from activityLog.service.ts —
 * creation failures never break the primary operation.
 *
 * Also manages an in-memory SSE subscriber registry so that new
 * notifications are pushed to connected clients in real time.
 */

import { PipelineStage, Types } from "mongoose";
import { Notification } from "@/models/Notification";
import { NotificationType } from "@/types/notification";
import { StaffRole } from "@/types/staff";

// ---------------------------------------------------------------------------
// SSE subscriber registry (in-memory, per serverless instance)
// ---------------------------------------------------------------------------

export interface SSESubscriber {
  /** Branch filter — "all" means superadmin watching everything */
  branchId: string;
  staffId: string;
  role: StaffRole;
  /** Writable side of the ReadableStream passed to the SSE route */
  controller: ReadableStreamDefaultController<Uint8Array>;
}

/** branchId → Set of subscribers watching that branch */
const subscribers = new Map<string, Set<SSESubscriber>>();

/** "all" key used by superadmins who watch every branch */
const ALL_BRANCHES_KEY = "__all__";

export function addSubscriber(sub: SSESubscriber) {
  const key = sub.branchId === "all" ? ALL_BRANCHES_KEY : sub.branchId;
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(sub);
}

export function removeSubscriber(sub: SSESubscriber) {
  const key = sub.branchId === "all" ? ALL_BRANCHES_KEY : sub.branchId;
  subscribers.get(key)?.delete(sub);
  if (subscribers.get(key)?.size === 0) subscribers.delete(key);
}

/** Push an SSE event to all matching subscribers */
function pushToSubscribers(data: {
  type: string;
  payload: Record<string, unknown>;
}) {
  const encoded = new TextEncoder().encode(
    `data: ${JSON.stringify(data)}\n\n`,
  );

  const branchKey = String(data.payload.branchId);

  // Collect matching subscribers: branch-specific + "all" watchers
  const targets: SSESubscriber[] = [];

  const branchSubs = subscribers.get(branchKey);
  if (branchSubs) targets.push(...branchSubs);

  const allSubs = subscribers.get(ALL_BRANCHES_KEY);
  if (allSubs) targets.push(...allSubs);

  for (const sub of targets) {
    // Role gate — only push to staff whose role is in targetRoles
    const allowedRoles = data.payload.targetRoles as string[] | undefined;
    if (allowedRoles && !allowedRoles.includes(sub.role)) continue;

    try {
      sub.controller.enqueue(encoded);
    } catch {
      // Subscriber disconnected — will be cleaned up on next push or close
      removeSubscriber(sub);
    }
  }
}

// ---------------------------------------------------------------------------
// Create notification
// ---------------------------------------------------------------------------

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  branchId: Types.ObjectId | string;
  targetRoles?: StaffRole[];
  link?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification and broadcast to connected SSE clients.
 * Fire-and-forget — errors are caught so this never breaks the caller.
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    const doc = await Notification.create({
      type: params.type,
      title: params.title,
      message: params.message,
      branchId: new Types.ObjectId(String(params.branchId)),
      targetRoles: params.targetRoles ?? ["superadmin", "admin", "cashier"],
      link: params.link ?? null,
      metadata: params.metadata ?? {},
    });

    // Broadcast to SSE subscribers
    pushToSubscribers({
      type: "notification",
      payload: {
        _id: doc._id.toString(),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        branchId: doc.branchId.toString(),
        targetRoles: doc.targetRoles,
        link: doc.link,
        metadata: doc.metadata,
        readBy: [],
        createdAt: doc.createdAt?.toISOString(),
        isRead: false,
      },
    });
  } catch (err) {
    console.error("[Notification] Failed to create:", err, params);
  }
}

// ---------------------------------------------------------------------------
// Query notifications
// ---------------------------------------------------------------------------

export interface GetNotificationsParams {
  staffId: string;
  branchId: string; // "all" for superadmin
  role: StaffRole;
  limit?: number;
  cursor?: string; // notification _id for pagination
  unreadOnly?: boolean;
}

export interface NotificationDoc {
  _id: string;
  type: string;
  title: string;
  message: string;
  branchId: string;
  targetRoles: string[];
  link: string | null;
  metadata: Record<string, unknown>;
  readBy: { staffId: string; readAt: string }[];
  createdAt: string;
  isRead: boolean;
}

export interface GetNotificationsResult {
  notifications: NotificationDoc[];
  unreadCount: number;
  totalCount: number;
  nextCursor: string | null;
}

/**
 * Fetch paginated notifications for a staff member.
 * Computes isRead per-notification based on readBy array.
 */
export async function getNotifications(
  params: GetNotificationsParams,
): Promise<GetNotificationsResult> {
  const { staffId, branchId, role, limit = 20, cursor, unreadOnly = false } = params;

  const matchStage: Record<string, unknown> = {
    targetRoles: role,
  };

  // Branch filter — superadmins with "all" see every branch
  if (branchId !== "all") {
    matchStage.branchId = new Types.ObjectId(branchId);
  }

  // Cursor-based pagination (load older)
  if (cursor) {
    matchStage._id = { $lt: new Types.ObjectId(cursor) };
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $addFields: {
        isRead: {
          $in: [new Types.ObjectId(staffId), "$readBy.staffId"],
        },
      },
    },
  ];

  if (unreadOnly) {
    pipeline.push({ $match: { isRead: false } });
  }

  const notifications = await Notification.aggregate(pipeline);

  // Count total unread for badge
  const unreadMatch: Record<string, unknown> = {
    targetRoles: role,
    "readBy.staffId": { $ne: new Types.ObjectId(staffId) },
  };
  if (branchId !== "all") {
    unreadMatch.branchId = new Types.ObjectId(branchId);
  }
  const unreadCount = await Notification.countDocuments(unreadMatch);

  // Total count for this branch
  const totalMatch: Record<string, unknown> = { targetRoles: role };
  if (branchId !== "all") {
    totalMatch.branchId = new Types.ObjectId(branchId);
  }
  const totalCount = await Notification.countDocuments(totalMatch);

  const nextCursor =
    notifications.length === limit
      ? (notifications[notifications.length - 1] as { _id: Types.ObjectId })
          ._id.toString()
      : null;

  return {
    notifications: notifications.map((n: any) => ({
      ...n,
      _id: n._id.toString(),
      branchId: n.branchId.toString(),
    })) as NotificationDoc[],
    unreadCount,
    totalCount,
    nextCursor,
  };
}

// ---------------------------------------------------------------------------
// Mark as read
// ---------------------------------------------------------------------------

/**
 * Mark a single notification as read for a staff member.
 * Idempotent — pushing the same staffId twice is a no-op.
 */
export async function markAsRead(
  notificationId: string,
  staffId: string,
): Promise<void> {
  await Notification.updateOne(
    {
      _id: new Types.ObjectId(notificationId),
      "readBy.staffId": { $ne: new Types.ObjectId(staffId) },
    },
    {
      $push: {
        readBy: { staffId: new Types.ObjectId(staffId), readAt: new Date() },
      },
    },
  );
}

/**
 * Mark all notifications for a branch as read for a staff member.
 */
export async function markAllAsRead(
  staffId: string,
  branchId: string,
  role: StaffRole,
): Promise<{ modifiedCount: number }> {
  const match: Record<string, unknown> = {
    targetRoles: role,
    "readBy.staffId": { $ne: new Types.ObjectId(staffId) },
  };
  if (branchId !== "all") {
    match.branchId = new Types.ObjectId(branchId);
  }

  const result = await Notification.updateMany(match, {
    $push: {
      readBy: { staffId: new Types.ObjectId(staffId), readAt: new Date() },
    },
  });

  return { modifiedCount: result.modifiedCount };
}

// ---------------------------------------------------------------------------
// Convenience builders — keep trigger sites clean
// ---------------------------------------------------------------------------

/** Notify admins about a new order */
export function notifyNewOrder(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  customerName: string;
  totalAmount: number;
  fulfillmentType: string;
  paymentMethod: string;
}) {
  const fulfillmentLabel =
    params.fulfillmentType === "dine_in"
      ? "dine-in"
      : params.fulfillmentType;

  return createNotification({
    type: params.fulfillmentType === "dine_in" ? "reservation" : "new_order",
    title: `New Order ${params.referenceNumber}`,
    message: `${params.customerName} placed a ₱${params.totalAmount.toLocaleString()} ${fulfillmentLabel} order via ${params.paymentMethod.toUpperCase()}`,
    branchId: params.branchId,
    link: `/orders?id=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      fulfillmentType: params.fulfillmentType,
      paymentMethod: params.paymentMethod,
    },
  });
}

/** Notify admins about a payment confirmation */
export function notifyPaymentConfirmed(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  amount: number;
}) {
  return createNotification({
    type: "payment_confirmed",
    title: `Payment Confirmed ${params.referenceNumber}`,
    message: `₱${params.amount.toLocaleString()} payment received via Maya`,
    branchId: params.branchId,
    link: `/orders?id=${params.orderId}`,
    metadata: { orderId: params.orderId },
  });
}

/** Notify admins about an order status change */
export function notifyOrderStatusChange(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  fromStatus: string;
  toStatus: string;
}) {
  const isCancelled = params.toStatus === "cancelled";
  const label = params.toStatus.replace("_", " ");

  return createNotification({
    type: isCancelled ? "order_cancelled" : "order_status",
    title: isCancelled
      ? `Order ${params.referenceNumber} Cancelled`
      : `Order ${params.referenceNumber} — ${label}`,
    message: isCancelled
      ? `Order ${params.referenceNumber} has been cancelled`
      : `Order ${params.referenceNumber} moved from ${params.fromStatus.replace("_", " ")} to ${label}`,
    branchId: params.branchId,
    link: `/orders?id=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
    },
  });
}

/** Notify admins about low stock */
export function notifyLowStock(params: {
  productId: string;
  productName: string;
  branchId: string;
  quantity: number;
  reorderLevel: number;
}) {
  const isOutOfStock = params.quantity <= 0;

  return createNotification({
    type: "low_stock",
    title: isOutOfStock
      ? `${params.productName} is Out of Stock`
      : `${params.productName} — Low Stock`,
    message: isOutOfStock
      ? `${params.productName} has run out of stock at this branch`
      : `${params.productName} has ${params.quantity} left (reorder level: ${params.reorderLevel})`,
    branchId: params.branchId,
    link: `/inventories`,
    metadata: {
      productId: params.productId,
      quantity: params.quantity,
      reorderLevel: params.reorderLevel,
    },
    targetRoles: ["superadmin", "admin"],
  });
}

/** Notify admins about a new customer review */
export function notifyNewReview(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  rating: number;
  comment: string | null;
}) {
  const isLowRating = params.rating <= 2;
  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);

  return createNotification({
    type: "new_review",
    title: isLowRating
      ? `⚠️ Low Rating on ${params.referenceNumber}`
      : `New Review on ${params.referenceNumber}`,
    message: `${stars}${params.comment ? ` — "${params.comment.slice(0, 100)}"` : ""}`,
    branchId: params.branchId,
    link: `/reviews`,
    metadata: {
      orderId: params.orderId,
      rating: params.rating,
    },
  });
}

/** Notify admins about a stale pending order */
export function notifyStaleOrder(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  pendingMinutes: number;
}) {
  return createNotification({
    type: "stale_order",
    title: `Order ${params.referenceNumber} Needs Attention`,
    message: `This order has been pending for ${params.pendingMinutes} minutes without being accepted`,
    branchId: params.branchId,
    link: `/orders?id=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      pendingMinutes: params.pendingMinutes,
    },
  });
}

/** Notify admins about an upcoming dine-in reservation */
export function notifyUpcomingReservation(params: {
  orderId: string;
  branchId: string;
  referenceNumber: string;
  customerName: string;
  partySize: number;
  scheduledAt: string;
}) {
  return createNotification({
    type: "upcoming_reservation",
    title: `Reservation in 30 min — ${params.referenceNumber}`,
    message: `${params.customerName} (party of ${params.partySize}) arriving at ${new Date(params.scheduledAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`,
    branchId: params.branchId,
    link: `/reservations`,
    metadata: {
      orderId: params.orderId,
      scheduledAt: params.scheduledAt,
      partySize: params.partySize,
    },
    targetRoles: ["superadmin", "admin", "cashier"],
  });
}
