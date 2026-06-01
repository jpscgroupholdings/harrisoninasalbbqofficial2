import { model, models, Schema } from "mongoose";
import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  DEFAULT_PROMO_CARD_USAGE_RULE,
  DEFAULT_PROMO_CARD_VALIDITY_RULE,
  DEFAULT_PROMO_CARD_VOUCHER_RULE,
  PROMO_CARD_DAYS,
  PROMO_CARD_VALIDITY_UNITS,
} from "@/lib/promoCard";

export const PROMO_CARD_PURCHASE_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
] as const;

const DiscountRuleSchema = new Schema(
  {
    days: {
      type: [String],
      enum: PROMO_CARD_DAYS,
      required: true,
      default: [],
    },
    discountRate: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false },
);

const VoucherRuleSchema = new Schema(
  {
    enabled: { type: Boolean, default: DEFAULT_PROMO_CARD_VOUCHER_RULE.enabled },
    voucherAmount: {
      type: Number,
      default: DEFAULT_PROMO_CARD_VOUCHER_RULE.voucherAmount,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      default: DEFAULT_PROMO_CARD_VOUCHER_RULE.minimumPurchase,
      min: 0,
    },
  },
  { _id: false },
);

const ValidityRuleSchema = new Schema(
  {
    duration: {
      type: Number,
      required: true,
      default: DEFAULT_PROMO_CARD_VALIDITY_RULE.duration,
      min: 1,
    },
    unit: {
      type: String,
      enum: PROMO_CARD_VALIDITY_UNITS,
      required: true,
      default: DEFAULT_PROMO_CARD_VALIDITY_RULE.unit,
    },
    expiresAt: {
      type: Date,
      default: DEFAULT_PROMO_CARD_VALIDITY_RULE.expiresAt,
    },
  },
  { _id: false },
);

const UsageRuleSchema = new Schema(
  {
    isOneTimeUse: {
      type: Boolean,
      default: DEFAULT_PROMO_CARD_USAGE_RULE.isOneTimeUse,
    },
    isConsumable: {
      type: Boolean,
      default: DEFAULT_PROMO_CARD_USAGE_RULE.isConsumable,
    },
  },
  { _id: false },
);

const PromoCardPurchaseSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    checkoutId: String,
    paymentId: String,
    status: {
      type: String,
      enum: PROMO_CARD_PURCHASE_STATUSES,
      default: "pending",
      index: true,
    },
    paymentStatus: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    customerPhone: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    discountRate: { type: Number, required: true },
    discountRules: {
      type: [DiscountRuleSchema],
      default: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
    },
    voucherRule: {
      type: VoucherRuleSchema,
      default: DEFAULT_PROMO_CARD_VOUCHER_RULE,
    },
    validityRule: {
      type: ValidityRuleSchema,
      default: DEFAULT_PROMO_CARD_VALIDITY_RULE,
    },
    usageRule: {
      type: UsageRuleSchema,
      default: DEFAULT_PROMO_CARD_USAGE_RULE,
    },
    paidAt: Date,
    failedAt: Date,
    expiredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

PromoCardPurchaseSchema.index({ status: 1, createdAt: -1 });
PromoCardPurchaseSchema.index({ customerEmail: 1, createdAt: -1 });
PromoCardPurchaseSchema.index(
  { customerId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "paid"] } },
  },
);

export const PromoCardPurchase =
  models.PromoCardPurchase ||
  model("PromoCardPurchase", PromoCardPurchaseSchema);
