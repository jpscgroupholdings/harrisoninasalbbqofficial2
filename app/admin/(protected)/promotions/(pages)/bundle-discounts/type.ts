import { PROMOTION_TYPES } from "@/types/promotions/promotion-constant";
import {
  AdminPromotionBase,
  AdminPromotionForm,
  AdminPromotionSavePayload,
  ProductSnapshot,
} from "../../types/discount-promotion.type";
import type { BundleType } from "@/types/promotions/bundle-discount.type";

export type BundleDiscountPromotion = AdminPromotionBase & {
  bundleType: BundleType;
  promotionType: typeof PROMOTION_TYPES.BUNDLE_DISCOUNT;
  products: (ProductSnapshot & { quantity: number })[];
  requiredQuantity?: number | null;
};

export type BundleDiscountPromotionsResponse = {
  data: BundleDiscountPromotion[];
};

export type BundleDiscountPromotionMutationResponse = {
  promotion: BundleDiscountPromotion;
};

export type BundleDiscountPromotionForm = AdminPromotionForm & {
  bundleType: BundleType;
  requiredQuantity: string;
  productQuantities: Record<string, string>;
};

export type BundleDiscountPromotionSavePayload = AdminPromotionSavePayload & {
  bundleType: BundleType;
  requiredQuantity: number | null;
  productQuantities: Record<string, number>;
};
