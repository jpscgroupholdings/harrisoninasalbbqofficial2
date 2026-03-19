import { CartItem } from "./MenuTypes";
import { OrderStatus } from "./orderConstants";

/**
 * ORDER TYPES - TypeScript Interfaces
 *
 * These interfaces use OrderStatus from orderConstants.ts
 * to ensure type consistency across the app
 */

export interface OrderType {
  _id: string;
  createdAt: string;
  status: OrderStatus;

  items: CartItem[];
  paymentInfo: {
    method: string;
    paymentLinkId?: string;
    checkoutUrl?: string;
    referenceNumber?: string;

    paymentId?: string;
    paymentStatus: string;
    paidAt: Date;

    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  total: {
    subTotal: number;
    tax?: number;
    total: number;
  };
  estimatedTime: string;

  // Additional tracking info
  timeline?: {
    paidAt?: string;
    preparingAt?: string;
    readyAt?: string;
    dispatchedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    failedAt?: string;
    expiredAt?: string;
  };

  dispatchInfo?: {
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    vehicleType?: string;
  };
  notes?: string;

  isReviewed?: boolean;
  reviewedAt?: string;
}

// Order response
export interface OrdersApiResponse {
  data: OrderType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    status: string | null;
    email: string | null;
    sortBy: string;
  };
}

// ============================================
// API PAYLOADS
// ============================================

/**
 * Payload for creating a new order
 * Sent to /api/paymaya/checkout
 */

export interface CreateOrderPayload {
  items: CartItem[];
  subTotal: number;
}

/**
 * Response from order creation
 * Contains payment redirect information
 */

export interface CreateOrderResponse {
  orderId: string;
  redirectUrl: string;
  referenceNumber: string;
  status: OrderStatus;
}

/**
 * Payload for updating order status
 * Sent to /api/orders/:id
 */

export interface UpdateOrderPayLoad {
  status: OrderStatus;
}

/**
 * Response from order update
 */

export interface UpdateOrderResponse {
  _id: string;
  status: OrderStatus;
  updatedAt?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Represents a completed order action with timeline
 */

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: string;
  timelineField: string | null;
}

/**
 * Represents order sorting criteria
 */
export interface OrderSortOptions {
  byPriority?: boolean; // Use STATUS_PRIORITY
  byDate?: "asc" | "desc";
}
