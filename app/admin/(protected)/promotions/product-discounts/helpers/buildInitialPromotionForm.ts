import { formatDateInputValue } from "@/helper/formatDateInputValue";
import type { ProductDiscountPromotionConfig } from "@/types/promotions/product-discount.type";
import {
  ProductDiscountPromotion,
  ProductDiscountPromotionForm,
} from "../types";

export function buildInitialPromotionForm(
  promotion: ProductDiscountPromotion | ProductDiscountPromotionConfig,
): ProductDiscountPromotionForm {
  return {
    enabled: promotion.enabled,
    name: promotion.name,
    discountType: promotion.discountType,
    discountValue: String(promotion.discountValue),
    productIds: promotion.products.map((product) =>
      "product" in product ? String(product.product) : "",
    ).filter(Boolean),
    categoryIds: promotion.categoryIds ?? [],
    startsAt: formatDateInputValue(promotion.startsAt),
    endsAt: formatDateInputValue(promotion.endsAt),
    dayMode: promotion.dayMode,
    days: promotion.days,
    startTime: promotion.startTime,
    endTime: promotion.endTime,
    maximumRedemptions:
      promotion.maximumRedemptions === null ||
      promotion.maximumRedemptions === undefined
        ? ""
        : String(promotion.maximumRedemptions),
  };
}
