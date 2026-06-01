import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  DEFAULT_PROMO_CARD_USAGE_RULE,
  DEFAULT_PROMO_CARD_VALIDITY_RULE,
  DEFAULT_PROMO_CARD_VOUCHER_RULE,
  PROMO_CARD,
  PromoCardConfig,
} from "@/lib/promoCard";
import { PromoCardConfigModel } from "@/models/PromoCardConfig";

export async function getPromoCardConfig(): Promise<PromoCardConfig> {
  const config = await PromoCardConfigModel.findOne().lean<PromoCardConfig>();

  return {
    name: config?.name ?? PROMO_CARD.name,
    discountRate: config?.discountRate ?? PROMO_CARD.discountRate,
    purchasePrice: config?.purchasePrice ?? PROMO_CARD.purchasePrice,
    sku: config?.sku ?? PROMO_CARD.sku,
    discountRules:
      config?.discountRules?.length
        ? config.discountRules
        : DEFAULT_PROMO_CARD_DISCOUNT_RULES,
    voucherRule: config?.voucherRule ?? DEFAULT_PROMO_CARD_VOUCHER_RULE,
    validityRule: {
      ...DEFAULT_PROMO_CARD_VALIDITY_RULE,
      ...config?.validityRule,
    },
    usageRule: {
      ...DEFAULT_PROMO_CARD_USAGE_RULE,
      ...config?.usageRule,
    },
  };
}
