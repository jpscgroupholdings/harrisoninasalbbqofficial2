import { ProductDiscountPromotion, PromotionStatus } from "../types";

export const promotionStatusStyles: Record<PromotionStatus, string> = {
  active: "bg-green-100 text-green-700",
  disabled: "bg-stone-100 text-stone-600",
  ended: "bg-red-100 text-red-700",
  redeemed_out: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
};

export const promotionStatusLabels: Record<PromotionStatus, string> = {
  active: "Active",
  disabled: "Disabled",
  ended: "Ended",
  redeemed_out: "Redeemed out",
  scheduled: "Scheduled",
};

export function getPromotionStatus(
  promotion: ProductDiscountPromotion,
): PromotionStatus {
  const now = new Date();

  if (!promotion.enabled) return "disabled";

  if (
    promotion.maximumRedemptions &&
    promotion.redemptionCount >= promotion.maximumRedemptions
  ) {
    return "redeemed_out";
  }

  if (promotion.endsAt && new Date(promotion.endsAt) < now) return "ended";
  if (new Date(promotion.startsAt) > now) return "scheduled";

  return "active";
}
