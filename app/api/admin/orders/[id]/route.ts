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
  ORDER_STATUSES,
  canTransitionTo,
  getNextStatus,
  getTimelineField,
} from "@/types/orderConstants";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { getStatusSubject } from "@/app/api/paymaya/webhook/route";
import OrderSummaryEmail from "@/app/emails/OrderSummaryEmail";
import { OrderType } from "@/types/OrderTypes";

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
    const staff = await requireAdmin(request);

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if staff is authorized for this order's branch
    if (
      staff.role !== STAFF_ROLES.SUPERADMIN &&
      staff.role !== STAFF_ROLES.CASHIER &&
      order.branchId?.toString() !== staff.branch?.toString()
    ) {
      return NextResponse.json(
        { error: "Access denied. This order does not belong to your branch." },
        { status: 403 },
      );
    }

    const orderData = order.toObject();

    // Return order data in consistent format
    return NextResponse.json({
      ...orderData,
      _id: orderData._id.toString(),
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch order",
      },
      { status: 500 },
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
        { status: 400 },
      );
    }

    await requireAdmin(request);

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
        { status: 400 },
      );
    }

    // Validate new status is a valid OrderStatus
    if (!isValidOrderStatus(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status: "${newStatus}"`,
          validStatuses: Object.values(STATUS_TRANSITIONS)
            .flat()
            .filter(Boolean),
        },
        { status: 400 },
      );
    }

    // Fetch order
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ============================================
    // VALIDATE STATUS TRANSITION
    // ============================================

    const currentStatus = order.status as OrderStatus;
    // Check if transition is valid
    if (!canTransitionTo(currentStatus, newStatus, "admin")) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
          currentStatus,
          allowedNextStatus:
            getNextStatus(currentStatus) ?? "no transitions allowed",
        },
        { status: 400 },
      );
    }

    // ============================================
    // UPDATE ORDER STATUS
    // ============================================

    const previousStatus = order.status;
    const updateData: Record<string, any> = {
      status: newStatus,
    };

    // ============================================
    // UPDATE TIMELINE
    // ============================================

    // Auto-update timeline when status changes
    const timelineField = getTimelineField(newStatus);

    if (timelineField && timelineField !== null) {
      updateData[`timeline.${timelineField}`] = new Date();
    }

    // Save order
    await Order.updateOne({ _id: id }, { $set: updateData });
    const updatedOrder = await Order.findById(id);

    if (newStatus === ORDER_STATUSES.COMPLETED) {
      const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: order.paymentInfo.customerEmail,
        subject: getStatusSubject(
          order.status,
          order.paymentInfo.referenceNumber,
        ),
        react: OrderSummaryEmail({ order: order }),
      });

      if (emailError) {
        console.error("[Maya Webhook] Email failed:", emailError);
      }
    }

    // ============================================
    // RETURN RESPONSE
    // ============================================

    return NextResponse.json({
      _id: updatedOrder._id.toString(),
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
      previousStatus,
      timeline: updatedOrder.timeline || {},
      message: `Order status updated from ${previousStatus} to ${newStatus}`,
    });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id] error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Invalid order data", details: error.message },
        { status: 400 },
      );
    }

    // Handle cast errors (invalid MongoDB ID)
    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update order",
      },
      { status: 500 },
    );
  }
}
