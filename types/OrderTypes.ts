import { CartItem } from "./MenuTypes";
import { OrderStatus } from "./orderConstants";

/**
 * ORDER TYPES - TypeScript Interfaces
 *
 * These interfaces use OrderStatus from orderConstants.ts
 * to ensure type consistency across the app
 */

// Add this new interface
export interface OrderItem {
  productId: string;   // ref to Product — this is what you use for reviews
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;   // ObjectId as string
  quantity: number;
  // no _id — your schema has _id: false
}

export interface OrderType {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;

  branchId?: string;
  customerId?: string;

  branchSnapshot?: {
    name: string;
    code: string;
    address: string;
    contactNumber: string;
  };

  items: OrderItem[];
  paymentInfo: {
    checkoutId?: string;
    referenceNumber?: string;
    paymentId?: string;
    paymentStatus: string;
    paidAt?: Date;

    paymentMethod: "cod" | "maya";

    method: {
      type: string;
      description: string;
      last4?: string;
      scheme?: string;
    };

    firstName: string;
    lastName: string;
    customerEmail: string;
    customerPhone: string;

    shippingAddress: {
      line1: string;
      line2?: string;
      city: string;
      province: string;
      postalCode: string;
      country: "Philippines";

      // optional but VERY useful for delivery apps
      landmark?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };

  total: {
    vatableSales: number;
    vatAmount?: number;
    totalAmount: number;
  };
  estimatedTime: string;

  // Additional tracking info
  timeline?: {
    paidAt?: string;
    preparingAt?: string;
    readyAt?: string;
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
  branchId: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  items: {
    _id: string;
    quantity: number;
  }[];

  paymentMethod: string,

  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    zipCode: string;
    country: "Philippines";

    // optional but VERY useful for delivery apps
    landmark?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
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
