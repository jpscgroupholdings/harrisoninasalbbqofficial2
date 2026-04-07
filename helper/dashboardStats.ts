import { Order } from "@/models/Orders";
import { connectDB } from "../lib/mongodb";
import { SalesData, TopProduct } from "@/types/adminType";

export async function getDashboardStats() {
  await connectDB();

  const totalOrders = await Order.countDocuments();

  const revenueResult = await Order.aggregate([
    {$match: {
        status: {
            $nin: ["pending", "cancelled"]
        }
    }},
    { $group: { _id: null, totalRevenue: { $sum: "$total.total" } } },
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

export async function getSalesData():Promise<SalesData[]> {
  await connectDB();
  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {$gt: sevenDaysAgo},
        status: "completed"
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {format: "%m/%d", date: "$createdAt"}
        },
        sales: {$sum: "$total.total"}
      }
    },
    {
      $sort: { _id: 1}
    },
    {
      $project: {_id: 0, date: "$_id", sales: 1}
    }
  ]);

  return result;
}

export async function getTopProducts(): Promise<TopProduct[]>{
  
  await connectDB();

  const result = await Order.aggregate([
    {
      $match: {
        status: "completed"
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: "$items.name",
        sale: {$sum: "$items.quantity"}
      }
    },
    {$sort : {sales : -1}},
    {$limit: 5},
    {$project: {_id: 0, name: "$_id", sales: 1}}
  ])
  return result
}
