import { BUNDLE_TYPE } from "@/types/promotions/bundle-discount.type";
import {
  BundleDiscountPromotionForm,
  BundleDiscountPromotionSavePayload,
} from "../type";

function parsePositiveNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parsePositiveInteger(value: string) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

export function buildPromotionPayload(
  form: BundleDiscountPromotionForm,
): BundleDiscountPromotionSavePayload {
  const productQuantities =
    form.bundleType === BUNDLE_TYPE.COMBO_ITEMS
      ? form.productIds.reduce<Record<string, number>>((quantities, productId) => {
          quantities[productId] =
            parsePositiveInteger(form.productQuantities[productId]) || 1;
          return quantities;
        }, {})
      : {};
  const productIds =
    form.bundleType === BUNDLE_TYPE.SAME_ITEMS
      ? form.productIds.slice(0, 1)
      : form.productIds;

  return {
    enabled: form.enabled,
    name: form.name.trim(),
    discountType: form.discountType,
    discountValue: parsePositiveNumber(form.discountValue),
    bundleType: form.bundleType,
    requiredQuantity:
      form.bundleType === BUNDLE_TYPE.COMBO_ITEMS
        ? null
        : parsePositiveInteger(form.requiredQuantity),
    productIds,
    productQuantities,
    categoryIds:
      form.bundleType === BUNDLE_TYPE.SAME_ITEMS ? [] : form.categoryIds,
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
