import { Order } from "@/models/Orders";
import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { connectDB } from "../../lib/mongodb";
import {
  DashboardActivity,
  LowStockItem,
  NewCustomerItem,
  PendingOrderItem,
} from "@/app/admin/(protected)/dashboard/dashboard.types";
import { SalesData, TopProduct } from "@/types/adminType";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { Types } from "mongoose";
import { STAFF_ROLES, StaffRole } from "@/types/staff";

/**
 * The time period the dashboard filters by.
 * - "week" → last 7 days (relative)
 * - "month" with month+year → specific calendar month (e.g. June 2026)
 * - "year" with year → specific calendar year (e.g. 2025)
 */
export type DashboardPeriod =
  | { range: "week" }
  | { range: "month"; month: number; year: number }
  | { range: "year"; year: number };

/** Legacy alias kept for backward-compat with any external consumers. */
export type DashboardRange = "week" | "month" | "year";

/**
 * Parses a DashboardPeriod from URL search params.
 * - ?range=week → { range: "week" }
 * - ?range=month&month=6&year=2026 → { range: "month", month: 6, year: 2026 }
 * - ?range=year&year=2025 → { range: "year", year: 2025 }
 * Defaults to { range: "week" } when no range param is present.
 */
export function parseDashboardPeriod(params: URLSearchParams): DashboardPeriod {
  const range = params.get("range");

  if (!range) return { range: "week" };

  if (range === "week") return { range: "week" };

  if (range === "month") {
    const month = Number(params.get("month"));
    const year = Number(params.get("year"));
    if (!month || !year) {
      throw new Error("month and year are required when range=month");
    }
    return { range: "month", month, year };
  }

  if (range === "year") {
    const year = Number(params.get("year"));
    if (!year) {
      throw new Error("year is required when range=year");
    }
    return { range: "year", year };
  }

  throw new Error(`Invalid range: ${range}`);
}

export type DashboardFilters = {
  branchId?: string | Types.ObjectId;
};

type DashboardAdminScope = {
  role: StaffRole;
  branch?: string | Types.ObjectId | null;
};

export function resolveDashboardFilters(
  admin: DashboardAdminScope,
  requestedBranchId?: string | null,
): DashboardFilters {
  if (admin.role === STAFF_ROLES.SUPERADMIN) {
    return requestedBranchId && requestedBranchId !== "all"
      ? { branchId: requestedBranchId }
      : {};
  }

  if (!admin.branch) {
    throw new Error("No branch assigned");
  }

  return { branchId: admin.branch };
}

const buildBranchMatch = (filters: DashboardFilters = {}) => {
  if (!filters.branchId) return {};

  const branchId = filters.branchId.toString();

  if (!Types.ObjectId.isValid(branchId)) {
    throw new Error("Invalid branch id");
  }

  return { branchId: new Types.ObjectId(branchId) };
};

/**
 * Computes the exact start/end dates for a given DashboardPeriod.
 * - week: last 7 days from now
 * - month: first day → last day of the specific calendar month
 * - year: Jan 1 → Dec 31 of the specific year
 */
export function getDateRange(period: DashboardPeriod) {
  if (period.range === "week") {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 7);
    return { start, end: now };
  }

  if (period.range === "month") {
    // First day of the specific month
    const start = new Date(period.year, period.month - 1, 1);
    // Last day of the specific month (day 0 of next month = last day)
    const end = new Date(period.year, period.month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // year
  const start = new Date(period.year, 0, 1);
  const end = new Date(period.year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Shared aggregation pipeline for ranking products by quantity sold.
 * Used by both getDashboardStats (limit=1 for best seller) and getTopProducts (limit=5).
 */
async function getProductRanking(
  filters: DashboardFilters = {},
  period?: DashboardPeriod,
  limit: number = 5,
): Promise<TopProduct[]> {
  await connectDB();

  const matchStage: Record<string, unknown> = {
    ...buildBranchMatch(filters),
    status: ORDER_STATUSES.COMPLETED,
  };

  if (period) {
    const { start, end } = getDateRange(period);
    matchStage.createdAt = { $gte: start, $lte: end };
  }

  const result = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", sales: { $sum: "$items.quantity" } } },
    { $sort: { sales: -1 } },
    { $limit: limit },
    { $project: { _id: 0, name: "$_id", sales: 1 } },
  ]);

  return result;
}

export async function getDashboardStats(
  filters: DashboardFilters = {},
  period?: DashboardPeriod,
) {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);

  // Build match for completed orders — apply date range if provided
  const completedMatch: Record<string, unknown> = {
    ...branchMatch,
    status: ORDER_STATUSES.COMPLETED,
  };

  if (period) {
    const { start, end } = getDateRange(period);
    completedMatch.createdAt = { $gte: start, $lte: end };
  }

  const totalOrders = await Order.countDocuments(completedMatch);

  const revenueResult = await Order.aggregate([
    { $match: completedMatch },
    { $group: { _id: null, totalRevenue: { $sum: "$total.totalAmount" } } },
  ]);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Pending orders are always current — not date-filtered
  const pendingOrders = await Order.countDocuments({
    ...branchMatch,
    status: ORDER_STATUSES.PENDING,
  });

  // Best seller uses the shared ranking pipeline (limit=1)
  const ranking = await getProductRanking(filters, period, 1);

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    bestSellingProduct: ranking[0]?.name || "NA",
    bestSellingCount: ranking[0]?.sales || 0,
  };
}

