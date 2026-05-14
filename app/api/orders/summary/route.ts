import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const customer = await requireBetterAuth();

    const counts = await Order.aggregate([
      { $match: { customerId: customer._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          unreviewedCount: {
            $sum: { $cond: [{ $eq: ["$isReviewed", false] }, 1, 0] },
          },
        },
      },
    ]);

    const byStatus: Record<string, number> = {};
    const unreviewedByStatus: Record<string, number> = {};

    for (const row of counts) {
      byStatus[row._id] = row.count;
      unreviewedByStatus[row._id] = row.unreviewedCount;
    }

    const summary = {
      pending: byStatus["pending"] ?? 0,
      // "To dispatch": payment confirmed (paid) + actively being prepared
      preparing: (byStatus["paid"] ?? 0) + (byStatus["preparing"] ?? 0),

      // "To receive": out for delivery or ready at counter
      dispatched: (byStatus["dispatched"] ?? 0) + (byStatus["ready"] ?? 0),

      // "Completed": badge only shows unreviewed count (actionable)
      completed: unreviewedByStatus["completed"] ?? 0,

      // Terminal statuses — kept for completeness, badges intentionally hidden on frontend
      cancelled: byStatus["cancelled"] ?? 0,
      expired: byStatus["expired"] ?? 0,
      failed: byStatus["failed"] ?? 0, // if you have a failed payment status

      // Raw per-status breakdown — useful for frontend if you ever need granular data
      // without re-hitting the API
      raw: {
        pending: byStatus["pending"] ?? 0,
        paid: byStatus["paid"] ?? 0,
        preparing: byStatus["preparing"] ?? 0,
        dispatched: byStatus["dispatched"] ?? 0,
        ready: byStatus["ready"] ?? 0,
        completed: byStatus["completed"] ?? 0,
        cancelled: byStatus["cancelled"] ?? 0,
        expired: byStatus["expired"] ?? 0,
        failed: byStatus["failed"] ?? 0,
      },

      total: counts.reduce((sum, r) => sum + r.count, 0),
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch summary of orders",
      },
      { status: 500 },
    );
  }
}