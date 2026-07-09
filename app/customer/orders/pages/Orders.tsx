"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { GuestOrderLookup } from "./GuestPage";
import LoadingPage from "@/components/ui/LoadingPage";
import {
  FULFILLMENT_TYPE,
  ORDER_STATUSES,
  OrderStatus,
} from "@/types/orderConstants";
import { authClient } from "@/lib/auth-client";
import { ItemMosaic } from "../../menu/components/ItemMosaic";
import {
  OrderSummary,
  useCustomerOrders,
  useCustomerOrderSummary,
} from "@/hooks/api/customers/useCustomerOrders";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/helper/formatDate";
import { useOrderState, CustomerPaymentKey } from "../hooks/useOrderState";
import { OrderActions } from "../components/OrderActions";
import { OrderType } from "@/types/OrderTypes";
import { formatCurrency } from "@/helper/formatCurrency";

/* ─── Types ─────────────────────────────────────────────────────────── */
type Tab = {
  key: string;
  label: string;
  statuses?: OrderStatus[];
};

/* ─── Tab config ─────────────────────────────────────────────────────── */
const TABS: Tab[] = [
  { key: "all", label: "All" },
  {
    key: ORDER_STATUSES.PENDING,
    label: "Pending",
    statuses: [ORDER_STATUSES.PENDING_PAYMENT, ORDER_STATUSES.PENDING],
  },
  { key: ORDER_STATUSES.PREPARING, label: "Preparing" },
  {
    key: ORDER_STATUSES.DISPATCH,
    label: "To receive",
    statuses: [ORDER_STATUSES.DISPATCH, ORDER_STATUSES.READY_FOR_PICKUP],
  },
  { key: ORDER_STATUSES.COMPLETED, label: "Completed" },
  {
    key: ORDER_STATUSES.CANCELLED,
    label: "Cancelled",
    statuses: [
      ORDER_STATUSES.CANCELLED,
      ORDER_STATUSES.FAILED,
      ORDER_STATUSES.EXPIRED,
    ], // ← multi
  },
];

/* ─── Status pill ────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: "bg-amber-50 text-amber-800",
  [ORDER_STATUSES.PENDING]: "bg-amber-50 text-amber-800",
  [ORDER_STATUSES.PREPARING]: "bg-blue-50 text-blue-800",
  [ORDER_STATUSES.DISPATCH]: "bg-purple-50 text-purple-800",
  [ORDER_STATUSES.READY_FOR_PICKUP]: "bg-green-50 text-green-800",
  [ORDER_STATUSES.COMPLETED]: "bg-green-50 text-green-800",
  [ORDER_STATUSES.CANCELLED]: "bg-red-50 text-red-800",
  [ORDER_STATUSES.FAILED]: "bg-red-50 text-red-700",
  [ORDER_STATUSES.EXPIRED]: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: "Pending",
  [ORDER_STATUSES.PENDING]: "Pending",
  [ORDER_STATUSES.PREPARING]: "Preparing",
  [ORDER_STATUSES.DISPATCH]: "Dispatched / To Receive",
  [ORDER_STATUSES.READY_FOR_PICKUP]: "Ready for Pickup",
  [ORDER_STATUSES.COMPLETED]: "Completed",
  [ORDER_STATUSES.CANCELLED]: "Cancelled",
  [ORDER_STATUSES.FAILED]: "Failed",
  [ORDER_STATUSES.EXPIRED]: "Expired",
};

/* ─── Payment status pill ────────────────────────────────────────────── */
const PAYMENT_STYLES: Record<CustomerPaymentKey, string> = {
  awaiting_payment: "bg-amber-50 text-amber-800",
  unpaid: "bg-amber-50 text-amber-800",
  cod_pending: "bg-gray-100 text-gray-500",
  paid: "bg-green-50 text-green-800",
  payment_failed: "bg-red-50 text-red-700",
  payment_expired: "bg-gray-100 text-gray-600",
  payment_cancelled: "bg-red-50 text-red-800",
};

const PAYMENT_LABELS: Record<CustomerPaymentKey, string> = {
  awaiting_payment: "Awaiting payment",
  unpaid: "Unpaid",
  cod_pending: "Pay on pickup",
  paid: "Paid",
  payment_failed: "Payment failed",
  payment_expired: "Payment expired",
  payment_cancelled: "Payment cancelled",
};

