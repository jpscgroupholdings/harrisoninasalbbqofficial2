import {
  DEFAULT_PROMOTION_DISCOUNT,
  DEFAULT_PROMOTION_RULES,
  PROMOTION_TYPES,
  PromotionConfig,
} from "./promotion-constant";
import { ProductDiscountProductSnapshot } from "./product-discount.type";

export const BUNDLE_TYPE = {
  SAME_ITEMS : "same_items",
  ANY_ITEMS: "any_items",
  COMBO_ITEMS: "combo_items"
} as const;

export type BundleType = (typeof BUNDLE_TYPE)[keyof typeof BUNDLE_TYPE];

export type BundleDiscountProductSnapshot = ProductDiscountProductSnapshot & {
  quantity: number;
};

export type BundleDiscountPromotionConfig = PromotionConfig & {
  promotionType: typeof PROMOTION_TYPES.BUNDLE_DISCOUNT;
  bundleType: BundleType;
  requiredQuantity?: number | null;
  products: BundleDiscountProductSnapshot[];
  categoryIds: string[];
};

export const DEFAULT_BUNDLE_PROMOTION_DISCOUNT: BundleDiscountPromotionConfig =
  {
    ...DEFAULT_PROMOTION_RULES,
    ...DEFAULT_PROMOTION_DISCOUNT,
    promotionType: PROMOTION_TYPES.BUNDLE_DISCOUNT,
    bundleType: BUNDLE_TYPE.ANY_ITEMS,
    requiredQuantity: null,
    name: "Bundle Promotion",
    products: [],
    categoryIds: [],
  };
