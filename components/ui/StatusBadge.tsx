import { ORDER_STATUSES } from "@/types/orderConstants";
import { OrderType } from "@/types/OrderTypes";
import React from "react";

interface StatusBadgeProps {
  status: OrderType["status"];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<OrderType["status"], string> = {
    pending_payment: "bg-amber-500",
    pending: "bg-amber-500",
    preparing: "bg-blue-500",
    dispatch: "bg-orange-500",
    ready_for_pickup: "bg-green-600",
    cancelled: "bg-gray-500",
    completed: "bg-[#ef4501]",
    failed: "bg-red-500",
    expired: "bg-red-500",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold text-white rounded-xl  ${statusStyles[status]} uppercase tracking-wide`}
    >
      {status === ORDER_STATUSES.DISPATCH
        ? "Dispatched"
        : status === ORDER_STATUSES.READY_FOR_PICKUP
          ? "Ready for pickup"
          : status.replace("_", " ")}
    </span>
  );
}
