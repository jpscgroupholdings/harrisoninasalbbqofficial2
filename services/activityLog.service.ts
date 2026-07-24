/**
 * ACTIVITY LOG SERVICE
 *
 * Type-safe helpers for recording audit trail events.
 * All functions are fire-and-forget — they catch their own errors
 * so that logging failures never break the primary operation.
 */

import { ClientSession, Types } from "mongoose";
import { ActivityLog } from "@/models/ActivityLog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const ACTOR_TYPE = {
  CUSTOMER : "customer",
  STAFF : "staff",
  SYSTEM : "system",
  WEBHOOK : "webhook"
} as const

export type ActorType = (typeof ACTOR_TYPE)[keyof typeof ACTOR_TYPE];

export interface LogActivityParams {
  /** Branch this action relates to */
  branchId?: Types.ObjectId | string;
  actor: {
    actorType: ActorType;
    customerId?: Types.ObjectId | string;
    staffId?: Types.ObjectId | string;
  };
  /** What entity was affected */
  target: {
    entityType: string;
    entityId: Types.ObjectId | string;
    /** Human-readable label (e.g. order reference number) */
    label?: string;
  };
  /** Broad category for filtering: "order" | "payment" | "inventory" | etc. */
  category: string;
  /** Specific action: "order.created" | "order.accepted" | etc. */
  action: string;
  /** One-line human-readable summary */
  summary: string;
  /** Structured metadata for the action */
  metadata?: Record<string, unknown>;
  /** Actor's IP address when available */
  ipAddress?: string;
  /** Optional Mongoose session — log participates in caller's transaction */
  session?: ClientSession;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Record an activity log entry.
 *
 * If a session is provided the insert participates in the caller's
 * transaction; otherwise it runs independently. Errors are caught and
 * logged so logging never breaks the primary operation.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const doc = {
      branchId: params.branchId ? new Types.ObjectId(String(params.branchId)) : undefined,
      actor: {
        actorType: params.actor.actorType,
        customerId: params.actor.customerId
          ? new Types.ObjectId(String(params.actor.customerId))
          : undefined,
        staffId: params.actor.staffId
          ? new Types.ObjectId(String(params.actor.staffId))
          : undefined,
      },
      target: {
        entityType: params.target.entityType,
        entityId: new Types.ObjectId(String(params.target.entityId)),
        label: params.target.label,
      },
      category: params.category,
      action: params.action,
      summary: params.summary,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress,
    };

    if (params.session) {
      await ActivityLog.create([doc], { session: params.session });
    } else {
      await ActivityLog.create(doc);
    }
  } catch (err) {
    // Log failures must never break the primary flow
    console.error("[ActivityLog] Failed to record event:", err, params);
  }
}

// ---------------------------------------------------------------------------
// Convenience builders — keep call-sites clean and consistent
// ---------------------------------------------------------------------------

/** Customer created an order (COD or Maya checkout) */
export function logOrderCreated(params: {
  orderId: Types.ObjectId | string;
  customerId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  referenceNumber: string;
  paymentMethod: "cod" | "maya";
  totalAmount: number;
  fulfillmentType?: string;
  session?: ClientSession;
}) {
  return logActivity({
    branchId: params.branchId,
    actor: { actorType: ACTOR_TYPE.CUSTOMER, customerId: params.customerId },
    target: {
      entityType: "Order",
      entityId: params.orderId,
      label: params.referenceNumber,
    },
    category: "order",
    action: "order.created",
    summary: `Order ${params.referenceNumber} created via ${params.paymentMethod.toUpperCase()}`,
    metadata: {
      paymentMethod: params.paymentMethod,
      totalAmount: params.totalAmount,
      fulfillmentType: params.fulfillmentType,
    },
    session: params.session,
  });
}

