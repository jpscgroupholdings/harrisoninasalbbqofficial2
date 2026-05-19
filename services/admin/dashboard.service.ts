import { Order } from "@/models/Orders";
import { connectDB } from "../../lib/mongodb";
import { SalesData, TopProduct } from "@/types/adminType";

export type DashboardRange = "week" | "month" | "year";

export function getDateRange(range: DashboardRange) {
  const now = new Date();
  const start = new Date();

  if (range === "week") {
    start.setDate(now.getDate() - 7);
  }

  if (range === "month") {
    start.setMonth(now.getMonth() - 1);
  }

  if (range === "year") {
    start.setFullYear(now.getFullYear() - 1);
  }

  return { start, end: now };
}

export async function getDashboardStats() {
  await connectDB();

  const totalOrders = await Order.countDocuments();

  const revenueResult = await Order.aggregate([
    {
      $match: {
        status: {
          $nin: ["pending", "cancelled"],
        },
      },
    },
    { $group: { _id: null, totalRevenue: { $sum: "$total.totalAmount" } } },
  ]);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  const pendingOrders = await Order.countDocuments({ status: "pending" });

  const bestSellerResult = await Order.aggregate([
    { $match: { status: { $nin: ["pending", "cancelled"] } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", totalSold: { $sum: "$items.quantity" } } },
    { $sort: { totalSold: -1 } },
    { $limit: 1 },
  ]);

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    bestSellingProduct: bestSellerResult[0]?._id || "NA",
    bestSellingCount: bestSellerResult[0]?.totalSold || 0,
  };
}

export async function getSalesData(
  range: DashboardRange = "week",
): Promise<SalesData[]> {
  await connectDB();

  const { start, end } = getDateRange(range);

  const dateFormat = range === "year" ? "%Y-%m" : "%m/%d";

  const result = await Order.aggregate([
    {
      $match: {
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
  range: DashboardRange = "month",
): Promise<TopProduct[]> {
  await connectDB();

  const { start, end } = getDateRange(range);

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: "completed",
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.name",
        sales: { $sum: "$items.quantity" },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: "$_id", sales: 1 } },
  ]);
  return result;
}
