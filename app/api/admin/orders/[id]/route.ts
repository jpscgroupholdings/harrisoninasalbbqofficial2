/**
 * ORDER API ROUTE - /api/orders/[id]
 * 
 * Handles GET (fetch single order) and PATCH (update order status)
 * Uses orderConstants.ts for validation and status transitions
 */

import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";
import {
  OrderStatus,
  STATUS_TRANSITIONS,
  isValidOrderStatus,
  TIMELINE_FIELD_MAP,
} from "@/types/orderConstants";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";

// ============================================
// GET /api/orders/[id]
// ============================================

/**
 * Fetch a single order by ID
 * Returns complete order data in consistent format
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const staff = await requireAdmin(request)

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

     // Check if staff is authorized for this order's branch
    if (
      staff.role !== STAFF_ROLES.SUPERADMIN &&
      order.branchId?.toString() !== staff.branch?.toString()
    ) {
      return NextResponse.json(
        { error: "Access denied. This order does not belong to your branch." },
        { status: 403 },
      );
    }

    // Return order data in consistent format
    return NextResponse.json({
      _id: order._id.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      status: order.status,
      items: order.items,
      paymentInfo: {
        method: order.paymentInfo?.method || "paymaya",
        paymentLinkId: order.paymentInfo?.checkoutId,
        checkoutUrl: order.paymentInfo?.checkoutUrl,
        referenceNumber: order.paymentInfo?.referenceNumber,
        paymentId: order.paymentInfo?.paymentId,
        paymentStatus: order.paymentInfo?.paymentStatus,
        paidAt: order.paymentInfo?.paidAt,
        customerName: order.paymentInfo?.customerName,
        customerEmail: order.paymentInfo?.customerEmail,
        customerPhone: order.paymentInfo?.customerPhone,
      },
      total: order.total,
      estimatedTime: order.estimatedTime,
      timeline: order.timeline || {},
      dispatchInfo: order.dispatchInfo || null,
      notes: order.notes,
      isReviewed: order.isReviewed,
      reviewedAt: order.reviewedAt,
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error:  error instanceof Error ? error.message : "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/orders/[id]
// ============================================

/**
 * Update order status with validation
 * Uses STATUS_TRANSITIONS from constants for safe state transitions
 * Automatically updates timeline when status changes
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { status: newStatus } = body;

    // Check if status provided
    if (!newStatus) {
      return NextResponse.json(
        {
          error: "Status is required",
          example: { status: "preparing" },
        },
        { status: 400 }
      );
    }

    // Validate new status is a valid OrderStatus
    if (!isValidOrderStatus(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status: "${newStatus}"`,
          validStatuses: Object.values(STATUS_TRANSITIONS).flat().filter(Boolean),
        },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ============================================
    // VALIDATE STATUS TRANSITION
    // ============================================

    const currentStatus = order.status as OrderStatus;
    const allowedNextStatus = STATUS_TRANSITIONS[currentStatus as keyof typeof STATUS_TRANSITIONS];

    // Check if transition is valid
    if (allowedNextStatus !== newStatus) {
      const transitionMap = Object.entries(STATUS_TRANSITIONS).reduce(
        (acc, [status, nextStatus]) => {
          acc[status] = nextStatus;
          return acc;
        },
        {} as Record<string, string | null>
      );

      return NextResponse.json(
        {
          error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
          currentStatus,
          allowedNextStatus: allowedNextStatus || "no transitions allowed",
          allTransitions: transitionMap,
        },
        { status: 400 }
      );
    }

    // ============================================
    // UPDATE ORDER STATUS
    // ============================================

    const previousStatus = order.status;
    order.status = newStatus;

    // ============================================
    // UPDATE TIMELINE
    // ============================================

    // Auto-update timeline when status changes
    const timelineField = TIMELINE_FIELD_MAP[newStatus as keyof typeof TIMELINE_FIELD_MAP];

    if (timelineField && timelineField !== null) {
      if (!order.timeline) {
        order.timeline = {};
      }
      order.timeline[timelineField] = new Date();
    }

    // Save order
    await order.save();

    // ============================================
    // RETURN RESPONSE
    // ============================================

    return NextResponse.json({
      _id: order._id.toString(),
      status: order.status,
      updatedAt: order.updatedAt,
      previousStatus,
      timeline: order.timeline || {},
      message: `Order status updated from ${previousStatus} to ${newStatus}`,
    });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id] error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Invalid order data", details: error.message },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid MongoDB ID)
    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order" },
      { status: 500 }
    );
  }
}