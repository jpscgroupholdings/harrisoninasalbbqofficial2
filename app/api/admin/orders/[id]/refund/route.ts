/**
 * REFUND API ROUTE - /api/admin/orders/[id]/refund
 *
 * Allows admin to process a refund on completed or cancelled orders.
 * Refund is independent of order status — tracked in the refund subdocument.
 */

import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { logActivity, ACTOR_TYPE } from "@/services/activityLog.service";
import { getAPIError } from "@/lib/getApiError";
import { getValidObjectId } from "@/helper/getValidObjectIds";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !getValidObjectId(id)) {
      return getAPIError("Invalid order ID format");
    }

    const staff = await requireAdmin(request);
    if (!canAccess(staff.role, "orders.update")) {
      return getAPIError("Forbidden", 403);
    }

    const { reason, notes, amount } = await request.json();

    if (!reason) {
      return getAPIError("A reason is required to process a refund", 400);
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return getAPIError("Order not found", 404);
    }

    if (
      staff.role === STAFF_ROLES.ADMIN &&
      order.branchId?.toString() !== staff.branch?.toString()
    ) {
      return getAPIError(
        "Access denied. This order does not belong to your branch",
        403,
      );
    }

    const currentStatus = order.status;

    // Refund is only available on completed or cancelled orders
    const refundableStatuses = [
      ORDER_STATUSES.COMPLETED,
      ORDER_STATUSES.CANCELLED,
    ];

    if (!refundableStatuses.includes(currentStatus)) {
      return getAPIError(
        `Refunds can only be processed on completed or cancelled orders. Current status: "${currentStatus}"`,
        400,
      );
    }

    // Already refunded
    if (order.refund?.status === "processed") {
      return getAPIError("This order has already been refunded", 400);
    }

    const refundAmount = amount ?? order.total?.totalAmount ?? 0;

    // Update the refund subdocument
    await Order.updateOne(
      { _id: id },
      {
        $set: {
          "refund.status": "processed",
          "refund.amount": refundAmount,
          "refund.reason": reason,
          "refund.notes": notes || undefined,
          "refund.processedBy": staff._id,
          "refund.processedAt": new Date(),
        },
      },
    );

    // Log the refund event
    await logActivity({
      branchId: order.branchId,
      actor: { actorType: ACTOR_TYPE.STAFF, staffId: staff._id },
      target: {
        entityType: "Order",
        entityId: order._id,
        label: order.paymentInfo?.referenceNumber,
      },
      category: "order",
      action: "order.refunded",
      summary: `Refund of ₱${refundAmount.toFixed(2)} processed for order ${order.paymentInfo?.referenceNumber ?? ""} — ${reason}`,
      metadata: {
        reason,
        notes,
        amount: refundAmount,
        orderStatus: currentStatus,
      },
    });

    return NextResponse.json({
      _id: order._id.toString(),
      refund: {
        status: "processed",
        amount: refundAmount,
        reason,
        processedAt: new Date(),
      },
      message: `Refund of ₱${refundAmount.toFixed(2)} processed successfully`,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/orders/[id]/refund error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to process refund",
    });
  }
}
