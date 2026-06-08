import {
  DEFAULT_PROMOTION_DISCOUNT,
  DEFAULT_PROMOTION_RULES,
  PROMOTION_TYPES,
  type PromotionConfig,
} from "./promotion-constant";

export type ProductDiscountProductSnapshot = {
  product: string;
  name: string;
  price: number | null;
  imageUrl: string;
  category: string | null;
};

export type ProductDiscountPromotionConfig = PromotionConfig & {
  promotionType: typeof PROMOTION_TYPES.PRODUCT_DISCOUNT;
  products: ProductDiscountProductSnapshot[];
  categoryIds: string[];
};

export const DEFAULT_PRODUCT_DISCOUNT_PROMOTION: ProductDiscountPromotionConfig =
  {
    ...DEFAULT_PROMOTION_RULES,
    ...DEFAULT_PROMOTION_DISCOUNT,
    promotionType: PROMOTION_TYPES.PRODUCT_DISCOUNT,
    name: "Product Discount",
    products: [],
    categoryIds: [],
  };
