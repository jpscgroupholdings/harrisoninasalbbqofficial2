import { Days, SettingsType } from "@/hooks/api/useSettings";

const DAYS: Days[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type StoreStatus =
  | { isOpen: true }
  | {
      isOpen: false;
      reason: "manual_close" | "day_off" | "before_hours" | "after_hours";
    };

export function getStoreStatus(
  operatingHours: SettingsType["operatingHours"],
): StoreStatus {
  if (operatingHours.isClosed) return { isOpen: false, reason: "manual_close" };

  const now = new Date();
  const todayLabel = DAYS[(now.getDay() + 6) % 7];

  if (!operatingHours.days.includes(todayLabel))
    return { isOpen: false, reason: "day_off" };

  const [openH, openM] = operatingHours.openTime.split(":").map(Number);
  const [closeH, closeM] = operatingHours.closeTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes)
    return { isOpen: false, reason: "before_hours" };
  if (currentMinutes >= closeMinutes)
    return { isOpen: false, reason: "after_hours" };

  return { isOpen: true };
}
