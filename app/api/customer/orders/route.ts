/**
 * GET /api/orders
 *
 * Fetch all orders with smart sorting using STATUS_PRIORITY
 * Uses orderConstants.ts for consistent behavior with frontend
 */

import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";
import {
  STATUS_PRIORITY,
  ORDER_ACTION_CONFIG,
  OrderStatus,
} from "@/types/orderConstants";

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );

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
      Order.find(filter)
        .sort({ createdAt: -1 }) // always fetch newest first as base
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // ============================================
    // SORT ORDERS
    // ============================================

    // JS sort only when priority is requested
    const sortedOrders =
      sortBy === "priority"
        ? [...orders].sort((a, b) => {
            const priorityDiff =
              STATUS_PRIORITY[a.status as OrderStatus] -
              STATUS_PRIORITY[b.status as OrderStatus];
            // same priority → preserve createdAt desc (already sorted by Mongo)
            return priorityDiff !== 0 ? priorityDiff : 0;
          })
        : orders; // date sort already done by Mongo

    // ============================================
    // FORMAT RESPONSE
    // ============================================

    const formattedOrders = sortedOrders.map((order) => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items,
      total: order.total,
      paymentInfo: order.paymentInfo,
      estimatedTime: order.estimatedTime,
      isReviewed: order.isReviewed,

      // Add UI hint for staff dashboard
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
