import {
  ProductDiscountPromotionForm,
  ProductDiscountPromotionSavePayload,
} from "../types";

function parsePositiveNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function buildPromotionPayload(
  form: ProductDiscountPromotionForm,
): ProductDiscountPromotionSavePayload {
  return {
    enabled: form.enabled,
    name: form.name.trim(),
    discountType: form.discountType,
    discountValue: parsePositiveNumber(form.discountValue),
    productIds: form.productIds,
    categoryIds: form.categoryIds,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    dayMode: form.dayMode,
    days: form.dayMode === "opening_days" ? [] : form.days,
    startTime: form.startTime,
    endTime: form.endTime,
    maximumRedemptions: form.maximumRedemptions
      ? Number(form.maximumRedemptions)
      : null,
  };
}
