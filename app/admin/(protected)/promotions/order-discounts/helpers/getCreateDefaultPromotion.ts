import {
  DEFAULT_ORDER_DISCOUNT_PROMOTION,
  OrderDiscountPromotionConfig,
} from "@/types/promotions/order-discount.type";

export function getCreateDefaultPromotion(): OrderDiscountPromotionConfig {
  return {
    ...DEFAULT_ORDER_DISCOUNT_PROMOTION,
    startsAt: new Date(),
  };
}
