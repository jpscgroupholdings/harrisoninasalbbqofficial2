import type { Days, SettingsType } from "@/hooks/api/useSettings";

export type OperatingHours = SettingsType["operatingHours"];

/** Maps JS Date.getDay() (Sun=0) to the DAYS labels used by operating hours (Mon=0) */
const DAY_LABELS: Days[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Returns the operating-hours day label for a given Date */
export const getDayLabel = (date: Date): Days =>
  DAY_LABELS[(date.getDay() + 6) % 7];

/** Returns "YYYY-MM-DD" using local time components (avoids UTC timezone drift in PH) */
export const getLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Parses "HH:MM" to total minutes since midnight.
 * Treats "00:00" as end-of-day (1440 min) so that overnight schedules
 * where the store closes at midnight compare correctly.
 */
export const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m;
  return total === 0 ? 1440 : total;
};

/** Formats total minutes back to "HH:MM" */
export const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Returns true when the given date falls on an operating day */
export const isOperatingDay = (
  date: string,
  operatingHours: OperatingHours | null | undefined,
): boolean => {
  const d = new Date(`${date}T00:00`);
  const dayLabel = getDayLabel(d);
  return (operatingHours?.days ?? []).includes(dayLabel);
};

export type TimeSlotOptions = {
  /** Minutes before closing for the last slot (default 60) */
  closingBufferMinutes?: number;
  /** Minimum advance time from now for today's slots (default 60) */
  advanceMinutes?: number;
  /** Interval between slots in minutes (default 30) */
  intervalMinutes?: number;
};

/**
 * Generate time slots aligned to operating hours.
 * - Slots run from openTime to (closeTime - closingBuffer) in the given interval.
 * - For today, past slots are filtered out (advance minimum).
 * - Returns empty array if the store is closed on the selected day.
 */
export const generateTimeSlots = (
  selectedDate: string,
  operatingHours: OperatingHours | null | undefined,
  opts: TimeSlotOptions = {},
): string[] => {
  const {
    closingBufferMinutes = 60,
    advanceMinutes = 60,
    intervalMinutes = 30,
  } = opts;

  const openMinutes = operatingHours?.openTime
    ? toMinutes(operatingHours.openTime)
    : toMinutes("08:00");
  const closeMinutes = operatingHours?.closeTime
    ? toMinutes(operatingHours.closeTime)
    : toMinutes("22:00");

  const lastSlotMinutes = closeMinutes - closingBufferMinutes;

  if (lastSlotMinutes <= openMinutes) return [];

  const slots: string[] = [];
  for (let mins = openMinutes; mins <= lastSlotMinutes; mins += intervalMinutes) {
    slots.push(fromMinutes(mins));
  }

  if (!isOperatingDay(selectedDate, operatingHours)) return [];

  const today = getLocalDate(new Date());
  if (selectedDate === today) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + advanceMinutes, 0, 0);
    const minTime = fromMinutes(now.getHours() * 60 + now.getMinutes());
    return slots.filter((slot) => slot >= minTime);
  }

  return slots;
};

/** Minimum advance time (minutes) for pickup orders */
export const PICKUP_MIN_ADVANCE_MINUTES = 10;

/**
 * Validates a pickup time against all business rules.
 * Returns an error message string when invalid, or null when valid.
 * Handles overnight schedules (e.g. 10 AM – 2 AM) where times after midnight
 * belong to the previous day's operating window.
 */
export function validatePickupTime(
  value: string,
  operatingHours: OperatingHours | null | undefined,
): string | null {
  if (!value) return "Pickup date and time is required.";

  const dt = new Date(value);
  if (isNaN(dt.getTime())) return "Invalid pickup date.";

  const now = new Date();
  const diffMs = dt.getTime() - now.getTime();
  const diffMin = diffMs / 60_000;

  if (diffMin < PICKUP_MIN_ADVANCE_MINUTES) {
    return `Pickup time must be at least ${PICKUP_MIN_ADVANCE_MINUTES} minutes from now.`;
  }

  if (operatingHours?.isClosed) {
    return "Store is currently closed and not accepting pickup orders.";
  }

  const openTime = operatingHours?.openTime ?? "08:00";
  const closeTime = operatingHours?.closeTime ?? "22:00";
  const pickupMin = dt.getHours() * 60 + dt.getMinutes();
  const openMin = toMinutes(openTime);
  const closeMin = toMinutes(closeTime);
  const crossesMidnight = closeMin <= openMin;

  if (crossesMidnight) {
    // Overnight schedule: valid if time >= open (today is operating day)
    // OR time < close (yesterday is the operating day)
    const todayLabel = getDayLabel(dt);
    const yesterdayIndex = ((dt.getDay() + 6) % 7 + 6) % 7;
    const yesterdayLabel = DAY_LABELS[yesterdayIndex];

    const isAfterOpenToday =
      pickupMin >= openMin && (operatingHours?.days ?? []).includes(todayLabel);
    const isBeforeCloseFromYesterday =
      pickupMin < closeMin && (operatingHours?.days ?? []).includes(yesterdayLabel);

    if (!isAfterOpenToday && !isBeforeCloseFromYesterday) {
      return `Pickup time must be within operating hours (${openTime} – ${closeTime}).`;
    }
  } else {
    const dateStr = getLocalDate(dt);
    if (!isOperatingDay(dateStr, operatingHours)) {
      const dayLabel = getDayLabel(dt);
      return `Store is closed on ${dayLabel}. Please select an operating day.`;
    }

    if (pickupMin < openMin) {
      return `Pickup time must be at or after ${openTime}.`;
    }

    if (pickupMin > closeMin) {
      return `Pickup time must be at or before ${closeTime}.`;
    }
  }

  return null;
}
