"use client";

import { IconButton } from "@/components/ui/buttons";
import { formatDate } from "@/helper/formatter";
import { useAdminUpdateOrder } from "@/hooks/api/admin/useAdminOrders";
import {
  canTransitionTo,
  FULFILLMENT_TYPE,
  getActionConfig,
  ORDER_STATUSES,
  OrderStatus,
  STATUS_TRANSITIONS,
} from "@/types/orderConstants";
import { OrderType } from "@/types/OrderTypes";

interface Props {
  order: OrderType;
  role: "admin" | "customer";
}

export function OrderActionButton({ order, role }: Props) {
  const { mutate, isPending } = useAdminUpdateOrder();

  const {
    status,
    fulfillmentType = FULFILLMENT_TYPE.DELIVERY,
    paymentInfo,
    reservation,
  } = order;

  const paymentMethod = paymentInfo.paymentMethod;
  const paymentConfirmed = paymentInfo.paymentConfirmed === true;

  const nextStatuses = STATUS_TRANSITIONS[status];

  if (!nextStatuses?.length) return null;

  const handleClick = (nextStatus: OrderStatus) => {
    mutate({ id: order._id, data: { status: nextStatus } });
  };

  const isDineInReservation =
    fulfillmentType === FULFILLMENT_TYPE.DINE_IN && !!reservation?.scheduledAt;

  const allowedStatuses = nextStatuses.filter((nextStatus) => {
    if (!canTransitionTo(status, nextStatus, role)) return false;
    // Pickup and dine-in orders cannot be dispatched — they go to ready_for_pickup
    if (
      fulfillmentType === FULFILLMENT_TYPE.PICKUP ||
      fulfillmentType === FULFILLMENT_TYPE.DINE_IN
    ) {
      if (nextStatus === ORDER_STATUSES.DISPATCH) return false;
    }
    // Delivery orders cannot be marked ready_for_pickup — they go to dispatch
    if (nextStatus === ORDER_STATUSES.READY_FOR_PICKUP && fulfillmentType === FULFILLMENT_TYPE.DELIVERY) {
      return false;
    }
    // Dine-in reservations: pending → confirmed (accept), then confirmed → preparing (1hr guard)
    if (status === ORDER_STATUSES.PENDING) {
      if (isDineInReservation && nextStatus === ORDER_STATUSES.PREPARING) return false;
      if (!isDineInReservation && nextStatus === ORDER_STATUSES.CONFIRMED) return false;
    }
    return true;
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

        // Maya orders must be paid (paymentConfirmed) before admin can accept
        const isMayaUnpaid =
          paymentMethod === "maya" &&
          !paymentConfirmed &&
          nextStatus === ORDER_STATUSES.PREPARING;

        if (isMayaUnpaid) return null;

        // Guard: confirmed dine-in reservations can only start preparing
        // within 1 hour of scheduled time.
        const isPreparingConfirmedReservation =
          status === ORDER_STATUSES.CONFIRMED &&
          nextStatus === ORDER_STATUSES.PREPARING &&
          fulfillmentType === FULFILLMENT_TYPE.DINE_IN;

        if (isPreparingConfirmedReservation) {
          if (!reservation?.scheduledAt) {
            return (
              <span
                key={nextStatus}
                className="text-xs text-red-400 italic"
                title="Reservation date is missing — contact support"
              >
                Invalid reservation
              </span>
            );
          }

          const scheduledTime = new Date(reservation.scheduledAt).getTime();
          const oneHourBefore = scheduledTime - 60 * 60 * 1000;
          const isTooEarly = Date.now() < oneHourBefore;

          if (isTooEarly) {
            const scheduled = new Date(reservation.scheduledAt);
            const earliest = new Date(oneHourBefore);
            return (
              <IconButton
                key={nextStatus}
                variant="underline"
                disabled={true}
                className="text-xs"
                title={`Reservation: ${formatDate(scheduled)} — You can start preparing at ${formatDate(earliest)}`}
                text={actionConfig.label}
              />
            );
          }
        }

        return (
          <IconButton
            key={nextStatus}
            onClick={() => handleClick(nextStatus)}
            disabled={isPending}
            text={isPending ? "Updating..." : actionConfig.label}
            icon={{
              name: isPending ? "Loader2" : null,
              className: "animate-spin",
            }}
            variant="underline"
            className={`text-xs ${actionConfig.variant}`}
          />
        );
      })}
    </div>
  );
}
