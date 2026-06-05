import { DEFAULT_ORDER_DISCOUNT_PROMOTION } from "@/types/promotions/order-discount.type";
import {
  OrderDiscountPromotionForm,
  OrderDiscountPromotionSavePayload,
} from "../types";

export function buildPromotionPayload(
  form: OrderDiscountPromotionForm,
): OrderDiscountPromotionSavePayload {
  return {
    enabled: form.enabled,
    name: form.name,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maximumDiscountAmount:
      form.discountType === "percentage" && form.maximumDiscountAmount
        ? Number(form.maximumDiscountAmount)
        : null,
    minimumOrderAmount: Number(
      form.minimumOrderAmount ||
        DEFAULT_ORDER_DISCOUNT_PROMOTION.minimumOrderAmount,
    ),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    dayMode: form.dayMode,
    days: form.dayMode === "specific_days" ? form.days : [],
    startTime: form.startTime,
    endTime: form.endTime,
    maximumRedemptions: form.maximumRedemptions
      ? Number(form.maximumRedemptions)
      : null,
  };
}
