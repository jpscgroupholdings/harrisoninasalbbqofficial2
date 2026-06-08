import {
  DEFAULT_PROMOTION_DISCOUNT_DURATION_DAYS,
  PromotionDiscountDay,
  PromotionScheduleConfig,
} from "@/types/promotions/promotion-constant";
import { getStoreStatus } from "../storeStatus";

export const PROMOTION_TIME_ZONE = "Asia/Manila";
type OperatingHours = Parameters<typeof getStoreStatus>[0];

export function getPromotionDay(date = new Date()): PromotionDiscountDay {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: PROMOTION_TIME_ZONE,
  }).format(date) as PromotionDiscountDay;
}

export function getPromotionTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PROMOTION_TIME_ZONE,
  }).format(date);
}

export function isWithinPromotionTimeWindow(
  startTime: string,
  endTime: string,
  date = new Date(),
) {
  const currentTime = getPromotionTime(date);
  return currentTime >= startTime && currentTime <= endTime;
}

export function isPromotionScheduleActive(
  promotion: PromotionScheduleConfig,
  operatingHours: OperatingHours | null,
  date = new Date(),
) {
  const currentDay = getPromotionDay(date);

  if (
    promotion.dayMode === "specific_days" &&
    !promotion.days.includes(currentDay)
  ) {
    return false;
  }

  if (promotion.dayMode === "opening_days") {
    if (!operatingHours) return false;
    if (!getStoreStatus(operatingHours).isOpen) return false;
  }

  return isWithinPromotionTimeWindow(
    promotion.startTime,
    promotion.endTime,
    date,
  );
}

export function getDefaultPromotionEndDate(startsAt: Date | null) {
  if (!startsAt) return null;

  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + DEFAULT_PROMOTION_DISCOUNT_DURATION_DAYS);
  return endsAt;
}