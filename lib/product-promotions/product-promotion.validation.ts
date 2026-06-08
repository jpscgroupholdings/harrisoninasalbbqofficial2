import {
  DEFAULT_PRODUCT_DISCOUNT_PROMOTION,
  type ProductDiscountPromotionConfig,
  type ProductDiscountProductSnapshot,
} from "@/types/promotions/product-discount.type";
import {
  normalizeMaximumRedemptions,
  normalizePromotionAmount,
  parseOptionalPromotionDate,
  validatePromotionBaseConfig,
} from "@/lib/promotions/promotion.validation";
import {
  PROMOTION_TYPES,
  type PromotionPayload,
} from "@/types/promotions/promotion-constant";
import mongoose from "mongoose";
import { getDefaultPromotionEndDate } from "../promotions/promotions.service";

export type ProductDiscountPromotionPayload = PromotionPayload & {
  productIds?: string[];
  categoryIds?: string[];
};

export function normalizeProductDiscountPromotionPayload(
  body: ProductDiscountPromotionPayload,
  products: ProductDiscountProductSnapshot[],
  redemptionCount = 0,
): ProductDiscountPromotionConfig {
  const name = body.name?.trim() || DEFAULT_PRODUCT_DISCOUNT_PROMOTION.name;
  const discountType =
    body.discountType ?? DEFAULT_PRODUCT_DISCOUNT_PROMOTION.discountType;
  const discountValue = normalizePromotionAmount(
    body.discountValue ?? DEFAULT_PRODUCT_DISCOUNT_PROMOTION.discountValue,
  );
  const startsAt = parseOptionalPromotionDate(body.startsAt);
  const endsAt =
    parseOptionalPromotionDate(body.endsAt) ?? getDefaultPromotionEndDate(startsAt);
  const dayMode = body.dayMode ?? DEFAULT_PRODUCT_DISCOUNT_PROMOTION.dayMode;
  const days = Array.isArray(body.days) ? body.days : [];
  const startTime =
    body.startTime ?? DEFAULT_PRODUCT_DISCOUNT_PROMOTION.startTime;
  const endTime = body.endTime ?? DEFAULT_PRODUCT_DISCOUNT_PROMOTION.endTime;
  const maximumRedemptions = normalizeMaximumRedemptions(
    body.maximumRedemptions,
  );
  const categoryIds = Array.isArray(body.categoryIds)
    ? [...new Set(body.categoryIds)].filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      )
    : [];

  return {
    promotionType: PROMOTION_TYPES.PRODUCT_DISCOUNT,
    enabled: Boolean(body.enabled),
    name,
    discountType,
    discountValue,
    products,
    categoryIds,
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

export function validateProductDiscountPromotionConfig(
  config: ProductDiscountPromotionConfig,
) {
  const baseValidationError = validatePromotionBaseConfig(config);
  if (baseValidationError) return baseValidationError;

  if (config.products.length === 0) {
    return "Choose at least one product.";
  }

  return null;
}