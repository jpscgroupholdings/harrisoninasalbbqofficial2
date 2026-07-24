import { CartItem, ModifierSelection } from "./MenuTypes";
import { FulfillmentType, OrderStatus } from "./orderConstants";

/**
 * ORDER TYPES - TypeScript Interfaces
 *
 * These interfaces use OrderStatus from orderConstants.ts
 * to ensure type consistency across the app
 */

/** Snapshot of a single modifier item within a group, stored on the order */
export interface OrderModifierSelectionItem {
  productId: string;
  name: string;
  label: string | null;
  upgradePrice: number;
  quantity: number;
}

/** Snapshot of a modifier group selection, stored on the order item */
export interface OrderModifierSelection {
  groupId: string;
  groupName: string;
  isMain: boolean;
  linkedToGroupId: string | null;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  maxQty: number;
  items: OrderModifierSelectionItem[];
}

export interface OrderItem {
  productId: string; // ref to Product — this is what you use for reviews
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string; // ObjectId as string
  quantity: number;
  /** Modifier group selections for combo/set products — empty for solo items */
  modifierSelections?: OrderModifierSelection[];
  // no _id — your schema has _id: false
}

export interface OrderType {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;

  branchId?: string;
  customerId?: string;

  branchSnapshot?: {
    name: string;
    code: string;
    address: string;
    contactNumber: string;
    location?: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude] — GeoJSON order
    };
  };

  /** Reservation details — only present for dine-in orders */
  reservation?: {
    scheduledAt?: string;
    partySize?: number;
  };

  /** Declared pickup time — only present for pickup orders */
  pickupTime?: string;

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

    // Computed by API: true only when paymentStatus === PAYMENT_SUCCESS AND paymentId exists
    paymentConfirmed?: boolean;

    shippingAddress?: {
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
    subtotalAmount?: number;
    discountAmount?: number;
    discountCode?: string;
    productDiscountAmount?: number;
    productDiscountPromotions?: {
      promotionId: string;
      name: string;
      productId: string;
      productName: string;
      discountAmount: number;
    }[];
    orderDiscountAmount?: number;
    orderDiscountPromotionId?: string;
    orderDiscountPromotionName?: string;
    voucherDiscountAmount?: number;
    deliveryFeeAmount?: number;
    rawDeliveryFee?: number;
    deliveryDistanceKm?: number;
    deliveryBillableKm?: number;
    freeDeliveryApplied?: boolean;
  };
  estimatedTime: string;

  // Additional tracking info
  timeline?: {
    paidAt?: string;
    confirmedAt?: string;
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
    hasNextPage: boolean;
    hasPrevPage: boolean;
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
  fulfillmentType?: FulfillmentType;
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  items: {
    _id: string;
    quantity: number;
    /** Modifier selections for combo/set products — omitted for solo items */
    modifierSelections?: ModifierSelection[];
  }[];

  paymentMethod: string;
  applyPromoCardDiscount?: boolean;
  voucherAmount?: number;

  /** When true, uses Maya QR PH endpoint (direct QR code) instead of the full checkout page */
  useQrPh?: boolean;

  /** Reservation details — required when fulfillmentType is "dine_in" */
  reservation?: {
    scheduledAt: string; // ISO date string
    partySize: number;
  };

  /** Declared pickup time — required when fulfillmentType is "pickup" (ISO date string) */
  pickupTime?: string;

  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    zipCode: string;
    country: "Philippines";

    // optional but VERY useful for delivery apps
    placeName?: string;
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
