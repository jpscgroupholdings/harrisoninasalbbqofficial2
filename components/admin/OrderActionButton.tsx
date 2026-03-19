/**
 * OrderActionButton.tsx
 * 
 * Button to transition order to next status
 * Uses ORDER_ACTION_CONFIG for UI styling and labels
 * Uses STATUS_TRANSITIONS to validate the transition
 */


"use client";

import { useUpdateOrder } from "@/hooks/api/useOrders";
import { ORDER_ACTION_CONFIG, OrderStatus, STATUS_TRANSITIONS } from "@/types/orderConstants";

interface Props {
  orderId: string;
  status: OrderStatus;
}

export function OrderActionButton({ orderId, status }: Props) {

  const nextStatus = STATUS_TRANSITIONS[status as keyof typeof STATUS_TRANSITIONS];
  const actionConfig = ORDER_ACTION_CONFIG[status as keyof typeof ORDER_ACTION_CONFIG];

  const { mutate, isPending } = useUpdateOrder();

  // Don't show button if no transition or no config
  if (!nextStatus || !actionConfig) {
    return null;
  }

  const handleClick = () => {
    mutate({
      id: orderId,
      data: {status: nextStatus},
    });
  };

  // OrderActionButton.tsx
return (
  <button
    onClick={handleClick}
    disabled={isPending}
    className={`text-xs rounded-full font-bold text-white py-2 px-4 cursor-pointer ${actionConfig.variant}`}
  >
    {isPending ? "Updating..." : actionConfig.label}

  </button>
);
}