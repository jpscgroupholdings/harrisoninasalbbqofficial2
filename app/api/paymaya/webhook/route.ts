import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
import OrderSummaryEmail from "@/app/emails/OrderSummaryEmail";
import { getMayaClientIP, isMayaAllowedIP } from "@/lib/mayaGuard";
import { connectDB } from "@/lib/mongodb";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { Inventory } from "@/models/Inventory";
import { Order } from "@/models/Orders";
import { ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Maya's current webhook events (use these, NOT the deprecated CHECKOUT_* events)
// Deprecated: CHECKOUT_SUCCESS, CHECKOUT_FAILURE, CHECKOUT_DROPOUT, CHECKOUT_CANCELLED
const PAYMENT_STATUS_MAP: Record<string, string> = {
  PAYMENT_SUCCESS: "pending",
  PAYMENT_FAILED: "failed",
  PAYMENT_EXPIRED: "expired",
  PAYMENT_CANCELLED: "cancelled",
  AUTHORIZED: "authorized", // Card payments only (hold/capture flow)
};

export function getStatusSubject(
  paymentStatus: string,
  referenceNumber?: string,
) {
  const ref = referenceNumber ? ` — ${referenceNumber.toUpperCase()}` : "";

  switch (paymentStatus) {
    case "PAYMENT_SUCCESS":
      return `Order Confirmed${ref}`;
    case "PAYMENT_FAILED":
      return `Your Order Could Not Be Completed${ref}`;
    case "PAYMENT_EXPIRED":
      return `Your Order Has Expired${ref}`;
    default:
      return `Order Update${ref}`;
  }
}

export async function POST(request: NextRequest) {
  // Step 1: IP whitelisting
  // Maya does not use HMAC signatures - security is purely IP-based.

  const clientIP = getMayaClientIP(request);

  if (!isMayaAllowedIP(clientIP)) {
    console.warn(`[Maya Webhook] Blocked unauthorized IP: ${clientIP}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Respond 2xx immediately
  // Maya requires a fast 2xx response. If it doesn't get one, it will retry:
  // → immediately → 5 min → 15 min → 45 min (max 4 retries total)
  // After that, Maya marks the event as failed and stops retrying.
  const ack = NextResponse.json({ received: true }, { status: 200 });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();

    // Step 3: parse payload
    const body = await request.json();
    console.log("[Maya Webhook] Full payload:", JSON.stringify(body, null, 2));

    const {
      id: paymentId,
      status: paymentStatus,
      requestReferenceNumber,
      fundSource,
    } = body;

    if (!paymentStatus || !requestReferenceNumber) {
      console.error("[Maya Webhook] Missing required fields", {
        paymentStatus,
        requestReferenceNumber,
      });
      return ack; // Still 200 — we received it, we just can't process it
    }

    const orderStatus = PAYMENT_STATUS_MAP[paymentStatus];

    const knownStatuses = [
      "PAYMENT_SUCCESS",
      "PAYMENT_FAILED",
      "PAYMENT_EXPIRED",
      "PAYMENT_CANCELLED",
      "AUTHORIZED",
    ];
    if (!knownStatuses.includes(paymentStatus)) {
      console.warn(`[Maya Webhook] Unhandled paymentStatus: ${paymentStatus}`);
      return ack;
    }

    // ✅ Step 4: Idempotency check
    // Maya may send the same event multiple times (retries or manual re-trigger from dashboard)
    const existingOrder = await Order.findOne({
      "paymentInfo.referenceNumber": requestReferenceNumber,
    }).session(session);

    if (!existingOrder) {
      console.error(
        `[Maya Webhook] No order found for referenceNumber: ${requestReferenceNumber}`,
      );
      return ack;
    }

    const finalStatuses = ["failed", "expired", "cancelled"];
    if (finalStatuses.includes(existingOrder.status)) {
      console.log(
        `[Maya Webhook] ⏭️ Skipping — order already in final state: ${existingOrder.status}`,
      );
      return ack;
    }

    // ✅ Step 5: Update the order
    const order = await Order.findOneAndUpdate(
      { "paymentInfo.referenceNumber": requestReferenceNumber },
      {
        $set: {
          status: orderStatus,
          "paymentInfo.paymentId": paymentId ?? null,
          "paymentInfo.paymentStatus": paymentStatus,
          // Timeline tracking per status
          ...(paymentStatus === "PAYMENT_SUCCESS" && {
            "timeline.paidAt": new Date(),
          }),
          ...(paymentStatus === "PAYMENT_FAILED" && {
            "timeline.failedAt": new Date(),
          }),
          ...(paymentStatus === "PAYMENT_EXPIRED" && {
            "timeline.expiredAt": new Date(),
          }),
          ...(orderStatus === "PAYMENT_CANCELLED" && {
            "timeline.cancelledAt": new Date(),
          }),
          "paymentInfo.method": fundSource
            ? {
                type: fundSource.type,
                description: fundSource.description,
                last4: fundSource.last4 ?? null,
                scheme: fundSource.scheme ?? null,
              }
            : null,
        },
      },
      { new: true, session },
    );

    console.log(
      `[Maya Webhook] ✅ Order ${requestReferenceNumber} → ${orderStatus}`,
    );

    if (paymentStatus === "PAYMENT_SUCCESS") {
      for (const item of existingOrder.items) {
        await Inventory.findOneAndUpdate(
          { productId: item.productId, branchId: existingOrder.branchId },
          { $inc: { quantity: -item.quantity, reserved: -item.quantity } },
          { session },
        );
      }
    }

    // in your webhook, after updating order status
    const shouldRestoreStock = ["failed", "expired", "cancelled"].includes(
      orderStatus,
    );

    if (shouldRestoreStock) {
      // restore stock for each item
      for (const item of existingOrder.items) {
        await Inventory.findOneAndUpdate(
          { productId: item.productId, branchId: existingOrder.branchId }, // ← you need productId in OrderItemSchema for this!
          { $inc: { reserved: -item.quantity } },
          { new: true, session },
        );
      }
    }

    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.paymentInfo.customerEmail,
      subject: getStatusSubject(
        paymentStatus,
        order.paymentInfo.referenceNumber,
      ),
      react:
        order.paymentInfo.paymentStatus !== "PAYMENT_SUCCESS"
          ? OrderMessageEmail({ order: order })
          : OrderSummaryEmail({ order: order }),
    });

    if (emailError) {
      console.error("[Maya Webhook] Email failed:", emailError);
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("[Maya Webhook] Unexpected error:", error);
    // Still 200 — don't let Maya retry on our own bug
    return ack;
  }
}
