import { Order } from "@/models/Orders";
import {
  ORDER_ACTION_CONFIG,
  OrderStatus,
  STATUS_PRIORITY,
} from "@/types/orderConstants";
import { buildPaginationMeta } from "../query-helpers";

export type OrderQueryOptions = {
  filter: Record<string, any>;
  page?: number;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
};

export async function queryOrders(options: OrderQueryOptions) {
  const { filter, page = 1, limit = 20, skip = 0 } = options;

  // Map STATUS_PRIORITY into a MongoDB $switch expression
  const priorityBranches = Object.entries(STATUS_PRIORITY).map(
    ([status, priority]) => ({
      case: { $eq: ["$status", status] },
      then: priority,
    }),
  );

  const [result] = await Order.aggregate([
    { $match: filter },
    {
      // Add a numeric priority field for sorting
      $addFields: {
        statusPriority: {
          $switch: {
            branches: priorityBranches,
            default: 99,
          },
        },
      },
    },
    { $sort: { statusPriority: 1, createdAt: -1 } }, // sort BEFORE pagination
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const orders = result.data;
  const total = result.total[0]?.count ?? 0;

  const formatter = (order: any) => ({
    _id: order._id,
    customerId: order.customerId,
    createdAt: order.createdAt,
    status: order.status,
    items: order.items,
    total: order.total,
    paymentInfo: order.paymentInfo,
    estimatedTime: order.estimatedTime,
    isReviewed: order.isReviewed,
    actionConfig: ORDER_ACTION_CONFIG[order.status as OrderStatus],
    priority: STATUS_PRIORITY[order.status as OrderStatus],
  });

  return {
    data: orders.map(formatter),
    pagination: buildPaginationMeta(total, page, limit),
  };
}
