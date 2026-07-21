"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { getErrorMessage } from "@/helper/getErrorMessage";
import { apiClient } from "@/lib/apiClient";
import type {
  DashboardActivity,
  LowStockItem,
  NewCustomerItem,
  PendingOrderItem,
  UpcomingReservationItem,
} from "../dashboard.types";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency, formatDate, formatTimeAgo } from "@/helper/formatter";
import { IconButton } from "@/components/ui/buttons";
import { AppImage } from "@/components/AppImage";
import { STOCK_STATUSES } from "@/types/inventory_types";

type SectionKey = "pendingOrders" | "upcomingReservations" | "lowStock" | "newCustomers";

const SECTION_CONFIG: Record<
  SectionKey,
  { icon: string; label: string; color: string }
> = {
  pendingOrders: {
    icon: "ClockAlert",
    label: "Pending Orders",
    color: "text-orange-600 bg-orange-50",
  },
  upcomingReservations: {
    icon: "CalendarDays",
    label: "Upcoming Reservations",
    color: "text-indigo-600 bg-indigo-50",
  },
  lowStock: {
    icon: "TriangleAlert",
    label: "Low Stock Alert",
    color: "text-red-600 bg-red-50",
  },
  newCustomers: {
    icon: "UserPlus",
    label: "New Customers",
    color: "text-emerald-600 bg-emerald-50",
  },
};

/* ── Expandable section wrapper ── */
function ActivitySection({
  sectionKey,
  children,
}: {
  sectionKey: SectionKey;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = SECTION_CONFIG[sectionKey];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Header — clickable to toggle */}
      <IconButton
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full"
        children={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}
              >
                <DynamicIcon name={config.icon} size={16} />
              </div>
              <span className="text-sm font-semibold text-stone-800">
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DynamicIcon
                name={expanded ? "ChevronUp" : "ChevronDown"}
                size={16}
                className="text-stone-400"
              />
            </div>
          </div>
        }
      />

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-50">{children}</div>
      )}
    </div>
  );
}

