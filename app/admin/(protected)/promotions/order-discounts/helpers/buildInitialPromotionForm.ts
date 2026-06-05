import { formatDateInputValue } from "@/helper/formatDateInputValue";
import type { OrderDiscountPromotionConfig } from "@/types/promotions/order-discount.type";
import {
  OrderDiscountPromotion,
  OrderDiscountPromotionForm,
} from "../types";

export function buildInitialPromotionForm(
  promotion: OrderDiscountPromotion | OrderDiscountPromotionConfig,
): OrderDiscountPromotionForm {
  return {
    enabled: promotion.enabled,
    name: promotion.name,
    discountType: promotion.discountType,
    discountValue: String(promotion.discountValue),
    maximumDiscountAmount:
      promotion.maximumDiscountAmount === null ||
      promotion.maximumDiscountAmount === undefined
        ? ""
        : String(promotion.maximumDiscountAmount),
    minimumOrderAmount: String(promotion.minimumOrderAmount),
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
