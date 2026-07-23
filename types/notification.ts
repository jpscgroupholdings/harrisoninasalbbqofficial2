/**
 * NOTIFICATION TYPES
 *
 * Centralized types and config for the admin notification system.
 * Maps notification types to their UI representation (icon, color, label).
 */

export const NOTIFICATION_TYPES = {
  new_order: "new_order",
  payment_confirmed: "payment_confirmed",
  order_status: "order_status",
  order_cancelled: "order_cancelled",
  low_stock: "low_stock",
  reservation: "reservation",
  new_review: "new_review",
  stale_order: "stale_order",
  upcoming_reservation: "upcoming_reservation",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** UI config for each notification type — used by the bell dropdown */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  [NOTIFICATION_TYPES.new_order]: {
    icon: "ShoppingBag",
    color: "text-blue-600 bg-blue-50",
    label: "New Order",
  },
  [NOTIFICATION_TYPES.payment_confirmed]: {
    icon: "CreditCard",
    color: "text-green-600 bg-green-50",
    label: "Payment",
  },
  [NOTIFICATION_TYPES.order_status]: {
    icon: "RefreshCw",
    color: "text-amber-600 bg-amber-50",
    label: "Status Update",
  },
  [NOTIFICATION_TYPES.order_cancelled]: {
    icon: "XCircle",
    color: "text-red-600 bg-red-50",
    label: "Cancelled",
  },
  [NOTIFICATION_TYPES.low_stock]: {
    icon: "AlertTriangle",
    color: "text-orange-600 bg-orange-50",
    label: "Low Stock",
  },
  [NOTIFICATION_TYPES.reservation]: {
    icon: "Calendar",
    color: "text-purple-600 bg-purple-50",
    label: "Reservation",
  },
  [NOTIFICATION_TYPES.new_review]: {
    icon: "Star",
    color: "text-yellow-600 bg-yellow-50",
    label: "Review",
  },
  [NOTIFICATION_TYPES.stale_order]: {
    icon: "Clock",
    color: "text-rose-600 bg-rose-50",
    label: "Stale Order",
  },
  [NOTIFICATION_TYPES.upcoming_reservation]: {
    icon: "CalendarClock",
    color: "text-indigo-600 bg-indigo-50",
    label: "Upcoming",
  },
};

/** Shape returned from the API */
export interface NotificationItem {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  branchId: string;
  targetRoles: string[];
  link: string | null;
  metadata: Record<string, unknown>;
  readBy: { staffId: string; readAt: string }[];
  createdAt: string;
  /** Computed on the server per requesting staff */
  isRead: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}