/** Staff member accepted / changed status of an order */
export function logOrderStatusChange(params: {
  orderId: Types.ObjectId | string;
  staffId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  referenceNumber?: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  notes?: string;
  session?: ClientSession;
}) {
  return logActivity({
    branchId: params.branchId,
    actor: { actorType: ACTOR_TYPE.STAFF, staffId: params.staffId },
    target: {
      entityType: "Order",
      entityId: params.orderId,
      label: params.referenceNumber,
    },
    category: "order",
    action: "order.status_changed",
    summary: `Order status changed from "${params.fromStatus}" to "${params.toStatus}"${params.reason ? ` — ${params.reason}` : ""}`,
    metadata: {
      from: params.fromStatus,
      to: params.toStatus,
      ...(params.reason && { reason: params.reason }),
      ...(params.notes && { notes: params.notes }),
    },
    session: params.session,
  });
}

/** Customer cancelled their own order */
export function logOrderCancelledByCustomer(params: {
  orderId: Types.ObjectId | string;
  customerId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
  session?: ClientSession;
}) {
  return logActivity({
    branchId: params.branchId,
    actor: { actorType: ACTOR_TYPE.CUSTOMER, customerId: params.customerId },
    target: {
      entityType: "Order",
      entityId: params.orderId,
      label: params.referenceNumber,
    },
    category: "order",
    action: "order.cancelled_by_customer",
    summary: `Customer cancelled order ${params.referenceNumber ?? ""}${params.reason ? ` — ${params.reason}` : ""}`,
    metadata: {
      ...(params.reason && { reason: params.reason }),
      ...(params.notes && { notes: params.notes }),
    },
    session: params.session,
  });
}

/** Payment webhook confirmed / failed an order */
export function logPaymentEvent(params: {
  orderId: Types.ObjectId | string;
  branchId?: Types.ObjectId | string;
  referenceNumber?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  session?: ClientSession;
}) {
  return logActivity({
    branchId: params.branchId,
    actor: { actorType: ACTOR_TYPE.WEBHOOK },
    target: {
      entityType: "Order",
      entityId: params.orderId,
      label: params.referenceNumber,
    },
    category: "payment",
    action: `payment.${params.paymentStatus.toLowerCase().replace("_", "")}`,
    summary: `Payment ${params.paymentStatus} for order ${params.referenceNumber ?? ""} via ${params.paymentMethod}`,
    metadata: {
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      paymentId: params.paymentId,
    },
    session: params.session,
  });
}

/** Inventory was reserved, deducted, or restored */
export function logInventoryEvent(params: {
  productId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  quantity: number;
  action: "reserved" | "deducted" | "restored";
  orderId?: Types.ObjectId | string;
  session?: ClientSession;
}) {
  return logActivity({
    branchId: params.branchId,
    actor: { actorType: ACTOR_TYPE.SYSTEM },
    target: {
      entityType: "Inventory",
      entityId: params.productId,
    },
    category: "inventory",
    action: `inventory.${params.action}`,
    summary: `Inventory ${params.action}: ${params.quantity} units`,
    metadata: {
      productId: String(params.productId),
      quantity: params.quantity,
      orderId: params.orderId ? String(params.orderId) : undefined,
    },
    session: params.session,
  });
}

/** Voucher was issued, used, or refunded */
export function logVoucherEvent(params: {
  customerId: Types.ObjectId | string;
  action: "issued" | "used" | "refunded";
  amount?: number;
  sourceType?: string;
  orderId?: Types.ObjectId | string;
  session?: ClientSession;
}) {
  return logActivity({
    actor: { actorType: ACTOR_TYPE.SYSTEM},
    target: {
      entityType: "Voucher",
      entityId: params.customerId,
    },
    category: "voucher",
    action: `voucher.${params.action}`,
    summary: `Voucher ${params.action} for customer`,
    metadata: {
      customerId: String(params.customerId),
      amount: params.amount,
      sourceType: params.sourceType,
      orderId: params.orderId ? String(params.orderId) : undefined,
    },
    session: params.session,
  });
}
