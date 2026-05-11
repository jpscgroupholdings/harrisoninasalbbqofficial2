import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  canTransitionTo,
  getNextStatus,
  getTimelineField,
  isValidOrderStatus,
  ORDER_ACTION_CONFIG,
  ORDER_STATUSES,
  OrderStatus,
  STATUS_PRIORITY,
  STATUS_TRANSITIONS,
} from "@/types/orderConstants";
import { requireBetterAuth } from "@/lib/getAuth";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { getStatusSubject } from "@/app/api/paymaya/webhook/route";
import OrderSummaryEmail from "@/app/emails/OrderSummaryEmail";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      _id: order._id.toString(),
    });
  } catch (error) {
    console.error("GET guest order error:", error);

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

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

    const customer = await requireBetterAuth();

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

    if (newStatus !== ORDER_STATUSES.CANCELLED) {
      return NextResponse.json(
        { error: "Customers can only cancel orders" },
        { status: 403 },
      );
    }

    if (order.customerId) {
      // Must be logged in
      if (!customer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Must be their own order
      if (order.customerId.toString() !== customer._id.toString()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ============================================
    // VALIDATE STATUS TRANSITION
    // ============================================

    const currentStatus = order.status as OrderStatus;
    // Check if transition is valid
    if (!canTransitionTo(currentStatus, newStatus, "customer")) {
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
