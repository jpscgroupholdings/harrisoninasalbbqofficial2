import { OrderStatus } from "@/types/orderConstants";
import {
  CreditCard,
  Package,
  Truck,
  Hamburger,
  CheckCircle,
  Ban,
} from "lucide-react";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<
    OrderStatus,
    { label: string; color: string; icon: React.JSX.Element }
  > = {
    pending: {
      label: "Pending Payment",
      color: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      icon: <CreditCard size={14} />,
    },
    preparing: {
      label: "Preparing Order",
      color: "bg-blue-100 text-blue-700 border border-blue-200",
      icon: <Package size={14} />,
    },
    ready: {
      label: "Ready to pickup",
      color: "bg-orange-100 text-orange-700 border border-orange-200",
      icon: <Hamburger size={14} />,
    },
    completed: {
      label: "Order Completed",
      color: "bg-green-100 text-green-700 border border-green-200",
      icon: <CheckCircle size={14} />,
    },
    cancelled: {
      label: "Order Cancelled",
      color: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: <Ban size={14} />,
    },
    expired: {
      label: "Order Expired",
      color: "bg-red-100 text-red-700 border border-red-200",
      icon: <Ban size={14} />,
    },
    failed: {
      label: "Order Expired",
      color: "bg-red-100 text-red-700 border border-red-200",
      icon: <Ban size={14} />,
    },
  };

  const item = map[status] || map.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${item.color}`}
    >
      {item.icon} {item.label}
    </span>
  );
}
