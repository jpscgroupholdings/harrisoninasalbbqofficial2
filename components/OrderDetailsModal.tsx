"use client";

import { useState } from "react";
import { OrderActions } from "@/app/customer/orders/components/OrderActions";
import ConfirmationWithReasonModal from "@/components/ConfirmationWithReasonModal";
import LoadingPage from "@/components/ui/LoadingPage";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAdminRefundOrder } from "@/hooks/api/admin/useAdminOrders";
import { useOrderBase } from "@/hooks/api/shared/useOrdersBase";
import {
  FULFILLMENT_TYPE,
  ORDER_STATUSES,
  REFUND_REASONS,
} from "@/types/orderConstants";

import { buildEmbedUrl } from "@/lib/google-maps";
import { formatCurrency, formatDate } from "@/helper/formatter";
import { multiplyMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  OrderItemRow,
  CustomerCard,
  FulfillmentCard,
  PaymentStatusPill,
} from "./order-details";
import { IconButton } from "./ui/buttons";
import { SummaryRow } from "./ui/SummaryRow";

interface OrderDetailsProps {
  orderId: string;
  role: "admin" | "customer" | "guest";
  variant: "modal" | "page";
}

const paymentMethodBadge = {
  maya: "bg-green-100 text-green-700",
  cash: "bg-orange-100 text-orange-700",
} as const;

// Human-readable labels for timeline keys
const timelineLabelMap: Record<string, string> = {
  paidAt: "Paid",
  confirmedAt: "Reservation Confirmed",
  preparingAt: "Preparing",
  dispatchedAt: "Out for delivery",
  readyAt: "Ready for pickup",
  completedAt: "Completed",
  cancelledAt: "Cancelled",
  failedAt: "Failed",
  expiredAt: "Expired",
};

