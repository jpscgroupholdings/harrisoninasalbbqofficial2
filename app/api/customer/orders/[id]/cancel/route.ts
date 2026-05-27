import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Inventory } from "@/models/Inventory";
import { Order } from "@/models/Orders";
import {
  canTransitionTo,
  getTimelineField,
  ORDER_STATUSES,
  OrderStatus,
} from "@/types/orderConstants";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const customer = await requireBetterAuth(request);

    const order = await Order.findById(id).session(session);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ownership check — guest orders have no customerId
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
    if (!canTransitionTo(currentStatus, ORDER_STATUSES.CANCELLED, "customer")) {
      return NextResponse.json(
        {
          error: `Cannot cancel order with status "${order.status}"`,
          currentStatus: order.status,
        },
        { status: 400 },
      );
    }

    // Auto-update timeline when status changes
    const timelineField = getTimelineField(ORDER_STATUSES.CANCELLED);

    await Order.updateOne(
      { _id: id },
      {
        $set: {
          status: ORDER_STATUSES.CANCELLED,
          ...(timelineField && { [`timeline.${timelineField}`]: new Date() }),
        },
      },
      { session },
    );

    // Release inventory reservations - $pull is idempotent, safe to retry
    for (const item of order.items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, branchId: order.branchId },
        { $pull: { reservations: { orderId: order._id } } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      message: "Order cancelled successfully!",
      _id: order._id.toString(),
      status: ORDER_STATUSES.CANCELLED,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel order.",
      },
      { status: 500 },
    );
  }
}
