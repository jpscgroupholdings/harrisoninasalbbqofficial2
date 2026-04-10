/**
 * GET /api/orders
 *
 * Fetch all orders with smart sorting using STATUS_PRIORITY
 * Uses orderConstants.ts for consistent behavior with frontend
 */

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";
import { queryOrders } from "@/lib/orders/orderService";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const filter: Record<string, any> = {};

    if(admin.role !== STAFF_ROLES.SUPERADMIN){
      if(!admin.branch) return NextResponse.json({error: "No branch assigned"}, {status: 403});
      filter.branchId = admin.branch
    }

    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("email")) filter["paymentInfo.customerEmail"] = searchParams.get("email")!.toLowerCase();

     const result = await queryOrders({
      filter,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: (searchParams.get("sortBy") as "priority" | "date") || "priority",
      fields: "admin",
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
