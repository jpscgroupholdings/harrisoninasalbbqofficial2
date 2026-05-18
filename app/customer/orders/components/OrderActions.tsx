import { OrdersApiResponse } from "@/types/OrderTypes";
import { useRouter } from "next/navigation";
import { useOrderState } from "../hooks/useOrderState";
import { DynamicIcon } from "@/lib/DynamicIcon";

interface GuestOrderModalProps {
  order: OrdersApiResponse["data"][number] | null;
  onPayOrder: () => void;
  onCancelOrder: () => void;
  onBuyAgain: (items: any[]) => void;
  isLoading: boolean;
}


export function OrderActions({
  order,
  onPayOrder,
  onCancelOrder,
  onBuyAgain,
  isLoading,
}: {
  order: GuestOrderModalProps["order"];
  onPayOrder: () => void;
  onCancelOrder: () => void;
  onBuyAgain: (items: any[]) => void;
  isLoading: boolean;
}) {

  if (!order) return null;

  const router = useRouter();
  const actions = useOrderState(order);
  if (!actions) return null;

  const { needPayment, canCancel, canBuyAgain, needsReview } = actions;

  return (
    <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-2">
      {needPayment && (
        <button
          onClick={onPayOrder}
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

      {needsReview && (
        <button
          onClick={() => router.push(`/orders/${order._id}/review`)}
          className="w-full flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 active:bg-brand-color-900 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <DynamicIcon name="Star" size={15} />
          Leave Review
        </button>
      )}

      {canBuyAgain && (
        <button
          onClick={() => onBuyAgain(order.items)}
          className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 active:bg-green-900 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <DynamicIcon name="RotateCcw" size={15} />
          Order again
        </button>
      )}

      {canCancel && (
        <button
          onClick={onCancelOrder}
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