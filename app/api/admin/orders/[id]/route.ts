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
  ORDER_STATUSES,
  canTransitionTo,
  getNextStatus,
  getTimelineField,
  FULFILLMENT_TYPE,
} from "@/types/orderConstants";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { getStatusSubject } from "@/app/api/paymaya/webhook/route";
import OrderSummaryEmail from "@/app/emails/OrderSummaryEmail";
import ReservationConfirmedEmail from "@/app/emails/ReservationConfirmedEmail";
import { PAYMENT_STATUSES, PaymentStatus } from "@/types/paymentConstants";
import { Inventory } from "@/models/Inventory";
import mongoose, { ClientSession } from "mongoose";
import {
  awardPromoCardVoucherForOrder,
  refundCustomerVoucher,
} from "@/services/promoCardBenefits";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { logOrderStatusChange } from "@/services/activityLog.service";
import { getAPIError } from "@/lib/getApiError";
import { getValidObjectId } from "@/helper/getValidObjectIds";

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
      return getAPIError("Forbidden", 403);
    }

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id || !getValidObjectId(id)) {
      return getAPIError("Invalid order ID format");
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return getAPIError("Ordre not found", 404);
    }

    // Check if staff is authorized for this order's branch
    if (
      staff.role === STAFF_ROLES.ADMIN &&
      order.branchId?.toString() !== staff.branch?.toString()
    ) {
      return getAPIError(
        "Access denied. This order does not belong to  your branch",
      );
    }

    // Return order data in consistent format
    return NextResponse.json({
      ...order,
      _id: order._id.toString(),
      paymentInfo: {
        ...order.paymentInfo,
        // Computed: true only when both paymentStatus and paymentId confirm a real transaction
        paymentConfirmed:
          order.paymentInfo?.paymentStatus === "PAYMENT_SUCCESS" &&
          !!order.paymentInfo?.paymentId,
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch order. Please try again",
    });
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

  if (!id || !getValidObjectId(id)) {
    return getAPIError("Invalid order ID format");
  }

  const staff = await requireAdmin(request);
  if (!canAccess(staff.role, "orders.update")) {
    return getAPIError("Forbidden", 403);
  }

  const body = await request.json();
  let { status: newStatus } = body;

  if (!newStatus) {
    return getAPIError("Status is required", 400, {
      extra: { status: "preparing" },
    });
  }

  if (!isValidOrderStatus(newStatus)) {
    return getAPIError(`Invalid status "${newStatus}`, 400, {
      extra: {
        validStatuses: Object.values(STATUS_TRANSITIONS).flat().filter(Boolean),
      },
    });
  }

  // ============================================
  // FETCH ORDER (before transaction — read-only)
  // ============================================

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

  const currentStatus = order.status as OrderStatus;
  const paymentMethod = order.paymentInfo?.paymentMethod as "cod" | "maya";
  const paymentStatus = order.paymentInfo?.paymentStatus as PaymentStatus;

  if (currentStatus === ORDER_STATUSES.PENDING_PAYMENT) {
    return getAPIError(
      "Maya orders awaiting payment cannot be updated by admin. Wait for payment confirmation or automatic expiry",
      400,
      { extra: { currentStatus, paymentMethod } },
    );
  }

  // Dine-in reservations must be accepted (→ confirmed) before preparing.
  // If admin tries to go straight to preparing, redirect to confirmed first
  const isDineInReservation =
    order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN &&
    order.reservation?.scheduledAt;

  if (
    currentStatus === ORDER_STATUSES.PENDING &&
    newStatus === ORDER_STATUSES.PREPARING &&
    isDineInReservation
  ) {
    newStatus = ORDER_STATUSES.CONFIRMED;
  }

  // Guard: Maya pending → confirmed (reservation acceptance) requires verified payment
  if (
    paymentMethod === "maya" &&
    currentStatus === ORDER_STATUSES.PENDING &&
    newStatus === ORDER_STATUSES.CONFIRMED &&
    (paymentStatus !== PAYMENT_STATUSES.PAYMENT_SUCCESS ||
      !order.paymentInfo?.paymentId)
  ) {
    return getAPIError(
      "Maya orders cannot be accepted while payment is still pending. Wait for payment confirmation first.",
      400,
      {
        extra: {
          currentStatus,
          paymentMethod,
          requiredStatus: PAYMENT_STATUSES.PAYMENT_SUCCESS,
        },
      },
    );
  }

  // Guard: Maya pending → preparing (non-reservation) requires verified payment
  if (
    paymentMethod === "maya" &&
    currentStatus === ORDER_STATUSES.PENDING &&
    newStatus === ORDER_STATUSES.PREPARING &&
    (paymentStatus !== PAYMENT_STATUSES.PAYMENT_SUCCESS ||
      !order.paymentInfo?.paymentId)
  ) {
    return getAPIError(
      "Maya orders cannot be accepted while payment is still pending. Wait for payment confirmation first.",
      400,
      {
        extra: {
          currentStatus,
          paymentMethod,
          requiredStatus: PAYMENT_STATUSES.PAYMENT_SUCCESS,
        },
      },
    );
  }

  // Guard: Maya confirmed (reservation) orders must have verified payment before preparing
  if (
    paymentMethod === "maya" &&
    currentStatus === ORDER_STATUSES.CONFIRMED &&
    newStatus === ORDER_STATUSES.PREPARING &&
    (paymentStatus !== PAYMENT_STATUSES.PAYMENT_SUCCESS ||
      !order.paymentInfo?.paymentId)
  ) {
    return getAPIError(
      "This reservation cannot be started — payment has not been verified. Check the payment status before proceeding.",
      400,
      {
        extra: {
          currentStatus,
          paymentMethod,
          paymentStatus,
          hasPaymentId: !!order.paymentInfo?.paymentId,
        },
      },
    );
  }

  // Guard: confirmed reservations can only start preparing within 1 hour of scheduled time
  if (
    currentStatus === ORDER_STATUSES.CONFIRMED &&
    newStatus === ORDER_STATUSES.PREPARING &&
    order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN &&
    order.reservation?.scheduledAt
  ) {
    const scheduledTime = new Date(order.reservation.scheduledAt).getTime();
    const oneHourBefore = scheduledTime - 60 * 60 * 1000;

    if (Date.now() < oneHourBefore) {
      const scheduledDate = new Date(order.reservation.scheduledAt);
      return getAPIError(
        `This reservation is scheduled for ${scheduledDate.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}. You can start preparing 1 hour before the scheduled time.`,
        400,
        {
          extra: {
            scheduledAt: order.reservation.scheduledAt,
            earliestStart: new Date(oneHourBefore).toISOString(),
          },
        },
      );
    }
  }

  if (!canTransitionTo(currentStatus, newStatus, "admin")) {
    return getAPIError(
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      400,
      {
        extra: {
          currentStatus,
          allowedNextStatus:
            getNextStatus(currentStatus) ?? "no transitions allowed",
        },
      },
    );
  }

  if (
    (order.fulfillmentType === FULFILLMENT_TYPE.PICKUP ||
      order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN) &&
    newStatus === ORDER_STATUSES.DISPATCH
  ) {
    return getAPIError(
      "Pickup and dine-in orders should be marked ready for pickup",
      400,
    );
  }

  if (
    order.fulfillmentType === FULFILLMENT_TYPE.DELIVERY &&
    newStatus === ORDER_STATUSES.READY_FOR_PICKUP
  ) {
    return getAPIError("Delivery orders should be dispatched", 400);
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

      // When admin accepts a dine-in reservation, record confirmedAt
      if (
        currentStatus === ORDER_STATUSES.PENDING &&
        newStatus === ORDER_STATUSES.CONFIRMED &&
        isDineInReservation
      ) {
        updateData["timeline.confirmedAt"] = new Date();
      }

      await Order.updateOne({ _id: id }, { $set: updateData }, { session });

      // Record who changed the status
      await logOrderStatusChange({
        orderId: order._id,
        staffId: staff._id,
        branchId: order.branchId,
        referenceNumber: order.paymentInfo?.referenceNumber,
        fromStatus: currentStatus,
        toStatus: newStatus,
        session,
      });

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

    // Send reservation confirmed email when admin accepts a dine-in reservation
    if (
      currentStatus === ORDER_STATUSES.PENDING &&
      newStatus === ORDER_STATUSES.CONFIRMED &&
      isDineInReservation
    ) {
      const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: order.paymentInfo.customerEmail,
        subject: `Reservation Confirmed — ${order.branchSnapshot?.name ?? "Harrison's"}`,
        react: ReservationConfirmedEmail({ order: updatedOrder }),
      });

      if (emailError) {
        console.error("[PATCH order] Reservation email failed:", emailError);
      }
    }

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

    return getAPIError(error, 500, {
      fallbackMessage: "Failed to update order",
    });
  } finally {
    await session.endSession();
  }
}