/** Timeline event dot with label and date */
const TimelineEntry = ({ label, date }: { label: string; date: string }) => (
  <div className="relative flex items-center gap-3">
    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 border-2 border-white shrink-0 z-1" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="text-[11px] text-gray-300">{formatDate(date)}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderDetailsModal = ({ orderId, role, variant }: OrderDetailsProps) => {
  const {
    data: orderToView,
    isLoading,
    isError,
    error,
  } = useOrderBase(role, orderId);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    items: true,
    totals: true,
    payment: true,
    timeline: false,
  });

  const [showRefundModal, setShowRefundModal] = useState(false);
  const { mutate: processRefund, isPending: isRefunding } =
    useAdminRefundOrder();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Refund eligibility: completed or cancelled, not already refunded, admin only
  const canRefund =
    role === "admin" &&
    orderToView &&
    (orderToView.status === ORDER_STATUSES.COMPLETED ||
      orderToView.status === ORDER_STATUSES.CANCELLED) &&
    orderToView.refund?.status !== "processed";

  // ─── Destructure orderToView ──────────────────────────────────────────────

  const status = orderToView?.status;
  const items = orderToView?.items ?? [];
  const notes = orderToView?.notes;
  const timeline = orderToView?.timeline;

  const paymentInfo = orderToView?.paymentInfo;
  const referenceNumber = paymentInfo?.referenceNumber ?? "—";
  const customerEmail = paymentInfo?.customerEmail ?? "—";
  const customerPhone = paymentInfo?.customerPhone ?? "—";
  const firstName = paymentInfo?.firstName ?? "—";
  const lastName = paymentInfo?.lastName ?? "—";
  const paymentId = paymentInfo?.paymentId;
  const paymentStatus = paymentInfo?.paymentStatus ?? "—";
  const paidAt = paymentInfo?.paidAt;
  const paymentMethod = paymentInfo?.method;
  const shippingAddress = paymentInfo?.shippingAddress;

  const total = orderToView?.total;
  const vatableSales = total?.vatableSales ?? 0;
  const totalAmount = total?.totalAmount ?? 0;
  const deliveryFeeAmount = total?.deliveryFeeAmount ?? 0;
  const deliveryDistanceKm = total?.deliveryDistanceKm;
  const freeDeliveryApplied = total?.freeDeliveryApplied;
  const discountAmount = total?.discountAmount ?? 0;
  const voucherDiscountAmount = total?.voucherDiscountAmount ?? 0;
  const productDiscountPromotions = total?.productDiscountPromotions ?? [];
  const orderDiscountPromotionName = total?.orderDiscountPromotionName;
  const orderDiscountAmount = total?.orderDiscountAmount ?? 0;
  const discountCode = total?.discountCode;
  const vatAmount = total?.vatAmount ?? 0;

  const isMaya = paymentInfo?.paymentMethod === "maya";
  const isMayaPaid = paymentInfo?.paymentConfirmed === true;
  const isPickup = orderToView?.fulfillmentType === FULFILLMENT_TYPE.PICKUP;
  const isDineIn = orderToView?.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;
  const isNonDelivery = isPickup || isDineIn;

  // ─── Render ───────────────────────────────────────────────────────────────

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
        <div className="flex flex-col gap-5">
          {/* ── Header Card ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-xs text-gray-400">Reference</p>
                <p className="text-sm font-mono font-semibold text-gray-800 truncate">
                  {referenceNumber}
                </p>
                {role === "admin" && (
                  <p className="text-[11px] text-gray-300 font-mono truncate">
                    {orderToView._id}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={status!} />
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {isMayaPaid && <PaymentStatusPill variant="paid" />}
                  {status === ORDER_STATUSES.PENDING_PAYMENT &&
                    isMaya &&
                    !isMayaPaid && (
                      <PaymentStatusPill variant="awaitingPayment" />
                    )}
                </div>
                {status === ORDER_STATUSES.PENDING && isMaya && !isMayaPaid && (
                  <PaymentStatusPill variant="unpaid" />
                )}
              </div>
            </div>
          </div>

          {/* ── Actions (customer / guest only) ── */}
          {(role === "guest" || role === "customer") && (
            <OrderActions order={orderToView} />
          )}

          {/* ── Admin Refund Button ── */}
          {canRefund && (
            <IconButton
              onClick={() => setShowRefundModal(true)}
              text="Process Refund"
              icon={{ name: "HandCoins" }}
              className="rounded-lg bg-blue-500 hover:bg-blue-600"
            />
          )}

          {/* Map iframe: branch location for pickup/dine-in (customer only), shipping address for delivery (admin only) */}
          {(() => {
            const isAdmin = role === "admin";

            // Pickup/dine-in: customer needs directions to branch; admin already knows their own branch
            // Delivery: admin needs to see shipping location; customer knows their own address
            if (isNonDelivery && isAdmin) return null;
            if (!isNonDelivery && !isAdmin) return null;

            const branchCoords =
              orderToView?.branchSnapshot?.location?.coordinates;
            const lat = isNonDelivery
              ? branchCoords?.[1]
              : shippingAddress?.coordinates?.lat;
            const lng = isNonDelivery
              ? branchCoords?.[0]
              : shippingAddress?.coordinates?.lng;

            return lat && lng ? (
              <iframe
                src={buildEmbedUrl(lat, lng)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[0.2] contrast-[1.1] transition-all duration-300 group-hover:grayscale-0"
              />
            ) : null;
          })()}

          {/* ── Info Grid: Customer (admin only) + Fulfillment ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomerCard
              customerDetails={{
                firstName,
                lastName,
                email: customerEmail,
                phone: customerPhone,
              }}
            />
            <FulfillmentCard
              isPickup={isPickup}
              isAdmin={role === "admin"}
              order={orderToView}
            />
          </div>

          {/* ── Order Items ── */}
          <SectionCard
            section="items"
            title={`Order items (${items.reduce((sum, i) => sum + i.quantity, 0)})`}
            expanded={expandedSections.items}
            onToggle={toggleSection}
          >
            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <OrderItemRow key={index} item={item} />
              ))}
            </div>
          </SectionCard>

          {/* ── Order Summary ── */}
          <SectionCard
            section="totals"
            title="Order Summary"
            expanded={expandedSections.totals}
            onToggle={toggleSection}
          >
            <div className="flex flex-col gap-1">
              {/* Itemized line totals — shows where the subtotal comes from */}
              {items.map((item, i) => (
                <SummaryRow
                  key={i}
                  title={`${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`}
                  subTitle={formatCurrency(
                    multiplyMoney(item.price, item.quantity),
                  )}
                  className={{ parent: "py-1" }}
                />
              ))}

              {/* Subtotal */}
              <SummaryRow
                title="Subtotal"
                subTitle={formatCurrency(vatableSales)}
                className={{ parent: "border-t border-gray-100 mt-1 pt-2" }}
              />

              {/* Delivery fee */}
              {!isNonDelivery && deliveryFeeAmount > 0 && (
                <SummaryRow
                  title={`Delivery Fee${deliveryDistanceKm != null ? ` (${deliveryDistanceKm.toFixed(1)} km)` : ""}`}
                  subTitle={formatCurrency(deliveryFeeAmount)}
                />
              )}
              {!isNonDelivery &&
                deliveryFeeAmount === 0 &&
                freeDeliveryApplied && (
                  <SummaryRow
                    title={`Delivery Fee${deliveryDistanceKm != null ? ` (${deliveryDistanceKm.toFixed(1)} km)` : ""}`}
                    subTitle="FREE"
                    className={{ subTitle: "text-green-600 font-bold" }}
                  />
                )}

              {/* Discounts */}
              {discountAmount > 0 && (
                <SummaryRow
                  title="Discount"
                  subTitle={`-${formatCurrency(discountAmount)}`}
                  className={{ subTitle: "text-green-600 font-medium" }}
                />
              )}

              {/* Detailed discount breakdown (when expanded) */}
              {expandedSections.totals && (
                <>
                  {voucherDiscountAmount > 0 && (
                    <SummaryRow
                      title="Voucher Discount"
                      subTitle={`-${formatCurrency(voucherDiscountAmount)}`}
                      className={{ subTitle: "text-green-600 text-xs" }}
                    />
                  )}
                  {productDiscountPromotions.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mt-2">
                        Item Promos
                      </p>
                      {productDiscountPromotions.map((p, i) => (
                        <SummaryRow
                          key={i}
                          title={`${p.productName} (${p.name})`}
                          subTitle={`-${formatCurrency(p.discountAmount)}`}
                          className={{
                            title: "text-xs",
                            subTitle: "text-xs text-green-600",
                          }}
                        />
                      ))}
                    </>
                  )}
                  {orderDiscountPromotionName && (
                    <SummaryRow
                      title={`Promo: ${orderDiscountPromotionName}`}
                      subTitle={`-${formatCurrency(orderDiscountAmount)}`}
                      className={{
                        title: "text-xs",
                        subTitle: "text-xs text-green-600",
                      }}
                    />
                  )}
                  {discountCode && (
                    <SummaryRow
                      title="Discount Code"
                      subTitle={discountCode}
                      className={{
                        subTitle: "font-mono text-xs",
                      }}
                    />
                  )}
                </>
              )}

              {/* VAT */}
              {vatAmount > 0 && (
                <SummaryRow
                  title="VAT (12%)"
                  subTitle={formatCurrency(vatAmount)}
                  className={{
                    parent: "border-t border-gray-100 mt-1 pt-2",
                    subTitle: "text-xs",
                  }}
                />
              )}

              {/* Grand total */}
              <SummaryRow
                title="Total"
                subTitle={formatCurrency(totalAmount)}
                className={{
                  parent: "border-t border-gray-200 mt-1 pt-2",
                  title: "text-sm font-semibold text-gray-800",
                  subTitle: "text-lg font-bold text-gray-900",
                }}
              />
            </div>
          </SectionCard>

          {/* ── Payment ── */}
          <SectionCard
            section="payment"
            title="Payment"
            expanded={expandedSections.payment}
            onToggle={toggleSection}
          >
            <div className="flex flex-col gap-0">
              <SummaryRow
                title="Method"
                subTitle={
                  isMaya
                    ? "Maya"
                    : isPickup
                      ? "Cash on Pickup"
                      : isDineIn
                        ? "Pay at Branch"
                        : "Cash on Delivery"
                }
                className={{
                  subTitle: cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    isMaya ? paymentMethodBadge.maya : paymentMethodBadge.cash,
                  ),
                }}
              />
              {paymentMethod && (
                <SummaryRow
                  title="Card"
                  subTitle={`${paymentMethod.scheme}${paymentMethod.last4 ? ` ••••${paymentMethod.last4}` : ""}`}
                  className={{ subTitle: "font-medium capitalize" }}
                />
              )}
              <SummaryRow
                title="Reference"
                subTitle={referenceNumber}
                className={{ subTitle: "font-mono text-xs" }}
              />
              {paymentId && role === "admin" && (
                <SummaryRow
                  title="Payment ID"
                  subTitle={paymentId}
                  className={{
                    subTitle:
                      "font-mono text-xs text-gray-500 truncate max-w-45 block",
                  }}
                />
              )}
              <SummaryRow
                title="Status"
                subTitle={paymentStatus}
                className={{ subTitle: "font-mono text-xs" }}
              />
              <SummaryRow
                title="Paid At"
                subTitle={formatDate(paidAt)}
                className={{ subTitle: "text-xs" }}
              />
            </div>
          </SectionCard>

          {/* ── Timeline ── */}
          {(timeline && Object.keys(timeline).length > 0) ||
            (orderToView?.createdAt && (
              <SectionCard
                section="timeline"
                title="Timeline"
                expanded={expandedSections.timeline}
                onToggle={toggleSection}
              >
                <div className="relative flex flex-col gap-3 pl-4">
                  <div className="absolute left-1.75 top-2 bottom-2 w-px bg-gray-100" />

                  {/* Placed entry — always the first event */}
                  {orderToView?.createdAt && (
                    <TimelineEntry
                      label="Placed"
                      date={orderToView.createdAt}
                    />
                  )}

                  {Object.entries(timeline ?? {})
                    .filter(([_, value]) => value)
                    .map(([key, value]) => (
                      <TimelineEntry
                        key={key}
                        label={timelineLabelMap[key] ?? key.replace("At", "")}
                        date={value as string}
                      />
                    ))}
                </div>
              </SectionCard>
            ))}

          {/* ── Note ── */}
          {notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-px">📝</span>
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Note
                  </p>
                  <p className="text-sm text-amber-800/80 leading-relaxed">
                    {notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Termination Details (cancel/expire reason) ── */}
          {orderToView?.terminationDetails?.reason && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-px">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                    {status === ORDER_STATUSES.EXPIRED
                      ? "Expired"
                      : "Cancelled"}{" "}
                    — Reason
                  </p>
                  <p className="text-sm text-red-800/80 font-medium">
                    {orderToView.terminationDetails.reason}
                  </p>
                  {orderToView.terminationDetails.notes && (
                    <p className="text-sm text-red-800/60 mt-1 leading-relaxed">
                      {orderToView.terminationDetails.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-red-400 mt-2">
                    {orderToView.terminationDetails.changedByRole === "admin"
                      ? "Admin"
                      : orderToView.terminationDetails.changedByRole ===
                          "system"
                        ? "System (automatic)"
                        : "Customer"}
                    {orderToView.terminationDetails.changedAt
                      ? ` · ${formatDate(orderToView.terminationDetails.changedAt)}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Refund Details ── */}
          {orderToView?.refund?.status === "processed" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-px">💰</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    Refund Processed
                  </p>
                  <SummaryRow
                    title="Amount"
                    subTitle={formatCurrency(orderToView.refund.amount)}
                    className={{ subTitle: "font-semibold text-blue-800" }}
                  />
                  <SummaryRow
                    title="Reason"
                    subTitle={orderToView.refund.reason ?? "—"}
                  />
                  {orderToView.refund.notes && (
                    <p className="text-sm text-blue-800/60 mt-1 leading-relaxed">
                      {orderToView.refund.notes}
                    </p>
                  )}
                  {orderToView.refund.processedAt && (
                    <p className="text-[11px] text-blue-400 mt-2">
                      Processed {formatDate(orderToView.refund.processedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Refund Confirmation Modal ── */}
      {showRefundModal && orderToView && (
        <ConfirmationWithReasonModal
          title="Process Refund"
          subTitle="This will record a refund against this order."
          referenceLabel={
            orderToView.paymentInfo?.referenceNumber ?? orderToView._id
          }
          reasons={REFUND_REASONS}
          confirmLabel="Process Refund"
          confirmVariant="bg-blue-600 hover:bg-blue-700"
          showAmountInput
          defaultAmount={orderToView.total?.totalAmount}
          isLoading={isRefunding}
          onClose={() => setShowRefundModal(false)}
          onConfirm={(data) => {
            processRefund(
              {
                orderId: orderToView._id,
                reason: data.reason,
                notes: data.notes || undefined,
                amount: data.amount,
              },
              { onSuccess: () => setShowRefundModal(false) },
            );
          }}
        />
      )}
    </>
  );

  if (variant === "page") {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl bg-gray-50 p-2 rounded-3xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default OrderDetailsModal;