export async function getSalesData(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<SalesData[]> {
  await connectDB();

  const { start, end } = getDateRange(period);
  const branchMatch = buildBranchMatch(filters);

  // Daily buckets for week/month, monthly buckets for year
  const dateFormat = period.range === "year" ? "%Y-%m" : "%m/%d";

  const result = await Order.aggregate([
    {
      $match: {
        ...branchMatch,
        createdAt: { $gt: start, $lte: end },
        status: "completed",
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: dateFormat, date: "$createdAt" },
        },
        sales: { $sum: "$total.totalAmount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: { _id: 0, date: "$_id", sales: 1 },
    },
  ]);

  return result;
}

export async function getTopProducts(
  period: DashboardPeriod,
  filters: DashboardFilters = {},
): Promise<TopProduct[]> {
  return getProductRanking(filters, period, 5);
}

/**
 * Fetches dashboard activity data: pending orders, low/out-of-stock
 * inventory items, and recently registered customers.
 */
export async function getDashboardActivity(
  filters: DashboardFilters = {},
): Promise<DashboardActivity> {
  await connectDB();

  const branchMatch = buildBranchMatch(filters);

  // --- Pending Orders (last 5, sorted newest-first) ---
  const pendingOrdersRaw = await Order.find({
    ...branchMatch,
    status: { $in: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PREPARING] },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select(
      "_id paymentInfo.firstName paymentInfo.lastName total.totalAmount status fulfillmentType createdAt items",
    )
    .lean();

  const pendingOrders: PendingOrderItem[] = pendingOrdersRaw.map((o) => ({
    _id: o._id.toString(),
    customerName:
      `${o.paymentInfo?.firstName ?? ""} ${o.paymentInfo?.lastName ?? ""}`.trim(),
    totalAmount: o.total?.totalAmount ?? 0,
    status: o.status,
    fulfillmentType: o.fulfillmentType,
    createdAt: o.createdAt,
    itemsCount: o.items?.length ?? 0,
  }));

  // --- Low / Out-of-Stock Items (max 5) ---
  const inventoriesRaw = await Inventory.find(branchMatch).lean();

  const lowStockRaw: LowStockItem[] = [];
  for (const inv of inventoriesRaw) {
    if (inv.quantity <= inv.reorderLevel) {
      const product = await Product.findById(inv.productId)
        .select("name image.url")
        .lean();

      if (!product) continue;

      const reserved: number =
        inv.reservations?.reduce(
          (sum: number, r: { quantity?: number }) => sum + (r.quantity ?? 0),
          0,
        ) ?? 0;

      const status: LowStockItem["status"] =
        inv.quantity === 0
          ? STOCK_STATUSES.OUT_OF_STOCK
          : STOCK_STATUSES.LOW_STOCK;

      lowStockRaw.push({
        productId: inv.productId.toString(),
        name: product.name,
        image: product.image?.url ?? "",
        quantity: inv.quantity,
        reorderLevel: inv.reorderLevel,
        available: inv.quantity - reserved,
        status,
      });
    }
  }

  // Sort: OUT_OF_STOCK first, then LOW_STOCK by quantity ascending
  lowStockRaw.sort((a, b) => {
    if (
      a.status === STOCK_STATUSES.OUT_OF_STOCK &&
      b.status !== STOCK_STATUSES.OUT_OF_STOCK
    )
      return -1;
    if (
      b.status === STOCK_STATUSES.OUT_OF_STOCK &&
      a.status !== STOCK_STATUSES.OUT_OF_STOCK
    )
      return 1;
    return a.quantity - b.quantity;
  });

  const lowStockItems = lowStockRaw.slice(0, 5);

  // --- New Customers (registered within last 7 days, max 5) ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newCustomersRaw = await User.find({
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("_id name email createdAt")
    .lean();

  const newCustomers: NewCustomerItem[] = newCustomersRaw.map((c) => ({
    _id: c._id.toString(),
    name: c.name ?? c.email?.split("@")[0] ?? "New User",
    email: c.email ?? "",
    createdAt: c.createdAt,
  }));

  const newCustomersCount = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  return {
    pendingOrders,
    lowStockItems,
    newCustomers,
    newCustomersCount,
  };
}
