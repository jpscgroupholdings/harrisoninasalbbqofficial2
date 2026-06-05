import { DEFAULT_PRODUCT_DISCOUNT_PROMOTION } from "@/types/promotions/product-discount.type";

export function getCreateDefaultPromotion() {
  return {
    ...DEFAULT_PRODUCT_DISCOUNT_PROMOTION,
    startsAt: new Date(),
  };
}
