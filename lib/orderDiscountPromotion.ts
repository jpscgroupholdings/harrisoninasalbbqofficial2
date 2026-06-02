export type OrderDiscountType = "percentage" | "fixed";

export type OrderDiscountDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type OrderDiscountDayMode = "opening_days" | "specific_days";

export type OrderDiscountPromotionConfig = {
  enabled: boolean;
  name: string;
  discountType: OrderDiscountType;
  discountValue: number;
  maximumDiscountAmount: number | null;
  minimumOrderAmount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  dayMode: OrderDiscountDayMode;
  days: OrderDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions: number | null;
  redemptionCount: number;
};

export const ORDER_DISCOUNT_TYPES: OrderDiscountType[] = [
  "percentage",
  "fixed",
];

export const ORDER_DISCOUNT_DAYS: OrderDiscountDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const ORDER_DISCOUNT_DAY_MODES: OrderDiscountDayMode[] = [
  "opening_days",
  "specific_days",
];

export const DEFAULT_ORDER_DISCOUNT_PROMOTION: OrderDiscountPromotionConfig = {
  enabled: false,
  name: "Whole Order Discount",
  discountType: "percentage",
  discountValue: 10,
  maximumDiscountAmount: null,
  minimumOrderAmount: 0,
  startsAt: new Date(),
  endsAt: null,
  dayMode: "opening_days",
  days: [],
  startTime: "00:00",
  endTime: "23:59",
  maximumRedemptions: null,
  redemptionCount: 0,
};
