import { CartItem } from "./MenuTypes";

export interface OrderType {
  _id: string;
  createdAt: string;
  status:
    | "pending"
    | "paid"
    | "preparing"
    | "dispatched"
    | "ready"
    | "completed"
    | "cancelled";

  items: CartItem[];
  paymentInfo: {
    method: string;
    paymentLinkId?: string;
    checkoutUrl?: string;
    referenceNumber?: string;

    paidAt: Date;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  total: {
    subTotal: number;
    total: number;
  };
  estimatedTime: string;

  // Additional tracking info
  timeline?: {
    paidAt?: string;
    preparingAt?: string;
    dispatchedAt?: string;
    readyAt?: string;
    completedAt?: string;
    cancelledAt?: string;
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

export interface CreateOrderPayload {
  items: CartItem[];
  subTotal: number;
}

export interface CreateOrderResponse {
  orderId: string;
  redirectUrl: string;
  referenceNumber: string;
  status: OrderType["status"];
}

export interface UpdateOrderPayLoad {
  status: OrderType["status"];
}

export interface UpdateOrderResponse {
  _id: string;
  status: OrderType["status"];
}
