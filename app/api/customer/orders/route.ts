import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "@/lib/getAuth";
import { queryOrders } from "@/lib/orders/orderService";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const customer = await requireCustomerAuth(request);

    // ============================================
    // QUERY PARAMETERS
    // ============================================
    const searchParams = request.nextUrl.searchParams;
    const result = await queryOrders({
      filter: { customerId: customer._id }, // customer can ONLY see their own
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: "date",
    });

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === "Unauthorized!") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
