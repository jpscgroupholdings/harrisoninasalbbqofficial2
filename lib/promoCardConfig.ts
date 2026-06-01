import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  DEFAULT_PROMO_CARD_VALIDITY_RULE,
  DEFAULT_PROMO_CARD_VOUCHER_RULE,
  PROMO_CARD,
  PromoCardConfig,
} from "@/lib/promoCard";
import { PromoCardConfigModel } from "@/models/PromoCardConfig";

export async function getPromoCardConfig(): Promise<PromoCardConfig> {
  const config =
    await PromoCardConfigModel.findOne().lean<PromoCardConfig>();

  return {
    name: config?.name ?? PROMO_CARD.name,
    discountRate: config?.discountRate ?? PROMO_CARD.discountRate,
    purchasePrice: config?.purchasePrice ?? PROMO_CARD.purchasePrice,
    sku: config?.sku ?? PROMO_CARD.sku,
    discountRules:
      config?.discountRules?.length
        ? config.discountRules
        : DEFAULT_PROMO_CARD_DISCOUNT_RULES,
    voucherRule: {
      ...DEFAULT_PROMO_CARD_VOUCHER_RULE,
      ...config?.voucherRule,
      usageRule: {
        ...DEFAULT_PROMO_CARD_VOUCHER_RULE.usageRule,
        ...config?.voucherRule?.usageRule,
      },
    },
    validityRule: {
      ...DEFAULT_PROMO_CARD_VALIDITY_RULE,
      ...config?.validityRule,
    },
  };
}