/* ── Pending order row ── */
function PendingOrderRow({ order }: { order: PendingOrderItem }) {
  return (
    <Link
      href={`/orders/${order._id}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-brand-color-500">
          {order.customerName || "Guest"}
        </p>
        <p className="text-xs text-stone-400">
          {order.itemsCount} item(s) · {order.fulfillmentType}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-stone-800">
          {formatCurrency(order.totalAmount)}
        </p>
        <p className="text-xs text-stone-400">
          {formatTimeAgo(order.createdAt)}
        </p>
      </div>
      <DynamicIcon
        name="ChevronRight"
        size={14}
        className="text-stone-300 group-hover:text-brand-color-500 transition-colors"
      />
    </Link>
  );
}

/* ── Reservation row ── */
function ReservationRow({
  reservation,
}: {
  reservation: UpcomingReservationItem;
}) {
  return (
    <Link
      href={`/orders/${reservation._id}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <DynamicIcon name="CalendarDays" size={14} className="text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-brand-color-500">
          {reservation.customerName || "Guest"}
        </p>
        <p className="text-xs text-stone-400">
          {reservation.partySize} {reservation.partySize === 1 ? "guest" : "guests"} · {formatCurrency(reservation.totalAmount)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-indigo-700">
          {formatDate(reservation.scheduledAt, "TBD")}
        </p>
      </div>
      <DynamicIcon
        name="ChevronRight"
        size={14}
        className="text-stone-300 group-hover:text-brand-color-500 transition-colors"
      />
    </Link>
  );
}

/* ── Low stock item row ── */
function LowStockRow({ item }: { item: LowStockItem }) {
  const isOutOfStock = item.status === STOCK_STATUSES.OUT_OF_STOCK;

  return (
    <Link
      href={`/inventories`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
    >
      {item.image ? (
        <div className="w-8 h-8 rounded-lg">
          <AppImage src={item.image} alt={item.name} className="object-cover" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
          <DynamicIcon name="Package" size={14} className="text-stone-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-brand-color-500">
          {item.name}
        </p>
        <p className="text-xs text-stone-400">
          Available: {item.available} / Stock: {item.quantity}
        </p>
      </div>

      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isOutOfStock
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {isOutOfStock ? "Out" : "Low"}
      </span>

      <DynamicIcon
        name="ChevronRight"
        size={14}
        className="text-stone-300 group-hover:text-brand-color-500 transition-colors"
      />
    </Link>
  );
}

/* ── New customer row with animated pulse ── */
function NewCustomerRow({
  customer,
  isLatest,
}: {
  customer: NewCustomerItem;
  isLatest: boolean;
}) {
  return (
    <Link
      href={`/customers`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <DynamicIcon name="User" size={14} className="text-emerald-600" />
        </div>
        {isLatest && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-brand-color-500">
          {customer.name}
        </p>
        <p className="text-xs text-stone-400">{customer.email}</p>
      </div>

      <p className="text-xs text-stone-400">
        {formatTimeAgo(customer.createdAt)}
      </p>

      <DynamicIcon
        name="ChevronRight"
        size={14}
        className="text-stone-300 group-hover:text-brand-color-500 transition-colors"
      />
    </Link>
  );
}

/* ── Main aside component ── */
export default function DashboardActivityAside() {
  const { selectedBranchId } = useAdminBranchContext();

  const query = useQuery({
    queryKey: ["admin-dashboard-activity", selectedBranchId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBranchId !== "all") {
        params.set("branchId", selectedBranchId);
      }
      return apiClient.get<DashboardActivity>(
        `/admin/dashboard/activity?${params.toString()}`,
      );
    },
    refetchInterval: 30000, // auto-refresh every 30s for near-real-time feel
  });

  const activity = query.data;
  const errorMessage = query.isError ? getErrorMessage(query.error) : null;

  const renderEmptyState = (icon: string, text: string) => (
    <div className="flex flex-col items-center py-4 text-center">
      <DynamicIcon name={icon} size={20} className="text-stone-300 mb-2" />
      <p className="text-xs text-stone-400">{text}</p>
    </div>
  );

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 animate-pulse" />
              <div className="h-4 w-24 bg-stone-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 text-sm text-red-700 border border-red-200">
        {errorMessage}
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Pending Orders ── */}
      <ActivitySection sectionKey="pendingOrders">
        {activity.pendingOrders.length > 0
          ? activity.pendingOrders.map((order) => (
              <PendingOrderRow key={order._id} order={order} />
            ))
          : renderEmptyState("CheckCircle", "No pending orders right now")}
      </ActivitySection>

      {/* ── Upcoming Reservations ── */}
      <ActivitySection sectionKey="upcomingReservations">
        {activity.upcomingReservations.length > 0
          ? activity.upcomingReservations.map((reservation) => (
              <ReservationRow
                key={reservation._id}
                reservation={reservation}
              />
            ))
          : renderEmptyState("CalendarDays", "No upcoming reservations")}
      </ActivitySection>

      {/* ── Low Stock Alert ── */}
      <ActivitySection sectionKey="lowStock">
        {activity.lowStockItems.length > 0
          ? activity.lowStockItems.map((item) => (
              <LowStockRow key={item.productId} item={item} />
            ))
          : renderEmptyState("ShieldCheck", "All items are well stocked")}
      </ActivitySection>

      {/* ── New Customers ── */}
      <ActivitySection sectionKey="newCustomers">
        {activity.newCustomers.length > 0
          ? activity.newCustomers.map((customer, idx) => (
              <NewCustomerRow
                key={customer._id}
                customer={customer}
                isLatest={idx === 0}
              />
            ))
          : renderEmptyState("Users", "No new sign-ups this week")}
        {activity.newCustomersCount > 5 && (
          <Link
            href="/customers"
            className="block text-center text-xs text-brand-color-500 font-medium mt-2 hover:underline"
          >
            +{activity.newCustomersCount - 5} more this week
          </Link>
        )}
      </ActivitySection>
    </div>
  );
}
