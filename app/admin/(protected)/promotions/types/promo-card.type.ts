import type {
  PromoCardValidityUnit,
} from "@/lib/promoCard";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";
import type { VoucherValidityUnit } from "@/types/voucher.types";

export type PromoCardPurchaseStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";

export type PromoCardPurchase = {
  _id: string;
  referenceNumber: string;
  status: PromoCardPurchaseStatus;
  paymentStatus?: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  purchasePrice: number;
  discountRate: number;
  createdAt: string;
  paidAt?: string;
};

export type PromoCardSettings = {
  name: string;
  discountRate: number;
  purchasePrice: number;
  sku: string;
  discountRules: {
    days: PromotionDiscountDay[];
    discountRate: number;
  }[];
  voucherRule: {
    enabled: boolean;
    voucherAmount: number;
    minimumPurchase: number;
    usageRule: {
      isOneTimeUse: boolean;
      isConsumable: boolean;
    };
    validityRule: {
      duration: number;
      unit: VoucherValidityUnit;
    };
  };
  validityRule: {
    duration: number;
    unit: PromoCardValidityUnit;
    expiresAt: string | Date | null;
  };
};

export type PromoCardResponse = {
  data: PromoCardPurchase[];
  config: PromoCardSettings;
  stats: {
    total: number;
    paid: number;
    pending: number;
    paidRevenue: number;
  };
};

export type PromoCardSettingsForm = {
  name: string;
  purchasePrice: string;
  discountRules: {
    days: PromotionDiscountDay[];
    discountPercent: string;
  }[];
  voucherRule: {
    enabled: boolean;
    voucherAmount: string;
    minimumPurchase: string;
    validityRule: {
      duration: string;
      unit: VoucherValidityUnit;
    };
  };
  validityRule: {
    duration: string;
    unit: PromoCardValidityUnit;
    expiresAt: string;
  };
  usageMode: "consumable" | "oneTime";
};

export type PromoCardSettingsPayload = {
  name: string;
  purchasePrice: number;
  discountRules: {
    days: PromotionDiscountDay[];
    discountPercent: number;
  }[];
  voucherRule: {
    enabled: boolean;
    voucherAmount: number;
    minimumPurchase: number;
    usageRule: {
      isOneTimeUse: boolean;
      isConsumable: boolean;
    };
    validityRule: {
      duration: number;
      unit: VoucherValidityUnit;
    };
  };
  validityRule: {
    duration: number;
    unit: PromoCardValidityUnit;
    expiresAt: string | null;
  };
};
