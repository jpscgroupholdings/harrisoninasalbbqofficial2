"use client";

import { useState } from "react";
import { OrderActions } from "@/app/customer/orders/components/OrderActions";
import LoadingPage from "@/components/ui/LoadingPage";
import StatusBadge from "@/components/ui/StatusBadge";
import { useOrderBase } from "@/hooks/api/shared/useOrdersBase";
import { FULFILLMENT_TYPE, ORDER_STATUSES } from "@/types/orderConstants";

import { buildEmbedUrl } from "@/lib/google-maps";
import { formatCurrency } from "@/helper/formatCurrency";
import { multiplyMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatDate } from "@/helper/formatDate";
import {
  SectionCard,
  OrderItemRow,
  CustomerCard,
  FulfillmentCard,
  PaymentStatusPill,
} from "./order-details";

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

/** Simple label-value row for details */
const InfoRow = ({
  label,
  value,
  labelClassName,
  valueClassName,
  className,
}: {
  label: React.ReactNode | string;
  value: React.ReactNode | string;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
}) => (
  <div className={cn("flex justify-between items-start py-1.5", className)}>
    <span className={cn("text-xs text-gray-400", labelClassName)}>{label}</span>
    <span className={cn("text-sm text-gray-700 text-right", valueClassName)}>
      {value}
    </span>
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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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

          {/* Map iframe: branch location for pickup (customer only), shipping address for delivery (admin only) */}
          {(() => {
            const isAdmin = role === "admin";

            // Pickup: customer needs directions to branch; admin already knows their own branch
            // Delivery: admin needs to see shipping location; customer knows their own address
            if (isPickup && isAdmin) return null;
            if (!isPickup && !isAdmin) return null;

            const branchCoords =
              orderToView?.branchSnapshot?.location?.coordinates;
            const lat = isPickup
              ? branchCoords?.[1]
              : shippingAddress?.coordinates?.lat;
            const lng = isPickup
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
                <InfoRow
                  key={i}
                  label={`${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`}
                  value={formatCurrency(
                    multiplyMoney(item.price, item.quantity),
                  )}
                  className="py-1"
                />
              ))}

              {/* Subtotal */}
              <InfoRow
                label="Subtotal"
                value={formatCurrency(vatableSales)}
                labelClassName="font-medium text-gray-600"
                valueClassName="font-medium text-gray-700"
                className="border-t border-gray-100 mt-1 pt-2"
              />

              {/* Delivery fee */}
              {!isPickup && deliveryFeeAmount > 0 && (
                <InfoRow
                  label={`Delivery Fee${deliveryDistanceKm != null ? ` (${deliveryDistanceKm.toFixed(1)} km)` : ""}`}
                  value={formatCurrency(deliveryFeeAmount)}
                />
              )}
              {!isPickup && deliveryFeeAmount === 0 && freeDeliveryApplied && (
                <InfoRow
                  label={`Delivery Fee${deliveryDistanceKm != null ? ` (${deliveryDistanceKm.toFixed(1)} km)` : ""}`}
                  value="FREE"
                  valueClassName="text-green-600 font-bold"
                />
              )}

              {/* Discounts */}
              {discountAmount > 0 && (
                <InfoRow
                  label="Discount"
                  value={`-${formatCurrency(discountAmount)}`}
                  valueClassName="text-green-600 font-medium"
                />
              )}

              {/* Detailed discount breakdown (when expanded) */}
              {expandedSections.totals && (
                <>
                  {voucherDiscountAmount > 0 && (
                    <InfoRow
                      label="Voucher Discount"
                      value={`-${formatCurrency(voucherDiscountAmount)}`}
                      valueClassName="text-green-600 text-xs"
                    />
                  )}
                  {productDiscountPromotions.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mt-2">
                        Item Promos
                      </p>
                      {productDiscountPromotions.map((p, i) => (
                        <InfoRow
                          key={i}
                          label={`${p.productName} (${p.name})`}
                          value={`-${formatCurrency(p.discountAmount)}`}
                          labelClassName="text-xs"
                          valueClassName="text-green-600 text-xs"
                        />
                      ))}
                    </>
                  )}
                  {orderDiscountPromotionName && (
                    <InfoRow
                      label={`Promo: ${orderDiscountPromotionName}`}
                      value={`-${formatCurrency(orderDiscountAmount)}`}
                      labelClassName="text-xs"
                      valueClassName="text-green-600 text-xs"
                    />
                  )}
                  {discountCode && (
                    <InfoRow
                      label="Discount Code"
                      value={discountCode}
                      valueClassName="font-mono text-xs text-gray-400"
                    />
                  )}
                </>
              )}

              {/* VAT */}
              {vatAmount > 0 && (
                <InfoRow
                  label="VAT (12%)"
                  value={formatCurrency(vatAmount)}
                  valueClassName="text-xs text-gray-500"
                  className="border-t border-gray-100 mt-1 pt-2"
                />
              )}

              {/* Grand total */}
              <InfoRow
                label="Total"
                value={formatCurrency(totalAmount)}
                labelClassName="text-sm font-semibold text-gray-800"
                valueClassName="text-lg font-bold text-gray-900"
                className="border-t border-gray-200 mt-1 pt-2"
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
              <InfoRow
                label="Method"
                value={
                  isMaya
                    ? "Maya"
                    : isPickup
                      ? "Cash on Pickup"
                      : "Cash on Delivery"
                }
                valueClassName={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  isMaya ? paymentMethodBadge.maya : paymentMethodBadge.cash,
                )}
              />
              {paymentMethod && (
                <InfoRow
                  label="Card"
                  value={`${paymentMethod.scheme}${paymentMethod.last4 ? ` ••••${paymentMethod.last4}` : ""}`}
                  valueClassName="font-medium capitalize"
                />
              )}
              <InfoRow
                label="Reference"
                value={referenceNumber}
                valueClassName="font-mono text-xs text-gray-500"
              />
              {paymentId && role === "admin" && (
                <InfoRow
                  label="Payment ID"
                  value={paymentId}
                  valueClassName="font-mono text-xs text-gray-500 truncate max-w-45 block"
                />
              )}
              <InfoRow
                label="Status"
                value={paymentStatus}
                valueClassName="font-mono text-xs text-gray-500"
              />
              <InfoRow
                label="Paid At"
                value={formatDate(paidAt)}
                valueClassName="text-xs text-gray-500"
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
        </div>
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
