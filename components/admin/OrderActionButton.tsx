// components/OrderActionButton.tsx
"use client";
import { ORDER_TRANSITIONS, OrderStatus } from "@/utils/orderActions";
import { useUpdateOrder } from "@/hooks/api/useOrders";

interface Props {
  orderId: string;
  status: OrderStatus;
}

export function OrderActionButton({ orderId, status }: Props) {
  const transition = ORDER_TRANSITIONS[status];
  const { mutate, isPending } = useUpdateOrder();

  if (!transition) return null;

  const handleClick = () => {
    mutate({
      id: orderId,
      data: { status: transition.nextStatus },
    });
  };

  // OrderActionButton.tsx
return (
  <button
    onClick={handleClick}
    disabled={isPending}
    className={`text-xs rounded-full font-bold text-white py-2 px-4 cursor-pointer ${transition.variant}`}
  >
    {isPending ? "Updating..." : transition.label}

  </button>
);
}