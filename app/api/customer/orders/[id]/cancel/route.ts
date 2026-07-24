import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Inventory } from "@/models/Inventory";
import { Order } from "@/models/Orders";
import { refundCustomerVoucher } from "@/services/promoCardBenefits";
import { logOrderCancelledByCustomer } from "@/services/activityLog.service";
import {
  canTransitionTo,
  getTimelineField,
  ORDER_STATUSES,
  OrderStatus,
} from "@/types/orderConstants";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectDB();

  let session: mongoose.ClientSession | null = null;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { reason, notes } = body;

    // Validate MongoDB ObjectId format
    if (!getValidObjectId(id)) {
      return getAPIError("Invalid order ID format", 400);
    }

    const customer = await requireBetterAuth(request);

    const order = await Order.findById(id);

    if (!order) {
      return getAPIError("Order not found", 404);
    }

    // Ownership check — guest orders have no customerId
    if (
      order.customerId &&
      (!customer || order.customerId.toString() !== customer._id.toString())
    ) {
      return getAPIError("Forbidden", 403);
    }

    // ============================================
    // VALIDATE STATUS TRANSITION
    // ============================================

    const currentStatus = order.status as OrderStatus;
    // Check if transition is valid
    if (!canTransitionTo(currentStatus, ORDER_STATUSES.CANCELLED, "customer")) {
      return getAPIError(
        `Cannot cancel order with status "${order.status}"`,
        400,
        {
          extra: {
            currentStatus: order.status,
          },
        },
      );
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Auto-update timeline when status changes
    const timelineField = getTimelineField(ORDER_STATUSES.CANCELLED);

    const updateResult = await Order.updateOne(
      { _id: id, status: currentStatus },
      {
        $set: {
          status: ORDER_STATUSES.CANCELLED,
          ...(timelineField && { [`timeline.${timelineField}`]: new Date() }),
          terminationDetails: {
            reason: reason || undefined,
            notes: notes || undefined,
            changedBy: customer?._id,
            changedByRole: "customer",
            changedAt: new Date(),
          },
        },
      },
      { session },
    );

    if (updateResult.matchedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      session = null;

      return getAPIError(
        "Order status changed. Please refresh and try again",
        409,
      );
    }

    // Release inventory reservations - $pull is idempotent, safe to retry
    for (const item of order.items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, branchId: order.branchId },
        { $pull: { reservations: { orderId: order._id } } },
        { session },
      );
    }

    await refundCustomerVoucher(
      order.customerId,
      order.total?.voucherDiscountAmount ?? 0,
      session,
    );

    // Log the cancellation (inside transaction for consistency)
    if (order.customerId) {
      await logOrderCancelledByCustomer({
        orderId: order._id,
        customerId: order.customerId,
        branchId: order.branchId,
        referenceNumber: order.paymentInfo?.referenceNumber,
        reason,
        notes,
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();
    session = null;

    return NextResponse.json({
      message: "Order cancelled successfully!",
      _id: order._id.toString(),
      status: ORDER_STATUSES.CANCELLED,
    });
  } catch (error: any) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    return getAPIError(error, 500, {
      fallbackMessage: "Failed to cancel order.",
    });
  }
}