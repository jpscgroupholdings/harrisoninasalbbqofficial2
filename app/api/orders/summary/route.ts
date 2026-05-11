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
          // Count unreviewed completed orders separately for the "To review" badge
          unreviewedCount: {
            $sum: {
              $cond: [{ $eq: ["$isReviewed", false] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Map raw status count into tab keys (matching TABS config in the frontend)
    const byStatus: Record<string, number> = {};

    for (const row of counts) {
      byStatus[row._id] = row.count;
    }

    const unreviewedCompleted =
      counts.find((r) => r._id === "completed")?.unreviewedCount ?? 0;

    const summary = {
      // "To pay" tab: PENDING (excluding COD) + PAID
      pending: (byStatus["pending"] ?? 0) + (byStatus["paid"] ?? 0),
      // "To dispatch" tab
      preparing: byStatus["preparing"] ?? 0,
      // "To receive" tab
      dispatched: (byStatus["dispatched"] ?? 0) + (byStatus["ready"] ?? 0),
      // "To review" tab — only unreviewed completed orders get a badge
      completed: unreviewedCompleted,
      // Cancelled — badge intentionally not shown on the frontend but included for completeness
      cancelled: (byStatus["cancelled"] ?? 0) + (byStatus["expired"] ?? 0),
      // Grand total across all statuses
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
