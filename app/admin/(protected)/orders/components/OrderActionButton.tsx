"use client";

import { useAdminUpdateOrder } from "@/hooks/api/admin/useAdminOrders";
import {
  canTransitionTo,
  FULFILLMENT_TYPE,
  FulfillmentType,
  getActionConfig,
  ORDER_STATUSES,
  OrderStatus,
  STATUS_TRANSITIONS,
} from "@/types/orderConstants";
import { PaymentStatus } from "@/types/paymentConstants";

interface Props {
  orderId: string;
  status: OrderStatus;
  paymentMethod: "cod" | "maya";
  paymentStatus: PaymentStatus;
  fulfillmentType?: FulfillmentType;
  role: "admin" | "customer";
}

export function OrderActionButton({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  fulfillmentType = FULFILLMENT_TYPE.DELIVERY,
  role,
}: Props) {
  const nextStatuses = STATUS_TRANSITIONS[status];
  const { mutate, isPending } = useAdminUpdateOrder();

  if (!nextStatuses?.length) return null;

  const handleClick = (nextStatus: OrderStatus) => {
    mutate({ id: orderId, data: { status: nextStatus } });
  };

  const allowedStatuses = nextStatuses.filter((nextStatus) => {
    if (!canTransitionTo(status, nextStatus, role)) return false;
    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) {
      return nextStatus !== ORDER_STATUSES.DISPATCH;
    }
    return nextStatus !== ORDER_STATUSES.READY_FOR_PICKUP;
  });

  return (
    <div className="flex gap-2">
      {allowedStatuses.map((nextStatus) => {
        const actionConfig = getActionConfig(status, nextStatus);

        if (!actionConfig) return null;

        if (actionConfig.roles && !actionConfig.roles.includes(role)) {
          return null;
        }

        if (
          actionConfig.paymentMethods &&
          !actionConfig.paymentMethods.includes(paymentMethod)
        ) {
          return null;
        }

        // Maya orders must be paid before admin can accept
        const isMayaUnpaid =
          paymentMethod === "maya" &&
          paymentStatus !== "PAYMENT_SUCCESS" &&
          nextStatus === ORDER_STATUSES.PREPARING;

        if (isMayaUnpaid) return null; 

        return (
          <button
            key={nextStatus}
            onClick={() => handleClick(nextStatus)}
            disabled={isPending}
            className={`text-xs rounded-full font-bold text-white py-2 px-4 cursor-pointer text-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${actionConfig.variant}`}
          >
            {isPending ? "Updating..." : actionConfig.label}
          </button>
        );
      })}
    </div>
  );
}
