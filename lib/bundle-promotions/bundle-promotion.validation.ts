import {
  BUNDLE_TYPE,
  DEFAULT_BUNDLE_PROMOTION_DISCOUNT,
  type BundleDiscountProductSnapshot,
  type BundleDiscountPromotionConfig,
  type BundleType,
} from "@/types/promotions/bundle-discount.type";
import {
  normalizedPromotionBasePayload,
  validatePromotionBaseConfig,
} from "@/lib/promotions/promotion.validation";
import {
  PROMOTION_TYPES,
  type PromotionPayload,
} from "@/types/promotions/promotion-constant";
import mongoose from "mongoose";

export type BundleDiscountPromotionPayload = PromotionPayload & {
  bundleType?: BundleType;
  requiredQuantity?: number | null;
  productIds?: string[];
  productQuantities?: Record<string, number>;
  categoryIds?: string[];
};

function normalizeRequiredQuantity(value: unknown) {
  const quantity = Number(value);
  return Number.isInteger(quantity) ? quantity : null;
}

export function normalizeBundleDiscountPromotionPayload(
  body: BundleDiscountPromotionPayload,
  products: BundleDiscountProductSnapshot[],
  redemptionCount = 0,
): BundleDiscountPromotionConfig {
  const centralizedPromotionPayload = normalizedPromotionBasePayload(
    body,
    DEFAULT_BUNDLE_PROMOTION_DISCOUNT,
  );
  const bundleType = Object.values(BUNDLE_TYPE).includes(
    body.bundleType as BundleType,
  )
    ? (body.bundleType as BundleType)
    : DEFAULT_BUNDLE_PROMOTION_DISCOUNT.bundleType;
  const categoryIds =
    bundleType === BUNDLE_TYPE.SAME_ITEMS
      ? []
      : Array.isArray(body.categoryIds)
        ? [...new Set(body.categoryIds)].filter((id) =>
            mongoose.Types.ObjectId.isValid(id),
          )
        : [];

  return {
    ...centralizedPromotionPayload,
    promotionType: PROMOTION_TYPES.BUNDLE_DISCOUNT,
    bundleType,
    requiredQuantity:
      bundleType === BUNDLE_TYPE.COMBO_ITEMS
        ? null
        : normalizeRequiredQuantity(body.requiredQuantity),
    products,
    categoryIds,
    redemptionCount,
  };
}

export function validateBundleDiscountPromotionConfig(
  config: BundleDiscountPromotionConfig,
) {
  const baseValidationError = validatePromotionBaseConfig(config);
  if (baseValidationError) return baseValidationError;

  if (config.products.length === 0) {
    return "Choose at least one product.";
  }

  if (config.bundleType === BUNDLE_TYPE.SAME_ITEMS && config.products.length !== 1) {
    return "Same-item bundle discounts must target exactly one product.";
  }

  if (config.bundleType !== BUNDLE_TYPE.COMBO_ITEMS) {
    if (
      config.requiredQuantity === null ||
      config.requiredQuantity === undefined ||
      !Number.isInteger(config.requiredQuantity) ||
      config.requiredQuantity < 2
    ) {
      return "Required quantity must be at least 2.";
    }

    return null;
  }

  const totalComboQuantity = config.products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  if (config.products.some((product) => product.quantity < 1)) {
    return "Combo product quantities must be at least 1.";
  }

  if (totalComboQuantity < 2) {
    return "A combo bundle needs at least 2 total items.";
  }

  return null;
}
