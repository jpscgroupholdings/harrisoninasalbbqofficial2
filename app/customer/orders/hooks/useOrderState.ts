import { ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";
import { OrdersApiResponse } from "@/types/OrderTypes";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";

/**
 * Payment status key used for styling/label lookup in the UI.
 * These are NOT the same as PAYMENT_STATUSES — they represent
 * the customer-facing payment state derived from order + payment data.
 */
export type CustomerPaymentKey =
  | "awaiting_payment"
  | "unpaid"
  | "paid"
  | "cod_pending"
  | "payment_failed"
  | "payment_expired"
  | "payment_cancelled";

export function useOrderState(order: OrdersApiResponse["data"][number] | null) {
  if (!order) return null;

  const status = order.status as OrderStatus;
  const paymentMethod = order.paymentInfo?.paymentMethod;
  const paymentConfirmed = order.paymentInfo?.paymentConfirmed;
  const paymentStatus = order.paymentInfo?.paymentStatus;
  const hasPaymentId = !!order.paymentInfo?.paymentId;

  const isCancelled =
    order.status === ORDER_STATUSES.CANCELLED ||
    order.status === ORDER_STATUSES.FAILED ||
    order.status === ORDER_STATUSES.EXPIRED;

  const isCompleted = order.status === ORDER_STATUSES.COMPLETED;

  const needsReview = isCompleted && !order.isReviewed;
  const hasReview = isCompleted && !!order.isReviewed;

  const needPayment =
    order.status === ORDER_STATUSES.PENDING_PAYMENT && !paymentConfirmed;

  const canCancel =
    status === ORDER_STATUSES.PENDING_PAYMENT ||
    (status === ORDER_STATUSES.PENDING && !paymentConfirmed);

  const canBuyAgain = isCancelled || isCompleted;

  /**
   * Derive a customer-facing payment status key from the raw data.
   *
   * Logic:
   *  - paymentConfirmed → "paid" (Maya confirmed or equivalent)
   *  - paymentMethod === "cod" + order pending → "cod_pending"
   *  - paymentStatus === PAYMENT_SUCCESS but no paymentId → "unpaid" (edge case)
   *  - paymentStatus is a terminal failure → map to corresponding key
   *  - no paymentId and no paymentConfirmed → "awaiting_payment"
   *  - has paymentId but paymentConfirmed is still false → "unpaid"
   */
  const paymentStatusKey: CustomerPaymentKey = (() => {
    if (isCancelled) {
      if (paymentStatus === PAYMENT_STATUSES.PAYMENT_FAILED) return "payment_failed";
      if (paymentStatus === PAYMENT_STATUSES.PAYMENT_EXPIRED) return "payment_expired";
      if (paymentStatus === PAYMENT_STATUSES.PAYMENT_CANCELLED) return "payment_cancelled";
      return "unpaid";
    }

    if (paymentConfirmed) return "paid";

    if (paymentMethod === "cod" && status === ORDER_STATUSES.PENDING) return "cod_pending";

    if (paymentStatus === PAYMENT_STATUSES.PAYMENT_FAILED) return "payment_failed";
    if (paymentStatus === PAYMENT_STATUSES.PAYMENT_EXPIRED) return "payment_expired";
    if (paymentStatus === PAYMENT_STATUSES.PAYMENT_CANCELLED) return "payment_cancelled";

    // paymentStatus === PAYMENT_SUCCESS but no paymentId — shouldn't happen but guard
    if (paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS && !hasPaymentId) return "unpaid";

    // No paymentId and not confirmed → still waiting for payment
    if (!hasPaymentId && !paymentConfirmed) return "awaiting_payment";

    // Has paymentId but not yet confirmed (webhook not received)
    if (hasPaymentId && !paymentConfirmed) return "unpaid";

    return "awaiting_payment";
  })();

  return {
    status,
    paymentStatusKey,
    isCompleted,
    isCancelled,
    needsReview,
    hasReview,
    needPayment,
    canCancel,
    canBuyAgain,
  };
}
