"use client";

import React, { useState, useMemo } from "react";
import { useAdminOrders } from "@/hooks/api/admin/useAdminOrders";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { formatCurrency, formatDate } from "@/helper/formatter";
import Link from "next/link";
import { useBranchName } from "../../hooks/useBranchName";
import { IconButton } from "@/components/ui/buttons";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ViewMode = "calendar" | "list";

/** Build a calendar grid for a given month (0-indexed) and year */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // Mon=0 ... Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

/** Format "YYYY-MM-DD" from year, month (0-indexed), day */
function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const ReservationsPage = () => {
  const { selectedBranchId } = useAdminBranchContext();
  const { branchName } = useBranchName();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrders({
    status: ORDER_STATUSES.CONFIRMED,
    limit: 100,
    branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
  });

  const orders = data?.data ?? [];

  // Group reservations by date key
  const reservationsByDate = useMemo(() => {
    const map: Record<string, typeof orders> = {};
    for (const order of orders) {
      const dt = new Date(order.reservation?.scheduledAt ?? "");
      if (isNaN(dt.getTime())) continue;
      const key = toDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(order);
    }
    return map;
  }, [orders]);

  const calendarGrid = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Filtered reservations for list view
  const displayReservations = selectedDay
    ? (reservationsByDate[selectedDay] ?? [])
    : orders;

  // Reservations in months OTHER than the currently displayed month
  const otherMonthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      const dt = new Date(order.reservation?.scheduledAt ?? "");
      if (isNaN(dt.getTime())) continue;
      if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonth)
        continue;
      const label = `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [orders, currentMonth, currentYear]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">
            Reservations — {branchName}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage dine-in reservations and upcoming bookings
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 text-xs font-semibold transition-colors ${
              viewMode === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <DynamicIcon name="CalendarDays" size={14} />
              Calendar
            </div>
          </button>
          <button
            onClick={() => {
              setViewMode("list");
              setSelectedDay(null);
            }}
            className={`px-4 py-2 text-xs font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <DynamicIcon name="List" size={14} />
              List
            </div>
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <DynamicIcon name="ChevronLeft" size={18} />
            </button>
            <h2 className="text-base font-bold text-stone-800">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <DynamicIcon name="ChevronRight" size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-stone-100">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-semibold text-stone-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={idx}
                    className="h-20 border-b border-r border-stone-50"
                  />
                );
              }

              const dateKey = toDateKey(currentYear, currentMonth, day);
              const dayReservations = reservationsByDate[dateKey] ?? [];
              const hasReservations = dayReservations.length > 0;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDay;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                  className={`h-20 border-b border-r border-stone-50 p-1.5 text-left transition-colors relative
                    ${isSelected ? "bg-indigo-50" : "hover:bg-stone-50"}
                    ${isToday ? "bg-indigo-50/50" : ""}
                  `}
                >
                  <span
                    className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full
                      ${isToday ? "bg-indigo-600 text-white" : "text-stone-600"}
                    `}
                  >
                    {day}
                  </span>
                  {hasReservations && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                        {dayReservations.length}
                      </span>
                      <span className="text-[10px] text-indigo-600 truncate hidden sm:inline">
                        {dayReservations.length}{" "}
                        {dayReservations.length === 1 ? "res" : "reservations"}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Other month hints */}
          {otherMonthCounts.length > 0 && (
            <div className="px-6 py-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
              {otherMonthCounts.map(([label, count]) => (
                <IconButton
                  key={label}
                  onClick={() => {
                    const [monthName, yearStr] = label.split(" ");
                    const monthIndex = MONTHS.indexOf(monthName);
                    if (monthIndex >= 0) {
                      setCurrentMonth(monthIndex);
                      setCurrentYear(Number(yearStr));
                      setSelectedDay(null);
                    }
                  }}
                  variant="primary"
                  icon={{ name: "CalendarDays", size: 12 }}
                  text={`${count} ${count === 1 ? "reservation" : "reservations"} in ${label}`}
                  className="px-4 bg-indigo-500 hover:bg-indigo-600"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reservation list (shown below calendar when day is selected, or in list view) */}
      {(viewMode === "list" || selectedDay) && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-800">
              {selectedDay
                ? `Reservations for ${formatDate(selectedDay + "T00:00:00")}`
                : "All Upcoming Reservations"}
            </h3>
            <span className="text-xs text-stone-400">
              {displayReservations.length} reservation
              {displayReservations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-stone-400">
              Loading...
            </div>
          ) : displayReservations.length > 0 ? (
            <div className="divide-y divide-stone-50">
              {displayReservations.map((order) => (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <DynamicIcon
                      name="CalendarDays"
                      size={18}
                      className="text-indigo-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 group-hover:text-brand-color-500 truncate">
                      {order.paymentInfo?.firstName}{" "}
                      {order.paymentInfo?.lastName}
                    </p>
                    <p className="text-xs text-stone-400">
                      {formatDate(order.reservation?.scheduledAt ?? "", "TBD")}
                      {" · "}
                      {order.reservation?.partySize ?? "?"} guest
                      {(order.reservation?.partySize ?? 1) !== 1 ? "s" : ""}
                      {" · "}
                      {order.branchSnapshot?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-stone-800">
                      {formatCurrency(order.total.totalAmount)}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      #{order.paymentInfo?.referenceNumber}
                    </p>
                  </div>
                  <DynamicIcon
                    name="ChevronRight"
                    size={16}
                    className="text-stone-300 group-hover:text-brand-color-500"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <DynamicIcon
                name="CalendarDays"
                size={32}
                className="mx-auto text-stone-200 mb-2"
              />
              <p className="text-sm text-stone-400">
                {selectedDay
                  ? "No reservations on this day"
                  : "No upcoming reservations"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
