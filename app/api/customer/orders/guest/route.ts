import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { queryOrders } from "@/lib/orders/orderService";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const ref = request.nextUrl.searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 },
      );
    }

    const result = await queryOrders({
      filter: { "paymentInfo.referenceNumber": ref.toUpperCase() },
      page: 1,
      limit: 1,
      sortBy: "date"
    });

    if (!result.data?.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.data[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.customerId) {
      return NextResponse.json(
        {
          error:
            "This order is linked to a registered account. Please login to view it.",
          code: "AUTH_REQUIRED",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ data: [order] });
  } catch (error: any) {
    console.error("GET /api/orders/guest error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
