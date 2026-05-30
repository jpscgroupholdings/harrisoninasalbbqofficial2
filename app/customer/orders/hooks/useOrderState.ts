import { ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";
import { OrdersApiResponse } from "@/types/OrderTypes";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";

export function useOrderState(order: OrdersApiResponse["data"][number] | null) {
  if (!order) return null;

  const status = order.status as OrderStatus;
  const paymentMethod = order.paymentInfo?.paymentMethod;
  const paymentStatus = order.paymentInfo?.paymentStatus;

  const isMayaPaid =
    paymentMethod === "maya" &&
    paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS &&
    status === ORDER_STATUSES.PENDING;

  const isCompleted = order.status === ORDER_STATUSES.COMPLETED;

  const isCancelled =
    order.status === ORDER_STATUSES.CANCELLED ||
    order.status === ORDER_STATUSES.FAILED ||
    order.status === ORDER_STATUSES.EXPIRED;

  const needsReview = isCompleted && !order.isReviewed;

  const needPayment =
    order.status === ORDER_STATUSES.PENDING_PAYMENT &&
    order.paymentInfo?.paymentMethod === "maya" &&
    order.paymentInfo?.paymentStatus !== PAYMENT_STATUSES.PAYMENT_SUCCESS;

  const canCancel =
    status === ORDER_STATUSES.PENDING_PAYMENT ||
    (status === ORDER_STATUSES.PENDING && !isMayaPaid); // COD pending OR Maya not yet paid

  const canBuyAgain = isCancelled || isCompleted;

  const isCodPending =
    order.paymentInfo?.paymentMethod === "cod" &&
    status === ORDER_STATUSES.PENDING;

  return {
    status,
    isMayaPaid,
    isCompleted,
    isCancelled,
    needsReview,
    needPayment,
    canCancel,
    canBuyAgain,
    isCodPending,
  };
}
