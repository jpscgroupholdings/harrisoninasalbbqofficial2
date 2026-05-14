"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { GuestOrderLookup } from "./GuestPage";
import LoadingPage from "@/components/ui/LoadingPage";
import { useOrderActions } from "@/hooks/useOrderActions";
import { ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";
import { authClient } from "@/lib/auth-client";
import { ItemMosaic } from "../components/ItemMosaic";
import {
  OrderSummary,
  useCustomerOrders,
  useCustomerOrderSummary,
} from "@/hooks/api/customers/useCustomerOrders";
import Pagination from "@/components/ui/Pagination";

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
    key: "pending",
    label: "To pay",
    statuses: [ORDER_STATUSES.PENDING],
  },
  { key: "preparing", label: "To dispatch" },
  {
    key: "dispatched",
    label: "To receive",
    statuses: [ORDER_STATUSES.READY],
  },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

/* ─── Status pill ────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  [ORDER_STATUSES.PENDING]: "bg-amber-50 text-amber-800",
  [ORDER_STATUSES.PREPARING]: "bg-blue-50 text-blue-800",
  [ORDER_STATUSES.READY]: "bg-purple-50 text-purple-800",
  [ORDER_STATUSES.COMPLETED]: "bg-green-50 text-green-800",
  [ORDER_STATUSES.CANCELLED]: "bg-red-50 text-red-800",
  [ORDER_STATUSES.EXPIRED]: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUSES.PENDING]: "To pay",
  [ORDER_STATUSES.PREPARING]: "Preparing",
  [ORDER_STATUSES.READY]: "Ready",
  [ORDER_STATUSES.COMPLETED]: "Completed",
  [ORDER_STATUSES.CANCELLED]: "Cancelled",
  [ORDER_STATUSES.EXPIRED]: "Expired",
};

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
  onPayOrder,
  onCancelOrder,
  onBuyAgain,
  onLeaveReview,
}: {
  order: any;
  onViewDetails: () => void;
  onPayOrder: () => void;
  onCancelOrder: () => void;
  onBuyAgain: () => void;
  onLeaveReview: () => void;
}) {
  const isCancelled =
    order.status === ORDER_STATUSES.CANCELLED ||
    order.status === ORDER_STATUSES.EXPIRED;
  const isCompleted = order.status === ORDER_STATUSES.COMPLETED;
  const needsReview = isCompleted && !order.isReviewed;
  const itemNames = order.items.map((i: any) => i.name).join(", ");
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCodPending =
    order.paymentInfo?.paymentMethod === "cod" &&
    order.status === ORDER_STATUSES.PENDING;

  return (
    <div
      className={[
        "bg-white rounded-2xl border overflow-hidden transition-all duration-150",
        needsReview ? "border-green-200" : "border-gray-100",
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
              {isCodPending ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                  Awaiting pickup
                </span>
              ) : (
                <StatusPill status={order.status} />
              )}
            </div>

            {/* Item names – 2-line clamp */}
            <p className="text-[13px] text-gray-800 leading-snug line-clamp-2 mb-2">
              {itemNames}
            </p>

            {/* Meta chips */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <DynamicIcon name="Clock" size={13} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <DynamicIcon name="MapPin" size={13} />
                Pickup
              </span>
            </div>
          </div>

          {/* Footer row: total + primary CTA */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[15px] font-medium text-gray-900">
              <span className="text-[11px] font-normal text-gray-400 mr-0.5">
                ₱
              </span>
              {order.total?.totalAmount?.toFixed(2)}
            </p>

            <div className="flex gap-1.5">
              {order.status === ORDER_STATUSES.PENDING && (
                <>
                  {order.paymentInfo?.paymentMethod !== "cod" && (
                    <button
                      onClick={onPayOrder}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-[12px] font-medium transition-colors hover:bg-green-100"
                    >
                      <DynamicIcon name="ExternalLink" size={13} />
                      Pay now
                    </button>
                  )}

                  <button
                    onClick={onCancelOrder}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 text-[12px] font-medium transition-colors hover:bg-red-50"
                  >
                    <DynamicIcon name="X" size={13} />
                    Cancel
                  </button>
                </>
              )}

              {needsReview && (
                <button
                  onClick={onLeaveReview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-color-500 text-white text-[12px] font-medium transition-colors hover:bg-[#c53600]"
                >
                  <DynamicIcon name="Star" size={13} />
                  Leave review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider + secondary actions ── */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex justify-end gap-2">
        {(isCompleted || isCancelled) && (
          <button
            onClick={onBuyAgain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-[12px] font-medium transition-colors hover:bg-gray-50"
          >
            <DynamicIcon name="ShoppingCart" size={13} />
            Buy again
          </button>
        )}
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

  const { data: currentUser, isPending } = authClient.useSession();
  const activeTab = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || "1");

  const { data: orderSummary } = useCustomerOrderSummary();

  const { data: placedOrders, isPending: isOrdersPending } = useCustomerOrders({
    status: activeTab === "all" ? undefined : activeTab,
    page: currentPage,
    limit: ITEM_PER_PAGE,
  });

  const { handlePayOrder, handleCancelOrder, handleBuyAgain } =
    useOrderActions();

  const filteredOrders = useMemo(() => {
    if (!placedOrders?.data) return [];

    if (activeTab === "all") {
      return [...placedOrders.data].sort((a, b) => {
        if (
          a.status === ORDER_STATUSES.CANCELLED &&
          b.status !== ORDER_STATUSES.CANCELLED
        )
          return 1;
        if (
          a.status !== ORDER_STATUSES.CANCELLED &&
          b.status === ORDER_STATUSES.CANCELLED
        )
          return -1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    const currentTab = TABS.find((tab) => tab.key === activeTab);
    return currentTab?.statuses
      ? placedOrders.data.filter((o) => currentTab.statuses!.includes(o.status))
      : placedOrders.data.filter((o) => o.status === activeTab);
  }, [placedOrders, activeTab]);

  // Derive tab badge counts from summary (never from the filtered list)
  const getTabCount = (tab: Tab): number | undefined => {
    if (!orderSummary) return undefined;
    if (tab.key === "all") return undefined; // "All" badge not shown
    if (tab.key === "cancelled") return undefined; // Cancelled badge not shown
    return orderSummary[tab.key as keyof OrderSummary] ?? 0;
  };

  const totalItems: number = placedOrders?.pagination?.total ?? 0;
  const totalPages: number = Math.ceil(totalItems / ITEM_PER_PAGE);

const handleTabChange = (tabKey: string, statuses?: string[]) => {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  params.delete("status");

  if (tabKey !== "all") {
    if (statuses?.length) {
      statuses.forEach((s) => params.append("status", s));
    } else {
      params.set("status", tabKey);
    }
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
  if ((isPending || isOrdersPending) && isPending) {
    return (
      <div className="relative h-screen">
        <LoadingPage />
      </div>
    );
  }

  if (!currentUser) return <GuestOrderLookup />;

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
              onClick={() => handleTabChange(tab.key, tab.statuses)}
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
        {isOrdersPending ? (
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
                onPayOrder={() => handlePayOrder(order._id)}
                onCancelOrder={() => handleCancelOrder(order._id)}
                onBuyAgain={() => handleBuyAgain(order.items)}
                onLeaveReview={() => router.push(`/orders/${order._id}/review`)}
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
