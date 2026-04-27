import { getCustomerStats } from "@/lib/customer/getCustomerStats";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 10)),
    );

    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    const [data, total] = await Promise.all([
      User.find(filter, "fullname email phone createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Single aggregation for all customers at once (not per-customer)
    const statsMap = await getCustomerStats(data.map((c) => c.email));

    const enriched = data.map((c) => ({
      ...c,
      totalOrders: statsMap[c.email]?.totalOrders ?? 0,
      totalSpent: statsMap[c.email]?.totalSpent ?? 0,
    }));

    return NextResponse.json(
      {
        data: enriched,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch customers!",
      },
      { status: 500 },
    );
  }
}
