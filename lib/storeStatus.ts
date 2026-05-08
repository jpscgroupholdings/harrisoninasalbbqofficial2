import { formatTime } from "@/helper/formatTime";
import { Days, SettingsType } from "@/hooks/api/useSettings";

const DAYS: Days[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type StoreStatus =
  | { isOpen: true }
  | {
      isOpen: false;
      message: string;
    };

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes;
  return total === 0 ? 1440 : total; // treat 00:00 as end of day
}

function getNowInTimeZone(tz: string): Date{
  const now = new Date();
  const localStr = now.toLocaleString("en-US", {timeZone: tz});
  return new Date(localStr);
};

export function getStoreStatus(
  operatingHours: SettingsType["operatingHours"],
): StoreStatus {
  if (!operatingHours) {
    return {
      isOpen: false,
      message: "Store hours not available right now.",
    };
  }

  const { isClosed, days = [], openTime, closeTime } = operatingHours;

  if (isClosed) {
    return {
      isOpen: false,
      message: "We are currently not accepting orders at the moment.",
    };
  }

  if (!openTime || !closeTime) {
    return {
      isOpen: false,
      message: "Store hours are not properly configured.",
    };
  }

  const now = getNowInTimeZone("Asia/Manila");
  const todayIndex = (now.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const yesterdayIndex = (todayIndex + 6) % 7;

  const todayLabel = DAYS[todayIndex];
  const yesterdayLabel = DAYS[yesterdayIndex];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);

  const crossesMidnight = closeMinutes <= openMinutes;

  const hoursMessage = `We are currently closed. Ordering hours are from ${formatTime(openTime)} - ${formatTime(closeTime)}.`;

  if (!crossesMidnight) {
    const isOpenToday =
      days.includes(todayLabel) &&
      currentMinutes >= openMinutes &&
      currentMinutes < closeMinutes;

    if (!isOpenToday) {
      if (!days.includes(todayLabel)) {
        return {
          isOpen: false,
          message:
            "Closed Today. We are closed today and not accepting orders at the moment.",
        };
      }

      return {
        isOpen: false,
        message: hoursMessage,
      };
    }

    return { isOpen: true };
  }

  // Overnight schedule, e.g. 10:00 PM to 2:00 AM
  const isOpenFromTodaySchedule =
    days.includes(todayLabel) && currentMinutes >= openMinutes;

  const isOpenFromYesterdaySchedule =
    days.includes(yesterdayLabel) && currentMinutes < closeMinutes;

  if (isOpenFromTodaySchedule || isOpenFromYesterdaySchedule) {
    return { isOpen: true };
  }

  // Optional: better message when current day is not in schedule and also not in spillover
  if (
    !days.includes(todayLabel) &&
    !(days.includes(yesterdayLabel) && currentMinutes < closeMinutes)
  ) {
    return {
      isOpen: false,
      message:
        "Closed Today. We are closed today and not accepting orders at the moment.",
    };
  }

  console.log({
    days,
    todayLabel,
    openTime,
    closeTime,
    currentMinutes,
    openMinutes,
    closeMinutes,
    crossesMidnight,
  });

  console.log({ todayLabel, days, includes: days.includes(todayLabel) });

  return {
    isOpen: false,
    message: hoursMessage,
  };
}
