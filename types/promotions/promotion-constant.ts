export const PROMOTION_TYPES = {
  ORDER_DISCOUNT: "order_discount",
  PRODUCT_DISCOUNT: "product_discount",
} as const;

export type PromotionTypes =
  (typeof PROMOTION_TYPES)[keyof typeof PROMOTION_TYPES];

export const PROMOTION_DISCOUNT_TYPE = ["percentage", "fixed"] as const;

export const PROMOTION_DISCOUNT_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const PROMOTION_DAY_MODE = ["opening_days", "specific_days"] as const;

export type PromotionDiscountType = (typeof PROMOTION_DISCOUNT_TYPE)[number];

export type PromotionDiscountDay = (typeof PROMOTION_DISCOUNT_DAYS)[number];

export type PromotionDiscountDayMode = (typeof PROMOTION_DAY_MODE)[number];

export type PromotionRules = {
  enabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  dayMode: PromotionDiscountDayMode;
  days: PromotionDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions: number | null;
  redemptionCount: number;
};

export type PromotionDiscountConfig = {
  discountType: PromotionDiscountType;
  discountValue: number;
};

export type PromotionConfig = PromotionRules &
  PromotionDiscountConfig & {
    promotionType: PromotionTypes;
    name: string;
  };

export type PromotionPayload = Partial<
  Omit<PromotionConfig, "promotionType" | "startsAt" | "endsAt">
> & {
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
};

export type PromotionScheduleConfig = {
  dayMode: PromotionDiscountDayMode;
  days: PromotionDiscountDay[];
  startTime: string;
  endTime: string;
};

export type PromotionStatus =
  | "active"
  | "disabled"
  | "ended"
  | "redeemed_out"
  | "scheduled";

export const DEFAULT_PROMOTION_RULES: PromotionRules = {
  enabled: false,
  startsAt: null,
  endsAt: null,
  dayMode: "opening_days",
  days: [],
  startTime: "00:00",
  endTime: "23:59",
  maximumRedemptions: null,
  redemptionCount: 0,
};

export const DEFAULT_PROMOTION_DISCOUNT: PromotionDiscountConfig = {
  discountType: "percentage",
  discountValue: 10,
};

export const DEFAULT_PROMOTION_DISCOUNT_DURATION_DAYS = 180