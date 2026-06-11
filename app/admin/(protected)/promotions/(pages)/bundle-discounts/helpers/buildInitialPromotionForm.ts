import { formatDateInputValue } from "@/helper/formatDateInputValue";
import {
  BUNDLE_TYPE,
  type BundleDiscountPromotionConfig,
} from "@/types/promotions/bundle-discount.type";
import { BundleDiscountPromotion, BundleDiscountPromotionForm } from "../type";

export function buildInitialPromotionForm(
  promotion: BundleDiscountPromotion | BundleDiscountPromotionConfig,
): BundleDiscountPromotionForm {
  const productIds = promotion.products
    .map((product) => ("product" in product ? String(product.product) : ""))
    .filter(Boolean);

  return {
    enabled: promotion.enabled,
    name: promotion.name,
    discountType: promotion.discountType,
    discountValue: String(promotion.discountValue),
    bundleType: promotion.bundleType ?? BUNDLE_TYPE.ANY_ITEMS,
    requiredQuantity:
      promotion.requiredQuantity === null ||
      promotion.requiredQuantity === undefined
        ? ""
        : String(promotion.requiredQuantity),
    productIds,
    productQuantities: promotion.products.reduce<Record<string, string>>(
      (quantities, product) => {
        quantities[String(product.product)] = String(product.quantity ?? 1);
        return quantities;
      },
      {},
    ),
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
