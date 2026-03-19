/**
 * ORDER CONSTANTS - Single Source of Truth
 *
 * All order statuses, transitions, priorities, and UI configurations
 * are defined here to avoid duplication and maintain consistency
 * across the entire application.
 */

// ============================================
// ORDER STATUSES
// ============================================

export const ORDER_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  PREPARING: "preparing",
  READY: "ready",
  DISPATCHED: "dispatched",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
  EXPIRED: "expired",
} as const;

/**
 * Type-safe OrderStatus - derived from constants
 * This ensures TypeScript validation matches actual status values
 */
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

// ============================================
// STATUS PRIORITY (for sorting)
// ============================================

/**
 * Priority ranking for sorting orders
 * Lower number = higher priority (appears first)
 *
 * Use case: Staff dashboard shows highest-priority orders first
 */

export const STATUS_PRIORITY: Record<OrderStatus, number> = {
  [ORDER_STATUSES.PAID]: 0, // Needs immediate attention
  [ORDER_STATUSES.PENDING]: 1, // Awaiting payment
  [ORDER_STATUSES.PREPARING]: 2, // In kitchen
  [ORDER_STATUSES.READY]: 3, // Ready for pickup/delivery
  [ORDER_STATUSES.DISPATCHED]: 4, // On the way
  [ORDER_STATUSES.COMPLETED]: 5, // Done
  [ORDER_STATUSES.CANCELLED]: 6, // Cancelled
  [ORDER_STATUSES.FAILED]: 7, // Payment failed
  [ORDER_STATUSES.EXPIRED]: 8, // Expired
};

// ============================================
// STATUS TRANSITIONS (State Machine)
// ============================================
 
/**
 * Valid transitions between statuses
 * Defines what status an order can move to from its current status
 * 
 * null = no transition allowed (terminal state)
 */

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  [ORDER_STATUSES.PENDING]: null,                        // Waiting for payment, staff doesn't transition this
  [ORDER_STATUSES.PAID]: ORDER_STATUSES.PREPARING,      // Staff accepts the paid order
  [ORDER_STATUSES.PREPARING]: ORDER_STATUSES.READY,     // Food ready
  [ORDER_STATUSES.READY]: ORDER_STATUSES.DISPATCHED,    // Dispatch to customer
  [ORDER_STATUSES.DISPATCHED]: ORDER_STATUSES.COMPLETED, // Delivery complete
  [ORDER_STATUSES.COMPLETED]: null,                      // Terminal state
  [ORDER_STATUSES.CANCELLED]: null,                      // Terminal state
  [ORDER_STATUSES.FAILED]: null,                         // Terminal state (payment failed)
  [ORDER_STATUSES.EXPIRED]: null,                        // Terminal state
};

// ============================================
// UI ACTION CONFIGURATION
// ============================================
 
/**
 * UI button configuration for order actions
 * Contains label and styling for each status's primary action
 * 
 * null = no action button shown for this status
 */
export const ORDER_ACTION_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: string;
  } | null
> = {
  [ORDER_STATUSES.PENDING]: null,
  [ORDER_STATUSES.PAID]: {
    label: "Accept Order",
    variant: "bg-[#ef4501] hover:bg-[#c13500]",
  },
  [ORDER_STATUSES.PREPARING]: {
    label: "Mark as Ready",
    variant: "bg-green-700 hover:bg-green-800",
  },
  [ORDER_STATUSES.READY]: {
    label: "Dispatch",
    variant: "bg-orange-500 hover:bg-orange-600",
  },
  [ORDER_STATUSES.DISPATCHED]: {
    label: "Mark Completed",
    variant: "bg-amber-500 hover:bg-amber-600",
  },
  [ORDER_STATUSES.COMPLETED]: null,
  [ORDER_STATUSES.CANCELLED]: null,
  [ORDER_STATUSES.FAILED]: null,
  [ORDER_STATUSES.EXPIRED]: null,
};

// ============================================
// TIMELINE FIELD MAPPING
// ============================================
 
/**
 * Maps each status to its corresponding timeline field
 * When an order transitions to a status, update this field with current time
 */
export const TIMELINE_FIELD_MAP: Record<
  OrderStatus,
  | "paidAt"
  | "preparingAt"
  | "readyAt"
  | "dispatchedAt"
  | "completedAt"
  | "cancelledAt"
  | "failedAt"
  | "expiredAt"
  | null
> = {
  [ORDER_STATUSES.PENDING]: null,        // No timestamp on pending
  [ORDER_STATUSES.PAID]: "paidAt",
  [ORDER_STATUSES.PREPARING]: "preparingAt",
  [ORDER_STATUSES.READY]: "readyAt",
  [ORDER_STATUSES.DISPATCHED]: "dispatchedAt",
  [ORDER_STATUSES.COMPLETED]: "completedAt",
  [ORDER_STATUSES.CANCELLED]: "cancelledAt",
  [ORDER_STATUSES.FAILED]: "failedAt",
  [ORDER_STATUSES.EXPIRED]: "expiredAt",
};

// ============================================
// HELPER FUNCTIONS
// ============================================
 
/**
 * Check if an order can transition from one status to another
 * @param currentStatus - Current order status
 * @param targetStatus - Target status to transition to
 * @returns true if transition is valid
 */
export function canTransitionTo(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  const nextStatus = STATUS_TRANSITIONS[currentStatus];
  return nextStatus === targetStatus;
}
 
/**
 * Get the next valid status for an order
 * @param currentStatus - Current order status
 * @returns Next valid status, or null if no transition allowed
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  return STATUS_TRANSITIONS[currentStatus];
}
 
/**
 * Get the action config for a status
 * @param status - Order status
 * @returns Action config with label and variant, or null
 */
export function getActionConfig(
  status: OrderStatus
): { label: string; variant: string } | null {
  return ORDER_ACTION_CONFIG[status];
}
 
/**
 * Get priority score for a status (for sorting)
 * @param status - Order status
 * @returns Priority number (lower = higher priority)
 */
export function getPriority(status: OrderStatus): number {
  return STATUS_PRIORITY[status];
}
 
/**
 * Get timeline field name for a status
 * @param status - Order status
 * @returns Timeline field name, or null
 */
export function getTimelineField(
  status: OrderStatus
): keyof typeof TIMELINE_FIELD_MAP | null {
  return TIMELINE_FIELD_MAP[status] as any;
}
 
/**
 * Validate if a value is a valid OrderStatus
 * @param value - Value to check
 * @returns true if value is a valid OrderStatus
 */
export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return Object.values(ORDER_STATUSES).includes(value as any);
}
