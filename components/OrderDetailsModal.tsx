"use client";

import { OrderItemImage } from "@/app/customer/components/OrderItemImage";
import { OrderActions } from "@/app/customer/orders/components/OrderActions";
import LoadingPage from "@/components/ui/LoadingPage";
import StatusBadge from "@/components/ui/StatusBadge";
import { useOrderBase } from "@/hooks/api/shared/useOrdersBase";
import { FULFILLMENT_TYPE, ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";
import { MailIcon, PhoneIcon, UserIcon } from "lucide-react";

interface OrderDetailsProps {
  orderId: string;
  role: "admin" | "customer" | "guest";
  variant: "modal" | "page";
}

const OrderDetailsModal = ({ orderId, role, variant }: OrderDetailsProps) => {
  const {
    data: orderToView,
    isLoading,
    isError,
    error,
  } = useOrderBase(role, orderId);
  const vatableSales = orderToView?.total?.vatableSales ?? 0;
  const totalAmount = orderToView?.total?.totalAmount ?? 0;

  const isMaya =
    orderToView && orderToView.paymentInfo.paymentMethod === "maya";
  const isMayaPaid =
    isMaya &&
    orderToView.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS;
  const fulfillmentLabel =
    orderToView?.fulfillmentType === FULFILLMENT_TYPE.PICKUP ? "Pickup" : "Delivery";

  const content = (
    <>
      {isLoading && (
        <div className="relative flex items-center justify-center py-12 h-[50vh]">
          <LoadingPage />
        </div>
      )}
      {isError && (
        <p className="text-center text-sm text-red-500 py-8">
          {error?.message ?? "Failed to fetch order"}
        </p>
      )}
      {orderToView && (
        <div>
          {/** If view by guest - show buttons */}
          {role === "guest" && <OrderActions order={orderToView} />}

          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="text-xs text-gray-400">Reference ID</p>
                  <p className="text-sm font-mono font-medium text-gray-700">
                    {orderToView.paymentInfo?.referenceNumber ?? "--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="text-sm font-mono font-medium text-gray-700">
                    {orderToView._id ?? "--"}
                  </p>
                </div>
              </div>
              {/** Status badge */}
              <StatusBadge status={orderToView.status ?? ""} />
              {orderToView.status === ORDER_STATUSES.PENDING_PAYMENT &&
                isMaya &&
                !isMayaPaid && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Awaiting payment
                  </span>
                )}
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
                    {orderToView.paymentInfo?.firstName ?? "—"}{" "}
                    {orderToView.paymentInfo?.lastName ?? "—"}
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
            {/* Fulfillment */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Fulfillment
              </p>
              <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-sm text-gray-700">
                {fulfillmentLabel}
                {orderToView.fulfillmentType === FULFILLMENT_TYPE.PICKUP &&
                  orderToView.branchSnapshot?.name && (
                    <span className="block text-xs text-gray-400 mt-1">
                      Pickup branch: {orderToView.branchSnapshot.name}
                    </span>
                  )}
              </div>
            </div>
            <hr className="border-stone-100" />
            {/* Shipping Address */}
            {orderToView.paymentInfo?.shippingAddress && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Shipping Address
                  </p>
                  <div className="flex flex-col gap-1 text-sm text-gray-700 bg-stone-50 rounded-lg px-3 py-2.5">
                    <span>
                      {orderToView.paymentInfo.shippingAddress.line1}
                      {orderToView.paymentInfo.shippingAddress.line2 && (
                        <>, {orderToView.paymentInfo.shippingAddress.line2}</>
                      )}
                    </span>
                    <span>
                      {orderToView.paymentInfo.shippingAddress.city},{" "}
                      {orderToView.paymentInfo.shippingAddress.province}{" "}
                      {orderToView.paymentInfo.shippingAddress.postalCode}
                    </span>
                    <span className="text-gray-400">
                      {orderToView.paymentInfo.shippingAddress.country}
                    </span>
                    {orderToView.paymentInfo.shippingAddress.landmark && (
                      <span className="text-xs text-gray-400 mt-0.5">
                        📍 Landmark:{" "}
                        {orderToView.paymentInfo.shippingAddress.landmark}
                      </span>
                    )}
                  </div>
                </div>
                <hr className="border-stone-100" />
              </>
            )}
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
                        <div className="w-12 h-12 rounded-lg">
                          <OrderItemImage image={item.image} name={item.name} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          ₱{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      ₱{(item.price * item.quantity).toLocaleString()}
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
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      orderToView.paymentInfo?.paymentMethod === "maya"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {orderToView.paymentInfo?.paymentMethod === "maya"
                      ? "Maya"
                      : orderToView.fulfillmentType === FULFILLMENT_TYPE.PICKUP
                        ? "Cash on Pickup"
                        : "Cash on Delivery"}
                  </span>
                </div>
                {orderToView.paymentInfo?.method && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Card</span>
                    <span className="font-medium capitalize">
                      {orderToView.paymentInfo.method.scheme}{" "}
                      {orderToView.paymentInfo.method.last4 && (
                        <span className="font-mono">
                          ••••{orderToView.paymentInfo.method.last4}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-xs">
                    {orderToView.paymentInfo?.referenceNumber ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="capitalize font-medium">
                    {orderToView.paymentInfo?.paymentStatus ?? "—"}
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
            {/* data.timeline */}
            {orderToView.timeline &&
              Object.keys(orderToView.timeline).length > 0 && (
                <>
                  <hr className="border-stone-100" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      data.timeline
                    </p>
                    <div className="flex flex-col gap-1.5 text-sm text-gray-700">
                      {Object.entries(orderToView.timeline)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize">
                              {key.replace("At", "")}
                            </span>
                            <span className="text-xs">
                              {new Date(value as string).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
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
        </div>
      )}
    </>
  );

  if (variant === "page") {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto max-w-3xl bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default OrderDetailsModal;
