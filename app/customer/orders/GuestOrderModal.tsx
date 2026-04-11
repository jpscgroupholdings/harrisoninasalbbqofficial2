import { syne } from "@/app/font";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { OrdersApiResponse } from "@/types/OrderTypes";
import { OrderStatus } from "@/types/orderConstants";
import { format } from "date-fns";

interface OrderDetailsModalProps {
  order: OrdersApiResponse["data"][number] | null;
  onPayOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onBuyAgain: (items: any[]) => void;
  isLoading: boolean;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-800" },
  paid: { bg: "bg-green-100", text: "text-green-800" },
  preparing: { bg: "bg-blue-100", text: "text-blue-800" },
  ready: { bg: "bg-green-100", text: "text-green-800" },
  dispatched: { bg: "bg-purple-100", text: "text-purple-800" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
  expired: { bg: "bg-red-100", text: "text-red-700" },
};

function OrderActions({
  order,
  onPayOrder,
  onCancelOrder,
  onBuyAgain,
  isLoading,
}: {
  order: OrderDetailsModalProps["order"];
  onPayOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onBuyAgain: (items: any[]) => void;
  isLoading: boolean;
}) {
  if (!order) return null;

  const status = order.status as OrderStatus;

  const canPay =
    status === "pending" || status === "failed" || status === "expired";
  const canCancel =
    status === "pending" || status === "paid" || status === "preparing";
  const canBuyAgain = status === "completed" || status === "cancelled";

  if (!canPay && !canCancel && !canBuyAgain) return null;

  return (
    <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-2">
      {canPay && (
        <button
          onClick={() => onPayOrder(order._id)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          {isLoading ? (
            <>
              <DynamicIcon name="Loader" size={15} className="animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <DynamicIcon name="CreditCard" size={15} />
              Pay now
            </>
          )}
        </button>
      )}

      {canBuyAgain && (
        <button
          onClick={() => onBuyAgain(order.items)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <DynamicIcon name="RotateCcw" size={15} />
          Order again
        </button>
      )}

      {canCancel && (
        <button
          onClick={() => onCancelOrder(order._id)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 text-sm font-semibold py-2.5 rounded-xl border border-red-200 transition-colors"
        >
          {isLoading ? (
            <>
              <DynamicIcon name="Loader" size={15} className="animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <DynamicIcon name="X" size={15} />
              Cancel order
            </>
          )}
        </button>
      )}
    </div>
  );
}

export const OrderDetailsModal = ({
  order,
  onPayOrder,
  onCancelOrder,
  onBuyAgain,
  isLoading,
}: OrderDetailsModalProps) => {
  if (!order) return null;

  const statusStyle = STATUS_STYLES[order.status as OrderStatus] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
  };

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = order.total.total - subtotal;

  return (
    <div className={`${syne.className}`}>
      {/* Status + Date */}
      <div className="flex items-center gap-2 px-5 pb-4">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle.bg} ${statusStyle.text}`}
        >
          {order.status}
        </span>
        <span className="text-xs text-slate-400">
          Placed {format(new Date(order.createdAt), "MMM d, yyyy · h:mm a")}
        </span>
      </div>

      {/* Items */}
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Items ordered
        </p>
        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <DynamicIcon
                      name="Package"
                      size={16}
                      className="text-slate-400"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.name}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-slate-800">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Delivery fee</span>
              <span>₱{deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] font-semibold text-slate-800 pt-2 border-t border-slate-100 mt-1">
            <span>Total</span>
            <span>₱{order.total.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Payment
        </p>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
            <DynamicIcon
              name="CreditCard"
              size={14}
              className="text-slate-500"
            />
          </div>
          <span className="text-sm text-slate-700">
            {order.paymentInfo?.method?.type ?? "—"}
          </span>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {order?.status ?? "Paid"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <OrderActions
        order={order}
        onPayOrder={onPayOrder}
        onCancelOrder={onCancelOrder}
        onBuyAgain={onBuyAgain}
        isLoading={isLoading}
      />
    </div>
  );
};
