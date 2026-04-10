/**
 * MONGOOSE ORDER SCHEMA
 *
 * Uses ORDER_STATUSES from orderConstants.ts to ensure
 * frontend and backend stay in sync
 */

import { ORDER_STATUSES } from "@/types/orderConstants";
import { model, models, Schema } from "mongoose";

// ============================================
// ORDER ITEM SCHEMA (Embedded)
// ============================================

/**
 * Embedded cart item snapshot
 * Captures product state at time of order
 */
export const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: {
      type: String,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// ============================================
// TIMELINE SCHEMA (Subdocument)
// ============================================

/**
 * Tracks when order transitions between statuses
 * Maps to TIMELINE_FIELD_MAP in orderConstants.ts
 */

const TimelineSchema = new Schema(
  {
    // Payment events
    paidAt: Date,
    failedAt: Date,
    expiredAt: Date,

    // Preparation events
    preparingAt: Date,
    readyAt: Date,

    // Delivery events
    dispatchedAt: Date,
    completedAt: Date,

    // Cancellation
    cancelledAt: Date,
  },
  { _id: false },
);

// ============================================
// MAIN ORDER SCHEMA
// ============================================

const OrderSchema = new Schema(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true
    },
    branchSnapshot: {
      name: String, // captured at order time
      code: String, // e.g. OR-001
      address: String,
      contactNumber: String
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
      required: true,
      index: true, // Frequently queried field
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },

    paymentInfo: {
      checkoutId: String,
      referenceNumber: String,
      paymentId: String,
      paymentStatus: String,

      method: {
        type: {
          type: String // "card" || "maya-wallet" 
        },
        description: String, // "Visa ending 0008" — Maya provides this
        last4: String, // card only, null for maya-wallet
        scheme: String // "visa" | "mastercard" | null for maya-wallet
      },

      // Customer details
      customerName: {
        type: String,
        required: true,
      },
      customerEmail: {
        type: String,
        lowercase: true,
      },
      customerPhone: {
        type: String,
        required: true,
      },
    },

    total: {
      subTotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      total: { type: Number, required: true },
    },

    estimatedTime: { type: String, default: "30-45 minutes" },

    // Timeline of status changes
    timeline: {
      type: TimelineSchema,
      default: {},
    },

    // Delivery/dispatch information
    dispatchInfo: {
      riderId: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
      },
      riderName: String,
      riderPhone: String,
      vehicleType: String, // motorcycle, car, etc.
    },

    note: String,

    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    reviewedAt: Date,
  },
  { timestamps: true },
);

// ============================================
// INDEXES
// ============================================

// Optimize queries by status
OrderSchema.index({ status: 1, createdAt: -1 });

// Optimize customer queries
OrderSchema.index({ "paymentInfo.customerEmail": 1 });

// Optimize review queries
OrderSchema.index({ isReviewed: 1, reviewedAt: -1 });

OrderSchema.index({ branchId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, isReviewed: 1 });

export const Order = models.Order || model("Order", OrderSchema);
