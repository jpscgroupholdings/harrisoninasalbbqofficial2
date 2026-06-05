import { formatCurrency } from "@/helper/formatCurrency";
import { ProductDiscountPromotion } from "../types";

export function getDiscountLabel(promotion: ProductDiscountPromotion) {
  if (promotion.discountType === "fixed") {
    return `${formatCurrency(promotion.discountValue)} off`;
  }

  return `${promotion.discountValue}% off`;
}
