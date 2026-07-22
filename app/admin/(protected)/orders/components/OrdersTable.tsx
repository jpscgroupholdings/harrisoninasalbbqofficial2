"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderType } from "@/types/OrderTypes";
import { OrderActionButton } from "./OrderActionButton";
import PermissionGuard from "@/lib/PermissionGuard";
import LoadingPage from "@/components/ui/LoadingPage";
import { formatDate } from "@/helper/formatter/formatDate";
import { useRouter } from "next/navigation";
import { FULFILLMENT_TYPE, ORDER_STATUSES } from "@/types/orderConstants";
import { IconButton } from "@/components/ui/buttons";

export default function OrdersTable({
  orders,
  isPending,
}: {
  orders: OrderType[];
  isPending: boolean;
}) {
  const router = useRouter();

  const headerTitles = [
    "Customer",
    "Total",
    "Payment Method",
    "Branch",
    "Status",
    "Time",
    "Actions",
  ];

  const PaymentStatusCapsule = (status: "awaiting" | "paid" | "unpaid") => {
    const statusObject = {
      paid: {
        text: "text-green-700",
        bg: "bg-green-50",
        bgPill: "bg-green-500",
        border: "border-green-200",
        title: "Paid",
      },
      awaiting: {
        text: "text-amber-700",
        bg: "bg-amber-50",
        bgPill: "bg-amber-500",
        border: "border-amber-200",
        title: "Awaiting Payment",
      },
      unpaid: {
        text: "text-red-700",
        bg: "bg-red-50",
        bgPill: "bg-red-500",
        border: "border-red-200",
        title: "Unpaid",
      },
    };

    const current = statusObject[status];

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${current.border} ${current.bg} ${current.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${current.bgPill}`} />
        {current.title}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="p-6 border-b border-stone-200">
        <h3 className="text-lg font-bold text-stone-800">Recent Orders</h3>
        <p className="text-sm text-stone-500 mt-1">Latest customer orders</p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headerTitles.map((head, index) => (
                <TableHead
                  key={index}
                  className="px-4 py-4 uppercase text-xs font-semibold tracking-wider text-center"
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-stone-100 relative">
            {orders.length > 0 ? (
              orders.map((order) => {
                const isMaya = order.paymentInfo.paymentMethod === "maya";
                const isMayaPaid = order.paymentInfo.paymentConfirmed === true;
                const isNewPaidOrder =
                  isMaya &&
                  isMayaPaid &&
                  order.status === ORDER_STATUSES.PENDING;

                const isPickup =
                  order?.fulfillmentType &&
                  order.fulfillmentType === FULFILLMENT_TYPE.PICKUP;
                const isDineIn =
                  order?.fulfillmentType &&
                  order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;

                const fulfillmentLabel = isDineIn
                  ? "Reservation"
                  : isPickup
                    ? "Pickup"
                    : "Delivery";

                const fulfillmentStyle = isDineIn
                  ? "text-indigo-500"
                  : isPickup
                    ? "text-blue-500"
                    : "text-brand-color-500";

                return (
                  <TableRow
                    key={order._id}
                    className={`relative transition-colors ${
                      isNewPaidOrder
                        ? "bg-brand-color-50 hover:bg-brand-color-100"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Ribbon badge — sits in normal flow, doesn't overlap text */}
                        {isNewPaidOrder && (
                          <span
                            className="shrink-0 inline-flex items-center bg-red-500 text-white
                              text-[10px] font-bold uppercase tracking-wide
                              py-1 pl-2 pr-3
                              [clip-path:polygon(0_0,80%_0,100%_50%,80%_100%,0_100%)]
                              animate-pulse"
                          >
                            New
                          </span>
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {order.paymentInfo.firstName ?? "—"}{" "}
                            {order.paymentInfo.lastName ?? "—"}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {order.paymentInfo.customerEmail ?? "—"}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {order.paymentInfo.customerPhone ?? "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-semibold text-stone-800">
                        ₱{order.total.totalAmount?.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isMaya
                            ? "bg-green-100 text-green-700"
                            : "text-orange-700 bg-orange-100"
                        }`}
                      >
                        {isMaya ? "Maya" : "Cash on Delivery"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-xs font-semibold gap-2 flex flex-col`}
                    >
                      <p
                        className={`text-xs font-semibold ${fulfillmentStyle}`}
                      >
                        {fulfillmentLabel}
                      </p>
                      <p className="text-nowrap">
                        {order.branchSnapshot?.name}
                      </p>
                      {isPickup && order.pickupTime && (
                        <p className="text-xs text-blue-400 font-normal">
                          {formatDate(order.pickupTime)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-end justify-end gap-1.5">
                        <div className="flex items-end flex-col gap-1.5 flex-wrap">
                          <StatusBadge status={order.status} />
                          {isMaya && isMayaPaid && PaymentStatusCapsule("paid")}
                          {order.status === ORDER_STATUSES.PENDING_PAYMENT &&
                            isMaya &&
                            !isMayaPaid &&
                            PaymentStatusCapsule("awaiting")}
                          {!isMaya &&
                            order.paymentInfo?.paymentId &&
                            PaymentStatusCapsule("paid")}
                          {order.status === ORDER_STATUSES.PENDING &&
                            isMaya &&
                            !isMayaPaid &&
                            PaymentStatusCapsule("unpaid")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-xs text-stone-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col lg:flex-row items-center justify-center">
                        <IconButton
                          onClick={() => router.push(`/orders/${order._id}`)}
                          text="Details"
                          variant="underline"
                          className="text-blue-500 hover:text-blue-600 text-xs"
                        />
                        <PermissionGuard permission="orders.update">
                          <OrderActionButton order={order} role="admin" />
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : isPending ? (
              <TableRow>
                <TableCell>
                  <div className="h-full bg-white">
                    <LoadingPage />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <p className="text-sm text-gray-500">
                    No orders found on this branch.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
