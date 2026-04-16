import StatusBadge from "../../../components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { OrderType } from "@/types/OrderTypes";
import { OrderActionButton } from "./OrderActionButton";
import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import { useOrder } from "@/hooks/api/useOrders";
import { MailIcon, PhoneIcon, UserIcon } from "lucide-react";
import PermissionGuard from "@/lib/PermissionGuard";
import LoadingPage from "@/components/ui/LoadingPage";

export default function OrdersTable({ orders }: { orders: OrderType[] }) {
  const [orderToViewId, setOrderToViewId] = useState<string>("");
  const { data: orderToView, isLoading, isError } = useOrder(orderToViewId);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const headerTitles = [
    "Order ID",
    "Customer",
    "Items",
    "Total",
    "Reference",
    "Status",
    "Time",
    "Actions",
  ];

  const vatableSales = orderToView?.total?.vatableSales ?? 0
  const totalAmount = orderToView?.total?.totalAmount ?? 0;

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
          <TableBody className="divide-y divide-stone-100">
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow
                  key={order._id}
                  className="hover:bg-stone-50 transition-colors"
                >
                  <TableCell>
                    <span className="text-sm font-semibold text-stone-800">
                      {order._id.substring(0, 8) + "..."}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {order.paymentInfo.customerName ?? "—"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.paymentInfo.customerEmail ?? "—"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.paymentInfo.customerPhone ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm text-stone-600">
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-semibold text-stone-800">
                      ₱{order.total.totalAmount?.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-xs font-medium text-stone-600 uppercase">
                      {order.paymentInfo.referenceNumber}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-xs text-stone-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col lg:flex-row gap-2 items-center justify-center">
                      <button
                        onClick={() => setOrderToViewId(order._id)}
                        className="text-xs font-bold bg-blue-700 hover:bg-blue-800 py-2 px-3 text-white rounded-full cursor-pointer text-nowrap"
                      >
                        View Details
                      </button>

                      <PermissionGuard permission="orders.update">
                        <OrderActionButton
                          orderId={order._id}
                          status={order.status}
                        />
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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

        {orderToViewId && (
          <Modal title="Order Details" onClose={() => setOrderToViewId("")}>
            {isLoading && (
              <div className="relative flex items-center justify-center py-12 h-[50vh]">
                <LoadingPage />
              </div>
            )}
            {isError && (
              <p className="text-center text-sm text-red-500 py-8">
                Failed to load order.
              </p>
            )}
            {orderToView && (
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Order ID</p>
                    <p className="text-sm font-mono font-medium text-gray-700">
                      {orderToView._id}
                    </p>
                  </div>
                  <StatusBadge status={orderToView.status ?? ""} />
                </div>

                <hr className="border-stone-100" />

                {/* Customer Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Customer
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <UserIcon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {orderToView.paymentInfo?.customerName ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MailIcon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {orderToView.paymentInfo?.customerEmail ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {orderToView.paymentInfo?.customerPhone ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* Order Items */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Items
                  </p>
                  <div className="flex flex-col gap-2">
                    {orderToView.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              x{item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          ₱{(item.price * item.quantity).toLocaleString() ?? "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* Total */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>VATable Sales</span>
                    <span>₱{vatableSales?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* Payment Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Payment
                  </p>
                  <div className="flex flex-col gap-1.5 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="capitalize font-medium">
                        {orderToView.paymentInfo?.method?.type ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reference</span>
                      <span className="font-mono text-xs">
                        {orderToView.paymentInfo?.referenceNumber ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Paid At</span>
                      <span>
                        {orderToView.paymentInfo?.paidAt
                          ? new Date(
                              orderToView.paymentInfo.paidAt,
                            ).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {orderToView.notes && (
                  <>
                    <hr className="border-stone-100" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Note
                      </p>
                      <p className="text-sm text-gray-600 bg-stone-50 rounded-lg px-3 py-2">
                        {orderToView.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
