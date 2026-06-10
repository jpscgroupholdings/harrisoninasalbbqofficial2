import { getAuthHeader } from "@/lib/getAuthHeader";
import { getMayaCheckoutUrl } from "@/lib/mayaConfig";
import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const customer = await requireBetterAuth(request);
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.customerId &&
      (!customer || order.customerId.toString() !== customer._id.toString())
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.paymentInfo?.paymentMethod !== "maya") {
      return NextResponse.json(
        { error: "Only Maya orders can create a payment checkout." },
        { status: 400 },
      );
    }

    if (order.status !== ORDER_STATUSES.PENDING_PAYMENT) {
      return NextResponse.json(
        { error: "This order is no longer awaiting payment." },
        { status: 400 },
      );
    }

    if (order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS) {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 },
      );
    }

    const { paymentInfo } = order;
    const shippingAddress = paymentInfo.shippingAddress;
    const { line1, line2, city, province, zipCode } = shippingAddress ?? {};

    const referenceNumber = paymentInfo?.referenceNumber;

    const payload = {
      totalAmount: {
        value: order.total.totalAmount,
        currency: "PHP",
        details: {
          discount:
            (order.total.discountAmount ?? 0) +
            (order.total.voucherDiscountAmount ?? 0),
          vatAmount: order.total.vatAmount,
          subTotal: order.total.vatableSales,
        },
      },
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        amount: {
          value: parseFloat(item.price),
        },
        totalAmount: {
          value: parseFloat((item.price * item.quantity).toFixed(2)), // calculate the value
          currency: "PHP",
        },
      })),
      buyer: {
        firstName: paymentInfo.firstName,
        lastName: paymentInfo.lastName,
        contact: {
          email: paymentInfo.customerEmail,
          phone: paymentInfo.customerPhone,
        },

        ...(shippingAddress && {
          shippingAddress: {
            line1,
            line2,
            city,
            province,
            state: province,
            zipCode,
            countryCode: "PH",
          },
        }),

      },
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success?referenceNumber=${referenceNumber}`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed?referenceNumber=${referenceNumber}`,
        cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel?referenceNumber=${referenceNumber}`,
      },
      requestReferenceNumber: paymentInfo.referenceNumber,
    };

    const response = await fetch(
      getMayaCheckoutUrl(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.redirectUrl) {
      return NextResponse.json(
        { error: data.message ?? "Failed to create payment checkout." },
        { status: 502 },
      );
    }

    order.paymentInfo.checkoutId = data.checkoutId;

    await order.save();

    return NextResponse.json({
      checkoutId: data.checkoutId,
      redirectUrl: data.redirectUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      {
        status: 500,
      },
    );
  }
}
