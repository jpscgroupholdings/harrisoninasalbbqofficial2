import { Order } from "@/models/Orders";
import { Category } from "@/models/Category";
import { connectDB } from "@/lib/mongodb";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { Types } from "mongoose";
import {
  DashboardPeriod,
  getDateRange,
  DashboardFilters,
  buildBranchMatch,
} from "./dashboard.service";
import { formatHour } from "@/helper/formatter";
import { StatCardProps } from "@/components/ui/StatCard";

// ============================================
// TYPES
// ============================================
export type ReportsTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type ReportsCategorySale = {
  name: string;
  value: number;
  color: string;
};

export type ReportsPeakHour = {
  hour: string;
  orders: number;
};

export type ReportsData = {
  keyMetrics: StatCardProps[];
  trend: ReportsTrendPoint[];
  categorySales: ReportsCategorySale[];
  peakHours: ReportsPeakHour[];
};

// ============================================
// CONSTANTS
// ============================================

/** Stable colors for category pie chart — assigned by sorted order */
const CATEGORY_COLORS = [
  "#f97316",
  "#dc2626",
  "#eab308",
  "#78350f",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d946ef",
];

/**
 * Computes the previous period's date range for comparison.
 * - week → the 7 days before the current week
 * - month → the same-length previous month window
 * - year → the previous calendar year
 */
function getPreviousDateRange(period: DashboardPeriod) {
  const { start, end } = getDateRange(period);
  const durationMs = end.getTime() - start.getTime();

  // Shift the entire range backward by its own duration
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start: prevStart, end: prevEnd };
}

// ============================================
// SHARED HELPERS
// ============================================

function buildCompletedMatch(
  branchMatch: Record<string, unknown>,
  start: Date,
  end: Date,
) {
  return {
    ...branchMatch,
    status: ORDER_STATUSES.COMPLETED,
    createdAt: { $gte: start, $lte: end },
  };
}

/** Calculate percentage change, returning 0 when previous is 0 */
function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// ============================================
// AGGREGATION PIPELINES
// ============================================

/**
 * Fetches total revenue and order count for a given date range.
 */
async function getRevenueAndOrders(
  match: Record<string, unknown>,
): Promise<{ revenue: number; orders: number }> {
  const result = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$total.totalAmount" },
        orders: { $sum: 1 },
      },
    },
  ]);
  return {
    revenue: result[0]?.revenue ?? 0,
    orders: result[0]?.orders ?? 0,
  };
}

/**
 * Computes customer retention rate: percentage of customers who ordered
 * more than once within the date range.
 */
async function getRetentionRate(
  match: Record<string, unknown>,
): Promise<number> {
  const result = await Order.aggregate([
    { $match: match },
    { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        repeatCustomers: {
          $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
        },
      },
    },
  ]);

  const { totalCustomers, repeatCustomers } = result[0] ?? {
    totalCustomers: 0,
    repeatCustomers: 0,
  };

  if (totalCustomers === 0) return 0;
  return Number(((repeatCustomers / totalCustomers) * 100).toFixed(1));
}

/**
 * Key metrics: revenue, orders, avg order value, retention — with % change
 * from the previous period.
 */
