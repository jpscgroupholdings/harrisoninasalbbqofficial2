import type { ActivePromotion } from "@/types/promotions.type";
import { calculateOrderDiscountAmount } from "./order-promotion.calculation";

export type OrderDiscountEstimate = {
  name: string;
  discountAmount: number;
};

export type OrderDiscountEligibilityHint = {
  name: string;
  amountUntilEligible: number;
};


export function getBestOrderDiscountEstimate(
  promotions: ActivePromotion[] | undefined,
  subtotalAmount: number,
  discountableAmount: number,
): OrderDiscountEstimate | null {
  const bestPromotion = promotions
    ?.filter((promotion) => subtotalAmount >= promotion.minimumOrderAmount)
    .map((promotion) => ({
      name: promotion.name,
      discountAmount: calculateOrderDiscountAmount(
        promotion,
        discountableAmount,
      ),
    }))
    .filter((promotion) => promotion.discountAmount > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0];

  return bestPromotion ?? null;
}

export function getNextOrderDiscountEligibilityHint(
  promotions: ActivePromotion[] | undefined,
  subtotalAmount: number,
): OrderDiscountEligibilityHint | null {
  const nextPromotion = promotions
    ?.filter((promotion) => subtotalAmount < promotion.minimumOrderAmount)
    .map((promotion) => ({
      name: promotion.name,
      amountUntilEligible: Number(
        (promotion.minimumOrderAmount - subtotalAmount).toFixed(2),
      ),
    }))
    .sort((a, b) => a.amountUntilEligible - b.amountUntilEligible)[0];

  return nextPromotion ?? null;
}
