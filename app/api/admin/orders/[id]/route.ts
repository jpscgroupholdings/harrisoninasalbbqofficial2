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
import { PAYMENT_STATUSES, PaymentStatus } from "@/types/paymentConstants";
import { Inventory } from "@/models/Inventory";
import mongoose, { ClientSession } from "mongoose";
import {
  awardPromoCardVoucherForOrder,
  refundCustomerVoucher,
} from "@/services/promoCardBenefits";
import { canAccess } from "@/lib/roleBasedAccessCtrl";

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
    if (!canAccess(staff.role, "orders.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(id).lean();

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

    // Return order data in consistent format
    return NextResponse.json({
      ...order,
      _id: order._id.toString(),
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

export async function completeInventory(
  orderId: mongoose.Types.ObjectId,
  branchId: string,
  session: ClientSession,
) {
  const inventoryDocs = await Inventory.find(
    { branchId, "reservations.orderId": orderId },
    { reservations: 1 },
    { session },
  );

  // Already processed on a previous attempt — safe no-op
  if (inventoryDocs.length === 0) return;

  for (const inv of inventoryDocs) {
    const reservation = inv.reservations.find(
      (r: { orderId: string; quantity: number }) =>
        r.orderId.toString() === orderId.toString(),
    );

    if (!reservation) continue; // already cleared, skip

    await Inventory.updateOne(
      {
        _id: inv._id,
        "reservations.orderId": orderId, // idempotent guard — same pattern as reserveInventory
      },
      {
        $pull: { reservations: { orderId } },
        $inc: { quantity: -reservation.quantity },
      },
      { session },
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
  // ============================================
  // VALIDATE INPUTS (before any DB/transaction)
  // ============================================

  const { id } = await context.params;

  if (!id || id.length !== 24) {
    return NextResponse.json(
      { error: "Invalid order ID format" },
      { status: 400 },
    );
  }

  const staff = await requireAdmin(request);
  if (!canAccess(staff.role, "orders.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status: newStatus } = body;

  if (!newStatus) {
    return NextResponse.json(
      { error: "Status is required", example: { status: "preparing" } },
      { status: 400 },
    );
  }

  if (!isValidOrderStatus(newStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status: "${newStatus}"`,
        validStatuses: Object.values(STATUS_TRANSITIONS).flat().filter(Boolean),
      },
      { status: 400 },
    );
  }

  // ============================================
  // FETCH ORDER (before transaction — read-only)
  // ============================================

  await connectDB();

  const order = await Order.findById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

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

  const currentStatus = order.status as OrderStatus;
  const paymentMethod = order.paymentInfo?.paymentMethod as "cod" | "maya";
  const paymentStatus = order.paymentInfo?.paymentStatus as PaymentStatus;

  if (currentStatus === ORDER_STATUSES.PENDING_PAYMENT) {
    return NextResponse.json(
      {
        error:
          "Maya orders awaiting payment cannot be updated by admin. Wait for payment confirmation or automatic expiry.",
        currentStatus,
        paymentMethod,
      },
      { status: 400 },
    );
  }

  if (
    paymentMethod === "maya" &&
    currentStatus === ORDER_STATUSES.PENDING &&
    newStatus === ORDER_STATUSES.PREPARING &&
    paymentStatus !== PAYMENT_STATUSES.PAYMENT_SUCCESS
  ) {
    return NextResponse.json(
      {
        error:
          "Maya orders cannot be accepted while payment is still pending. Wait for payment confirmation first.",
        currentStatus,
        paymentMethod,
        requiredStatus: PAYMENT_STATUSES.PAYMENT_SUCCESS,
      },
      { status: 400 },
    );
  }

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
  // TRANSACTION (writes only)
  // ============================================

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const updateData: Record<string, any> = { status: newStatus };

      const timelineField = getTimelineField(newStatus);
      if (timelineField) {
        updateData[`timeline.${timelineField}`] = new Date();
      }

      await Order.updateOne({ _id: id }, { $set: updateData }, { session });

      if (newStatus === ORDER_STATUSES.COMPLETED) {
        await completeInventory(order._id, order.branchId, session);
        await awardPromoCardVoucherForOrder(order, session);
      }

      if (newStatus === ORDER_STATUSES.CANCELLED) {
        await refundCustomerVoucher(
          order.customerId,
          order.total?.voucherDiscountAmount ?? 0,
          session,
        );
      }
    });

    // ============================================
    // POST-TRANSACTION SIDE EFFECTS
    // ============================================

    const updatedOrder = await Order.findById(id);

    if (newStatus === ORDER_STATUSES.COMPLETED) {
      const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: order.paymentInfo.customerEmail,
        subject: getStatusSubject(
          ORDER_STATUSES.COMPLETED,
          order.paymentInfo.referenceNumber,
        ),
        react: OrderSummaryEmail({ order: updatedOrder }),
      });

      if (emailError) {
        console.error("[PATCH order] Email failed:", emailError);
      }
    }

    return NextResponse.json({
      _id: updatedOrder._id.toString(),
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
      previousStatus: currentStatus,
      timeline: updatedOrder.timeline || {},
      message: `Order status updated from ${currentStatus} to ${newStatus}`,
    });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id] error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Invalid order data", details: error.message },
        { status: 400 },
      );
    }

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
  } finally {
    await session.endSession();
  }
}
