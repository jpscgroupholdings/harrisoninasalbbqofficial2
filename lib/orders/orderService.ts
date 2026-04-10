import { Order } from "@/models/Orders";
import {
  ORDER_ACTION_CONFIG,
  OrderStatus,
  STATUS_PRIORITY,
} from "@/types/orderConstants";

export type OrderQueryOptions = {
  filter: Record<string, any>;
  page?: number;
  limit?: number;
  sortBy?: "priority" | "date";
};

export async function queryOrders(options: OrderQueryOptions) {
  const { filter, page = 1, limit = 20, sortBy = "priority" } = options;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const sorted =
    sortBy === "priority"
      ? [...orders].sort(
          (a, b) =>
            STATUS_PRIORITY[a.status as OrderStatus] -
            STATUS_PRIORITY[b.status as OrderStatus],
        )
      : orders;

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
    data: sorted.map(formatter),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: safePage < Math.ceil(total / safeLimit),
    },
  };
}