function PaymentStatusPill({ paymentKey }: { paymentKey: CustomerPaymentKey }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${PAYMENT_STYLES[paymentKey] ?? "bg-gray-100 text-gray-600"}`}
    >
      {PAYMENT_LABELS[paymentKey] ?? paymentKey}
    </span>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ─── Skeleton card ──────────────────────────────────────────────────── */
function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-100 shrink-0" />
        <div className="flex-1 px-4 py-3.5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between mb-2">
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3.5 w-3/4 bg-gray-100 rounded-full mb-1.5" />
            <div className="h-3.5 w-1/2 bg-gray-100 rounded-full" />
          </div>
          <div className="flex justify-between mt-3">
            <div className="h-4 w-16 bg-gray-100 rounded-full" />
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 px-4 py-2.5 flex justify-end gap-2">
        <div className="h-7 w-24 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Order card ─────────────────────────────────────────────────────── */
function OrderCard({
  order,
  onViewDetails,
}: {
  order: OrderType;
  onViewDetails: () => void;
}) {
  const itemNames = order.items.map((i: any) => i.name).join(", ");

  const actions = useOrderState(order);
  if (!actions) return null;
  const {
    status,
    paymentStatusKey,
    needsReview,
    hasReview,
    isCancelled,
  } = actions;

  const isPickup =
    order?.fulfillmentType && order.fulfillmentType === FULFILLMENT_TYPE.PICKUP;

  return (
    <div
      className={[
        "bg-white rounded-2xl border overflow-hidden transition-all duration-150",
        needsReview || hasReview ? "border-green-200" : "border-gray-100",
        isCancelled ? "opacity-70" : "hover:border-gray-200 hover:shadow-sm",
      ].join(" ")}
    >
      {/* ── Top: image + body ── */}
      <div className="flex">
        <ItemMosaic items={order.items} />

        <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-between">
          {/* Header row */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="font-mono text-[11px] text-gray-400 tracking-wide">
                #
                {order.paymentInfo?.referenceNumber ??
                  order._id.slice(-6).toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5">
                <StatusPill status={status} />
                <PaymentStatusPill paymentKey={paymentStatusKey} />
              </div>
            </div>

            {/* Item names – 2-line clamp */}
            <p className="text-[13px] text-gray-800 leading-snug line-clamp-2 mb-2">
              {itemNames}
            </p>

            {/* Meta chips */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <DynamicIcon name="Clock" size={13} />
                {formatDate(order.createdAt)}
              </span>
              {order.fulfillmentType && (
                <span
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
                    isPickup
                      ? "bg-blue-50 text-blue-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  <DynamicIcon name={isPickup ? "Store" : "Truck"} size={12} />
                  {isPickup ? "Pickup" : "Delivery"}
                </span>
              )}
              {order.branchSnapshot?.name && (
                <span className="flex items-center gap-1 text-[12px] text-gray-400">
                  <DynamicIcon name="Store" size={13} />
                  {order.branchSnapshot.name}
                </span>
              )}
            </div>
          </div>

          {/* Footer row: total + actions */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[15px] font-medium text-gray-900">
              {formatCurrency(Number(order.total?.totalAmount))}
            </p>
            <OrderActions order={order} variant="compact" />
          </div>
        </div>
      </div>

      {/* ── Divider + view details ── */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex justify-end gap-2">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-[12px] font-medium transition-colors hover:bg-gray-50"
        >
          <DynamicIcon name="Eye" size={13} />
          View details
        </button>
      </div>
    </div>
  );
}

const ITEM_PER_PAGE = 10;

/* ─── Main page ──────────────────────────────────────────────────────── */
const Orders = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMounted, setIsMounted] = useState(false);

  const { data: currentUser, isPending } = authClient.useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeTab = useMemo(() => {
    const statuses = searchParams.getAll("status");
    if (statuses.length === 0) return "all";

    const matched = TABS.find((tab) => {
      const tabStatuses = tab.statuses ?? [tab.key];
      return (
        tabStatuses.length === statuses.length &&
        tabStatuses.every((s) => statuses.includes(s))
      );
    });

    return matched?.key ?? statuses[0];
  }, [searchParams]);
  const currentPage = Number(searchParams.get("page") || "1");

  const { data: orderSummary } = useCustomerOrderSummary();

  const currentTab = TABS.find((tab) => tab.key === activeTab);

  const { data: placedOrders, isLoading: isOrdersLoading } = useCustomerOrders({
    status:
      activeTab === "all"
        ? undefined
        : (currentTab?.statuses ?? [activeTab as OrderStatus]),
    page: currentPage,
    limit: ITEM_PER_PAGE,
  });

  const filteredOrders = placedOrders?.data ?? [];

  // Derive tab badge counts from summary (never from the filtered list)
  const getTabCount = (tab: Tab): number | undefined => {
    if (!orderSummary) return undefined;
    if (tab.key === "all") return undefined; // "All" badge not shown
    if (tab.key === "cancelled") return undefined; // Cancelled badge not shown
    return orderSummary[tab.key as keyof OrderSummary] ?? 0;
  };

  const totalItems: number = placedOrders?.pagination?.total ?? 0;
  const totalPages: number = Math.ceil(totalItems / ITEM_PER_PAGE);

  const handleTabChange = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("status");

    if (tab.key !== "all") {
      const statusesToSend = tab.statuses ?? [tab.key];
      statusesToSend.forEach((s) => params.append("status", s));
    }

    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
    );
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
    // Scroll back to top of list smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Early returns after all hooks */
  if (!isMounted || isPending || isOrdersLoading) {
    return (
      <div className="relative h-screen z-0">
        <LoadingPage />
      </div>
    );
  }

  if (!currentUser?.user) return <GuestOrderLookup />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-gray-900 tracking-tight">
            My orders
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Track and manage your purchases
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-hide py-1">
          {TABS.map((tab) => {
            const count = getTabCount(tab);
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab)}
                className={[
                  "relative px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition-all border",
                  isActive
                    ? "bg-brand-color-500 border-brand-color-500 text-white font-medium"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800",
                ].join(" ")}
              >
                {tab.label}
                {(count ?? 0) > 0 && (
                  <span
                    className={[
                      "absolute -top-1 -right-1 w-4 h-4 text-[10px] font-semibold rounded-full flex items-center justify-center border border-white",
                      isActive
                        ? "bg-white text-brand-color-500"
                        : "bg-brand-color-500 text-white",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => router.push("/")}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer bg-brand-color-500 text-white border border-brand-color-500 hover:bg-[#c13500] transition-colors"
          >
            + New order
          </button>
        </div>

        {/* Orders list */}
        {isOrdersLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DynamicIcon name="Package" size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-[15px] font-medium">
              No orders here
            </p>
            <p className="text-gray-400 text-[13px] mt-1">
              Your orders will appear once placed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onViewDetails={() => router.push(`/orders/${order._id}`)}
              />
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={handlePageChange}
            limit={ITEM_PER_PAGE}
            windowSize={2}
          />
        )}
      </div>
    </div>
  );
};

export default Orders;
