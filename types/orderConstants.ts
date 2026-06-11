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
  PENDING_PAYMENT: "pending_payment",
  PENDING: "pending",
  PREPARING: "preparing",
  DISPATCH: "dispatch",
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

// =================== USED for select options =====================
export const ORDER_STATUS_FILTER_LIST = [
  ORDER_STATUSES.PENDING_PAYMENT,
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.DISPATCH,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED,
  ORDER_STATUSES.FAILED,
  ORDER_STATUSES.EXPIRED,
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_FILTER_LIST.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

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
  [ORDER_STATUSES.PENDING_PAYMENT]: 1, // Awaiting external payment
  [ORDER_STATUSES.PENDING]: 2, // Awaiting staff action
  [ORDER_STATUSES.PREPARING]: 3, // In kitchen
  [ORDER_STATUSES.DISPATCH]: 4, // Ready for pickup/delivery
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

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[] | null> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CANCELLED,
    ORDER_STATUSES.FAILED,
    ORDER_STATUSES.EXPIRED,
  ],
  [ORDER_STATUSES.PENDING]: [
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.CANCELLED,
  ], // Accept order for cod
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.DISPATCH], // Food ready/dispatch
  [ORDER_STATUSES.DISPATCH]: [ORDER_STATUSES.COMPLETED], // Dispatch to customer
  [ORDER_STATUSES.COMPLETED]: null, // Terminal state
  [ORDER_STATUSES.CANCELLED]: null, // Terminal state
  [ORDER_STATUSES.FAILED]: null, // Terminal state (payment failed)
  [ORDER_STATUSES.EXPIRED]: null, // Terminal state
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
  Partial<
    Record<
      OrderStatus,
      {
        label: string;
        variant: string;
        roles?: ("admin" | "customer")[];
        paymentMethods?: ("cod" | "maya")[];
      }
    >
  >
> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: {
    [ORDER_STATUSES.CANCELLED]: {
      label: "Cancel Order",
      variant: "bg-red-600 hover:bg-red-700",
      roles: ["customer"],
      paymentMethods: ["maya"],
    },
  },

  [ORDER_STATUSES.PENDING]: {
    [ORDER_STATUSES.PREPARING]: {
      label: "Accept Order",
      variant: "bg-[#ef4501] hover:bg-[#c13500]",
      roles: ["admin"],
      paymentMethods: ["cod", "maya"],
    },

    [ORDER_STATUSES.CANCELLED]: {
      label: "Cancel Order",
      variant: "bg-red-600 hover:bg-red-700",
      roles: ["customer"],
    },
  },

  [ORDER_STATUSES.PREPARING]: {
    [ORDER_STATUSES.DISPATCH]: {
      label: "Dispatch / Ready",
      variant: "bg-green-700 hover:bg-green-800",
      roles: ["admin"],
    },
  },


  [ORDER_STATUSES.DISPATCH]: {
    [ORDER_STATUSES.COMPLETED]: {
      label: "Mark Completed",
      variant: "bg-amber-500 hover:bg-amber-600",
      roles: ["admin"],
    },
  },

  [ORDER_STATUSES.COMPLETED]: {},
  [ORDER_STATUSES.CANCELLED]: {},
  [ORDER_STATUSES.FAILED]: {},
  [ORDER_STATUSES.EXPIRED]: {},
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
  | "dispatchedAt"
  | "dispatchedAt"
  | "completedAt"
  | "cancelledAt"
  | "failedAt"
  | "expiredAt"
  | null
> = {
  [ORDER_STATUSES.PENDING]: null, // No timestamp on pending
  [ORDER_STATUSES.PENDING_PAYMENT]: null, // No timestamp until terminal/paid
  [ORDER_STATUSES.PREPARING]: "preparingAt",
  [ORDER_STATUSES.DISPATCH]: "dispatchedAt",
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
  targetStatus: OrderStatus,
  role: "admin" | "customer",
): boolean {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  if (!allowed?.includes(targetStatus)) return false;

  if (role === "customer") {
    return targetStatus === ORDER_STATUSES.CANCELLED;
  }

  if (role === "admin") {
    return targetStatus !== ORDER_STATUSES.CANCELLED;
  }

  return false;
}

/**
 * Get the next valid status for an order
 * @param currentStatus - Current order status
 * @returns Next valid status, or null if no transition allowed
 */
export function getNextStatus(
  currentStatus: OrderStatus,
): OrderStatus[] | null {
  return STATUS_TRANSITIONS[currentStatus];
}

/**
 * Get the action config for a status
 * @param status - Order status
 * @returns Action config with label and variant, or null
 */
export function getActionConfig(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
) {
  return ORDER_ACTION_CONFIG[currentStatus]?.[targetStatus] ?? null;
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
  status: OrderStatus,
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
