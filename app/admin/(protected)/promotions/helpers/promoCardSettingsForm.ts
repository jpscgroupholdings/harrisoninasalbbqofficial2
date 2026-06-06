import { formatDateInputValue } from "@/helper/formatDateInputValue";
import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  DEFAULT_PROMO_CARD_VALIDITY_RULE,
  DEFAULT_PROMO_CARD_VOUCHER_RULE,
  PROMO_CARD,
} from "@/lib/promoCard";
import {
  DEFAULT_VOUCHER_USAGE_RULE,
  DEFAULT_VOUCHER_VALIDITY_RULE,
} from "@/types/voucher.types";
import {
  PromoCardSettings,
  PromoCardSettingsForm,
  PromoCardSettingsPayload,
} from "../types/promo-card.type";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";

export function getDefaultPromoCardSettingsForm(): PromoCardSettingsForm {
  return {
    name: PROMO_CARD.name,
    purchasePrice: String(PROMO_CARD.purchasePrice),
    discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES.map((rule) => ({
      days: rule.days,
      discountPercent: String(rule.discountRate * 100),
    })),
    voucherRule: {
      enabled: DEFAULT_PROMO_CARD_VOUCHER_RULE.enabled,
      voucherAmount: String(DEFAULT_PROMO_CARD_VOUCHER_RULE.voucherAmount),
      minimumPurchase: String(DEFAULT_PROMO_CARD_VOUCHER_RULE.minimumPurchase),
      validityRule: {
        duration: String(DEFAULT_PROMO_CARD_VOUCHER_RULE.validityRule.duration),
        unit: DEFAULT_PROMO_CARD_VOUCHER_RULE.validityRule.unit,
      },
    },
    validityRule: {
      duration: String(DEFAULT_PROMO_CARD_VALIDITY_RULE.duration),
      unit: DEFAULT_PROMO_CARD_VALIDITY_RULE.unit,
      expiresAt: "",
    },
    usageMode: DEFAULT_VOUCHER_USAGE_RULE.isOneTimeUse
      ? "oneTime"
      : "consumable",
  };
}

export function getPromoCardSettingsForm(
  config: PromoCardSettings,
): PromoCardSettingsForm {
  return {
    name: config.name,
    purchasePrice: String(config.purchasePrice),
    discountRules: config.discountRules.map((rule) => ({
      days: rule.days,
      discountPercent: String(rule.discountRate * 100),
    })),
    voucherRule: {
      enabled: config.voucherRule.enabled,
      voucherAmount: String(config.voucherRule.voucherAmount),
      minimumPurchase: String(config.voucherRule.minimumPurchase),
      validityRule: {
        duration: String(
          config.voucherRule.validityRule?.duration ??
            DEFAULT_VOUCHER_VALIDITY_RULE.duration,
        ),
        unit:
          config.voucherRule.validityRule?.unit ??
          DEFAULT_VOUCHER_VALIDITY_RULE.unit,
      },
    },
    validityRule: {
      duration: String(config.validityRule.duration),
      unit: config.validityRule.unit,
      expiresAt: formatDateInputValue(config.validityRule.expiresAt),
    },
    usageMode: config.voucherRule.usageRule.isOneTimeUse
      ? "oneTime"
      : "consumable",
  };
}

export function getActivePromoCardSettings(
  config: PromoCardSettings | undefined,
): PromoCardSettings {
  return (
    config ?? {
      ...PROMO_CARD,
      discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
      voucherRule: DEFAULT_PROMO_CARD_VOUCHER_RULE,
      validityRule: DEFAULT_PROMO_CARD_VALIDITY_RULE,
    }
  );
}

export function buildPromoCardSettingsPayload(
  form: PromoCardSettingsForm,
): PromoCardSettingsPayload {
  return {
    name: form.name,
    purchasePrice: Number(form.purchasePrice),
    discountRules: form.discountRules.map((rule) => ({
      days: rule.days,
      discountPercent: Number(rule.discountPercent),
    })),
    voucherRule: {
      enabled: form.voucherRule.enabled,
      voucherAmount: Number(form.voucherRule.voucherAmount),
      minimumPurchase: Number(form.voucherRule.minimumPurchase),
      usageRule: {
        isOneTimeUse: form.usageMode === "oneTime",
        isConsumable: form.usageMode === "consumable",
      },
      validityRule: {
        duration: Number(form.voucherRule.validityRule.duration),
        unit: form.voucherRule.validityRule.unit,
      },
    },
    validityRule: {
      duration: Number(form.validityRule.duration),
      unit: form.validityRule.unit,
      expiresAt: form.validityRule.expiresAt || null,
    },
  };
}

export function hasPromoCardSettingsChanges(
  form: PromoCardSettingsForm,
  config: PromoCardSettings,
) {
  return (
    JSON.stringify(form) !== JSON.stringify(getPromoCardSettingsForm(config))
  );
}

export function togglePromoCardRuleDay(
  form: PromoCardSettingsForm,
  ruleIndex: number,
  day: PromotionDiscountDay,
): PromoCardSettingsForm {
  return {
    ...form,
    discountRules: form.discountRules.map((rule, index) => {
      if (index !== ruleIndex) return rule;

      const hasDay = rule.days.includes(day);

      return {
        ...rule,
        days: hasDay
          ? rule.days.filter((value) => value !== day)
          : [...rule.days, day],
      };
    }),
  };
}
