/**
 * GET /api/orders
 * 
 * Fetch all orders with smart sorting using STATUS_PRIORITY
 * Uses orderConstants.ts for consistent behavior with frontend
 */

import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";
import { STATUS_PRIORITY, ORDER_ACTION_CONFIG, ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // ============================================
    // QUERY PARAMETERS
    // ============================================

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const sortBy = searchParams.get("sortBy") || "priority"; // priority | date
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // ============================================
    // BUILD FILTER
    // ============================================

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (email) {
      filter["paymentInfo.customerEmail"] = email.toLowerCase();
    }

    // ============================================
    // FETCH ORDERS
    // ============================================

    const [orders, total] = await Promise.all([
      Order.find(filter).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    // ============================================
    // SORT ORDERS
    // ============================================

    let sortedOrders = [...orders];

    if (sortBy === "priority") {
      // Sort by STATUS_PRIORITY (high-priority orders first)
      sortedOrders.sort((a, b) => {
        const priorityDiff =
          STATUS_PRIORITY[a.status as OrderStatus] - STATUS_PRIORITY[b.status as OrderStatus];

        // If same priority, sort by date (newest first)
        if (priorityDiff !== 0) return priorityDiff;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } else if (sortBy === "date") {
      // Sort by date (newest first)
      sortedOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // ============================================
    // FORMAT RESPONSE
    // ============================================

    const formattedOrders = sortedOrders.map((order) => ({
      _id: order._id.toString(),
      createdAt: order.createdAt,
      status: order.status,
      items: order.items,
      total: order.total,
      customerName: order.paymentInfo?.customerName,
      customerEmail: order.paymentInfo?.customerEmail,
      customerPhone: order.paymentInfo?.customerPhone,
      estimatedTime: order.estimatedTime,
      isReviewed: order.isReviewed,

      // ✨ Add UI hint for staff dashboard
      actionConfig: ORDER_ACTION_CONFIG[order.status as OrderStatus],
      priority: STATUS_PRIORITY[order.status as OrderStatus],
    }));

    // ============================================
    // RETURN RESPONSE
    // ============================================

    return NextResponse.json({
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
      filters: {
        status: status || null,
        email: email || null,
        sortBy,
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}