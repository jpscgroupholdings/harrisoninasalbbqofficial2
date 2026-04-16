import { getAuthHeader } from "@/lib/getAuthHeader";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 },
      );
    }

    const payload = {
      totalAmount: {
        value: order.total.totalAmount,
        currency: "PHP",
        details: {
          discount: "0",
          vatAmount: order.total.vatAmount,
          vatableSales: order.total.vatableSales,
        },
      },
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        amount: {
          value: item.price,
        },
        totalAmount: {
          value: item.price * item.quantity, // calculate the value
        },
      })),
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed`,
        cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
      },
      requestReferenceNumber: order.paymentInfo.referenceNumber,
    };

    const response = await fetch(
      "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
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
    console.log("PayMaya status:", response.status);
    console.log("PayMaya response:", JSON.stringify(data, null, 2));

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
