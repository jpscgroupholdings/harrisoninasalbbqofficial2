import { getCustomerStats } from "@/services/customer/customer-stat.service";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { buildPaginationMeta, parseRequestQuery } from "@/utils/query-helpers";
import { getAPIError } from "@/lib/getApiError";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    // parseRequestQuery handles pagination + text search in one call.
    // We ignore its `sort` output because our sort values are custom enums
    // (e.g. "newest", "highest_spent") that need a separate mapping below.
    const { page, limit, skip, match } = parseRequestQuery(request, {
      searchFields: ["firstName", "lastName", "email", "phone"],
      defaultLimit: 10,
      maxLimit: 50,
    });

    const sp = request.nextUrl.searchParams;
    const filter = sp.get("filter") || "all"; // all | active | banned | new | vip
    const sort = sp.get("sort") || "newest"; // newest | oldest | highest_spent | most_orders | name_asc | name_desc

    // ── Build MongoDB filter ──
    // Start with the $or search match from parseRequestQuery, then layer custom filters
    const query: Record<string, unknown> = { ...match };

    // Filter tabs (banned / active are DB-level; new / vip are applied after stats enrichment)
    if (filter === "banned") query.banned = true;
    if (filter === "active") query.banned = { $ne: true };

    // "new" filter = customers who joined in the last 30 days
    if (filter === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    // ── Sort mapping ──
    // DB-level sorts use .sort(); stat-based sorts are applied after enrichment
    const dbSortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { firstName: 1 },
      name_desc: { firstName: -1 },
    };
    const mongoSort = dbSortMap[sort] ?? { createdAt: -1 };

    const [data, total] = await Promise.all([
      User.find(query).sort(mongoSort).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // ── Summary stats (across all users, not just current page) ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCount, newCustomerCount] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Single aggregation for current page customers
    const statsMap = await getCustomerStats(data.map((c) => c.email));

    let enriched = data.map((c) => ({
      ...c,
      totalOrders: statsMap[c.email]?.totalOrders ?? 0,
      totalSpent: statsMap[c.email]?.totalSpent ?? 0,
    }));

    // ── Post-aggregation filters & sorts ──
    // "vip" filter = customers with totalSpent > 10,000
    if (filter === "vip") {
      enriched = enriched.filter((c) => c.totalSpent > 10000);
    }

    // Stat-based sorts (highest_spent, most_orders)
    if (sort === "highest_spent") {
      enriched.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sort === "most_orders") {
      enriched.sort((a, b) => b.totalOrders - a.totalOrders);
    }

    // Compute VIP count across all users (totalSpent > 10,000 from completed orders)
    const allEmails: string[] = await User.distinct("email");
    const allStats = await getCustomerStats(allEmails);
    let vipCount = 0;
    for (const email of allEmails) {
      if ((allStats[email]?.totalSpent ?? 0) > 10000) vipCount++;
    }

    // Use shared helper for consistent pagination shape
    const effectiveTotal = filter === "vip" ? enriched.length : total;

    return NextResponse.json(
      {
        data: enriched,
        pagination: buildPaginationMeta(effectiveTotal, page, limit),
        summary: {
          totalCustomers: totalCount,
          newCustomers: newCustomerCount,
          vipCustomers: vipCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch customers!",
    })
  }
}
