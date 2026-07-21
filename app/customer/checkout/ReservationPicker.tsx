"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { OrderFormState, ReservationSchema } from "./FormSchema";
import { useMemo } from "react";
import { InputField } from "@/components/ui/FormComponents";
import { IconButton } from "@/components/ui/buttons";
import { QuantityStepper } from "../menu/components/QuantityStepper";
import { formatTime } from "@/helper/formatter";
import type { Days, SettingsType } from "@/hooks/api/useSettings";

type OperatingHours = SettingsType["operatingHours"];

type ReservationPickerProps = {
  value: OrderFormState["reservation"];
  onChange: (field: string, value: string | number) => void;
  errors: Partial<Record<string, string>>;
  operatingHours: OperatingHours | null | undefined;
};

/** Maps JS Date.getDay() (Sun=0) to the DAYS labels used by operating hours (Mon=0) */
const DAY_LABELS: Days[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const getDayLabel = (date: Date): Days => DAY_LABELS[(date.getDay() + 6) % 7];

/** Returns "YYYY-MM-DD" using local time (avoids UTC timezone drift in PH) */
const getLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Parses "HH:MM" to total minutes since midnight */
const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Formats total minutes back to "HH:MM" */
const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Minimum time for today's reservations (1 hour from now, rounded to 30-min slots) */
const getMinTimeToday = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  return fromMinutes(now.getHours() * 60 + now.getMinutes());
};

/**
 * Generate time slots aligned to operating hours.
 * - Slots run from openTime to (closeTime - 1hr) in 30-min intervals.
 * - For today, past slots are filtered out (1hr minimum advance).
 * - Returns empty array if the store is closed on the selected day.
 */
const generateTimeSlots = (
  selectedDate: string,
  operatingHours: OperatingHours | null | undefined,
): string[] => {
  const openMinutes = operatingHours?.openTime
    ? toMinutes(operatingHours.openTime)
    : toMinutes("08:00");
  const closeMinutes = operatingHours?.closeTime
    ? toMinutes(operatingHours.closeTime)
    : toMinutes("22:00");

  // Last reservation must be at least 1 hour before closing
  const lastSlotMinutes = closeMinutes - 60;

  // Guard: if close - 1hr is before or at open, no valid slots
  if (lastSlotMinutes <= openMinutes) return [];

  const slots: string[] = [];
  for (let mins = openMinutes; mins <= lastSlotMinutes; mins += 30) {
    slots.push(fromMinutes(mins));
  }

  // Check if selected day is an operating day
  const date = new Date(`${selectedDate}T00:00`);
  const dayLabel = getDayLabel(date);
  const operatingDays = operatingHours?.days ?? [];
  if (!operatingDays.includes(dayLabel)) return [];

  // If the selected date is today, filter out past time slots
  const today = getLocalDate(new Date());
  if (selectedDate === today) {
    const minTime = getMinTimeToday();
    return slots.filter((slot) => slot >= minTime);
  }

  return slots;
};

export function ReservationPicker({
  value,
  onChange,
  errors,
  operatingHours,
}: ReservationPickerProps) {
  const isStoreGloballyClosed = operatingHours?.isClosed === true;

  // Derive date and time parts from the scheduledAt ISO string using local time
  const { datePart, timePart } = useMemo(() => {
    if (!value?.scheduledAt) return { datePart: "", timePart: "" };
    const dt = new Date(value.scheduledAt);
    if (isNaN(dt.getTime())) return { datePart: "", timePart: "" };
    const date = getLocalDate(dt);
    const time = fromMinutes(dt.getHours() * 60 + dt.getMinutes());
    return { datePart: date, timePart: time };
  }, [value?.scheduledAt]);

  const minDate = getLocalDate(new Date());
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return getLocalDate(d);
  }, []);

  const timeSlots = useMemo(
    () => (datePart ? generateTimeSlots(datePart, operatingHours) : []),
    [datePart, operatingHours],
  );

  // Check if the selected date falls on a closed day
  const isClosedDay = useMemo(() => {
    if (!datePart) return false;
    const date = new Date(`${datePart}T00:00`);
    const dayLabel = getDayLabel(date);
    const operatingDays = operatingHours?.days ?? [];
    return !operatingDays.includes(dayLabel);
  }, [datePart, operatingHours]);

  const handleDateChange = (date: string) => {
    // When date changes, keep time if it's still valid for the new date
    if (timePart) {
      const newSlots = generateTimeSlots(date, operatingHours);
      if (newSlots.includes(timePart)) {
        const iso = new Date(`${date}T${timePart}`).toISOString();
        onChange("scheduledAt", iso);
        return;
      }
    }
    // Clear time when date changes to force reselection
    onChange(
      "scheduledAt",
      date ? new Date(`${date}T00:00`).toISOString() : "",
    );
  };

  const handleTimeChange = (time: string) => {
    if (!datePart) return;
    const iso = new Date(`${datePart}T${time}`).toISOString();
    onChange("scheduledAt", iso);
  };

  if (isStoreGloballyClosed) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">
          Reservations unavailable
        </p>
        <p className="mt-1 text-sm text-red-700">
          The store is currently closed and not accepting reservations.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <DynamicIcon
          name="CalendarClock"
          size={16}
          className="text-brand-color-500"
        />
        <h3 className="text-sm font-semibold text-slate-900">
          Reservation Details
        </h3>
      </div>

      <p className="text-xs text-slate-400">
        Select when you&apos;d like to dine in and how many guests.
      </p>

      {/* Date picker */}
      <InputField
        label="Date"
        type="date"
        min={minDate}
        max={maxDate}
        value={datePart}
        onChange={(e) => handleDateChange(e.target.value)}
      />

      {/* Closed day warning */}
      {isClosedDay && (
        <p className="text-xs text-red-500 font-medium">
          We&apos;re closed on this day. Please select an operating day.
        </p>
      )}

      {/* Time slots */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Time
        </label>
        {datePart && isClosedDay ? (
          <p className="text-xs text-slate-400 py-2">
            Select an open day to see available times.
          </p>
        ) : datePart && timeSlots.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto hide-scrollbar">
            {timeSlots.map((slot) => {
              const isSelected = timePart === slot;
              return (
                <IconButton
                  key={slot}
                  type="button"
                  onClick={() => handleTimeChange(slot)}
                  variant={isSelected ? "primary" : "secondary"}
                  className="text-xs rounded-lg"
                  text={formatTime(slot)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">
            {datePart
              ? "No available time slots for this date."
              : "Please select a date first."}
          </p>
        )}
      </div>

      {/* Party size */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Number of Guests
        </label>

        <div className="grid grid-cols-2 items-center gap-3">
          <QuantityStepper
            value={value?.partySize ?? 1}
            min={1}
            max={20}
            onChange={(val) => onChange("partySize", val)}
          />{" "}
          <span className="text-xs text-slate-400">
            {value?.partySize === 1 ? "guest" : "guests"}
          </span>
        </div>
      </div>

      {/* Validation errors */}
      {errors.scheduledAt && (
        <p className="text-xs text-red-500">{errors.scheduledAt}</p>
      )}
      {errors.partySize && (
        <p className="text-xs text-red-500">{errors.partySize}</p>
      )}
    </div>
  );
}