export async function getReportsKeyMetrics(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<StatCardProps[]> {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);
  const { start, end } = getDateRange(period);
  const prev = getPreviousDateRange(period);

  const currentMatch = buildCompletedMatch(branchMatch, start, end);
  const prevMatch = buildCompletedMatch(branchMatch, prev.start, prev.end);

  // Run all queries in parallel for speed
  const [current, previous, currentRetention, prevRetention] =
    await Promise.all([
      getRevenueAndOrders(currentMatch),
      getRevenueAndOrders(prevMatch),
      getRetentionRate(currentMatch),
      getRetentionRate(prevMatch),
    ]);

  const avgOrderValue =
    current.orders > 0 ? current.revenue / current.orders : 0;
  const prevAvgOrderValue =
    previous.orders > 0 ? previous.revenue / previous.orders : 0;

  return [
    {
      label: "Total Revenue",
      value: current.revenue,
      percentChange: calcPercentChange(current.revenue, previous.revenue),
      isCurrency: true,
      isPercentage: false,
      hasPreviousData:
        calcPercentChange(current.revenue, previous.revenue) !== undefined,
    },
    {
      label: "Total Orders",
      value: current.orders,
      percentChange: calcPercentChange(current.orders, previous.orders),
      isCurrency: false,
      isPercentage: false,
      hasPreviousData:
        calcPercentChange(current.orders, previous.orders) !== undefined,
    },
    {
      label: "Average Order Value",
      value: Math.round(avgOrderValue),
      percentChange: calcPercentChange(avgOrderValue, prevAvgOrderValue),
      isCurrency: true,
      isPercentage: false,
      hasPreviousData:
        calcPercentChange(current.orders, prevAvgOrderValue) !== undefined,
    },
    {
      label: "Customer Retention",
      value: currentRetention,
      percentChange: calcPercentChange(currentRetention, prevRetention),
      isCurrency: false,
      isPercentage: true,
      hasPreviousData:
        calcPercentChange(current.orders, prevRetention) !== undefined,
    },
  ];
}

/**
 * Revenue & orders trend — daily buckets for week/month, monthly for year.
 */
export async function getReportsTrend(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<ReportsTrendPoint[]> {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);
  const { start, end } = getDateRange(period);

  // Daily buckets for week/month, monthly for year
  const dateFormat = period.range === "year" ? "%Y-%m" : "%m/%d";

  const result = await Order.aggregate([
    {
      $match: {
        ...branchMatch,
        status: ORDER_STATUSES.COMPLETED,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        revenue: { $sum: "$total.totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
  ]);

  return result;
}

/**
 * Sales by category — groups completed order items by category name.
 */
export async function getReportsCategorySales(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<ReportsCategorySale[]> {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);
  const { start, end } = getDateRange(period);

  const result = await Order.aggregate([
    {
      $match: {
        ...branchMatch,
        status: ORDER_STATUSES.COMPLETED,
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.category",
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
  ]);

  // Resolve category names from ObjectIds
  const categoryIds = result
    .map((r) => r._id)
    .filter(
      (id): id is Types.ObjectId => id != null && Types.ObjectId.isValid(id),
    );

  const categories =
    categoryIds.length > 0
      ? await Category.find({ _id: { $in: categoryIds } })
          .select("name")
          .lean()
      : [];

  const nameMap = new Map(categories.map((c) => [c._id.toString(), c.name]));

  return result.map((r, i) => ({
    name: r._id
      ? (nameMap.get(r._id.toString()) ?? "Uncategorized")
      : "Uncategorized",
    value: r.quantity,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
}

/**
 * Peak hours — groups completed orders by hour of day (0–23).
 * Returns all 24 hours with 0 for hours that had no orders.
 */
export async function getReportsPeakHours(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<ReportsPeakHour[]> {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);
  const { start, end } = getDateRange(period);

  const result = await Order.aggregate([
    {
      $match: {
        ...branchMatch,
        status: ORDER_STATUSES.COMPLETED,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build a map for quick lookup, then fill all business hours (6 AM – 10 PM)
  const hourMap = new Map(result.map((r) => [r._id, r.orders]));

  const hours: ReportsPeakHour[] = [];
  for (let h = 6; h <= 22; h++) {
    hours.push({
      hour: formatHour(h),
      orders: hourMap.get(h) ?? 0,
    });
  }

  return hours;
}

/**
 * Aggregates all report data in parallel.
 */
export async function getReportsData(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<ReportsData> {
  const [keyMetrics, trend, categorySales, peakHours] = await Promise.all([
    getReportsKeyMetrics(period, filters),
    getReportsTrend(period, filters),
    getReportsCategorySales(period, filters),
    getReportsPeakHours(period, filters),
  ]);

  return { keyMetrics, trend, categorySales, peakHours };
}
