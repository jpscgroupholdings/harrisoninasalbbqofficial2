import {
  DEFAULT_ORDER_DISCOUNT_PROMOTION,
  ORDER_DISCOUNT_DAY_MODES,
  ORDER_DISCOUNT_DAYS,
  ORDER_DISCOUNT_TYPES,
  OrderDiscountDay,
  OrderDiscountDayMode,
  OrderDiscountPromotionConfig,
  OrderDiscountType,
} from "@/types/order-discount.type";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type OrderDiscountPromotionPayload = {
  enabled?: boolean;
  name?: string;
  discountType?: OrderDiscountType;
  discountValue?: number;
  maximumDiscountAmount?: number | null;
  minimumOrderAmount?: number;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  dayMode?: OrderDiscountDayMode;
  days?: OrderDiscountDay[];
  startTime?: string;
  endTime?: string;
  maximumRedemptions?: number | null;
};

function parseOptionalDate(value: string | Date | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : NaN;
}

export function normalizeOrderDiscountPromotionPayload(
  body: OrderDiscountPromotionPayload,
  redemptionCount = 0,
): OrderDiscountPromotionConfig {
  const name = body.name?.trim() || DEFAULT_ORDER_DISCOUNT_PROMOTION.name;
  const discountType =
    body.discountType ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.discountType;
  const discountValue = normalizeAmount(
    body.discountValue ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.discountValue,
  );
  const maximumDiscountAmount =
    body.maximumDiscountAmount === null ||
    body.maximumDiscountAmount === undefined ||
    body.maximumDiscountAmount === 0
      ? null
      : normalizeAmount(body.maximumDiscountAmount);
  const minimumOrderAmount = normalizeAmount(
    body.minimumOrderAmount ??
      DEFAULT_ORDER_DISCOUNT_PROMOTION.minimumOrderAmount,
  );
  const startsAt = parseOptionalDate(body.startsAt);
  const endsAt = parseOptionalDate(body.endsAt);
  const dayMode = body.dayMode ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.dayMode;
  const days = Array.isArray(body.days) ? body.days : [];
  const startTime =
    body.startTime ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.startTime;
  const endTime = body.endTime ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.endTime;
  const maximumRedemptions =
    body.maximumRedemptions === null ||
    body.maximumRedemptions === undefined ||
    body.maximumRedemptions === 0
      ? null
      : Number(body.maximumRedemptions);

  return {
    promotionType: "order_discount",
    enabled: Boolean(body.enabled),
    name,
    discountType,
    discountValue,
    maximumDiscountAmount:
      discountType === "percentage" ? maximumDiscountAmount : null,
    minimumOrderAmount,
    startsAt,
    endsAt,
    dayMode,
    days: dayMode === "opening_days" ? [] : days,
    startTime,
    endTime,
    maximumRedemptions,
    redemptionCount,
  };
}

export function validateOrderDiscountPromotionConfig(
  config: OrderDiscountPromotionConfig,
) {
  if (!config.name) return "Promotion name is required.";

  if (!ORDER_DISCOUNT_TYPES.includes(config.discountType)) {
    return "Choose a valid discount type.";
  }

  if (!Number.isFinite(config.discountValue) || config.discountValue <= 0) {
    return "Discount value must be greater than 0.";
  }

  if (
    config.discountType === "percentage" &&
    (config.discountValue <= 0 || config.discountValue > 100)
  ) {
    return "Percentage discount must be between 1 and 100.";
  }

  if (
    config.discountType === "percentage" &&
    config.maximumDiscountAmount !== null &&
    (!Number.isFinite(config.maximumDiscountAmount) ||
      config.maximumDiscountAmount <= 0)
  ) {
    return "Maximum discount amount must be greater than 0.";
  }

  if (
    !Number.isFinite(config.minimumOrderAmount) ||
    config.minimumOrderAmount < 0
  ) {
    return "Minimum order amount cannot be negative.";
  }

  if (!config.startsAt) {
    return "Promotion start date is required.";
  }

  if (config.endsAt && config.endsAt <= config.startsAt) {
    return "Promotion end date must be after the start date.";
  }

  if (!ORDER_DISCOUNT_DAY_MODES.includes(config.dayMode)) {
    return "Choose a valid day schedule.";
  }

  if (
    config.dayMode === "specific_days" &&
    (config.days.length === 0 ||
      config.days.some((day) => !ORDER_DISCOUNT_DAYS.includes(day)))
  ) {
    return "Choose at least one valid promotion day.";
  }

  if (!TIME_PATTERN.test(config.startTime) || !TIME_PATTERN.test(config.endTime)) {
    return "Promotion time must use HH:mm format.";
  }

  if (config.endTime <= config.startTime) {
    return "Promotion end time must be after the start time.";
  }

  if (
    config.maximumRedemptions !== null &&
    (!Number.isInteger(config.maximumRedemptions) ||
      config.maximumRedemptions < 1)
  ) {
    return "Maximum redemption must be a positive whole number.";
  }

  return null;
}
