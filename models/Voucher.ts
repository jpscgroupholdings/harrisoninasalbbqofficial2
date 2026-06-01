import {
  DEFAULT_VOUCHER_USAGE_RULE,
  VOUCHER_SOURCE_TYPES,
  VOUCHER_STATUSES,
} from "@/types/voucher.types";
import { model, models, Schema } from "mongoose";

const VoucherUsageRuleSchema = new Schema(
  {
    isOneTimeUse: {
      type: Boolean,
      default: DEFAULT_VOUCHER_USAGE_RULE.isOneTimeUse,
    },
    isConsumable: {
      type: Boolean,
      default: DEFAULT_VOUCHER_USAGE_RULE.isConsumable,
    },
  },
  { _id: false },
);

const VoucherSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: VOUCHER_SOURCE_TYPES,
      required: true,
      index: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
    usageRule: {
      type: VoucherUsageRuleSchema,
      default: DEFAULT_VOUCHER_USAGE_RULE,
    },
    status: {
      type: String,
      enum: VOUCHER_STATUSES,
      default: "active",
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true },
);

VoucherSchema.index({ customerId: 1, status: 1, createdAt: -1 });
VoucherSchema.index({ sourceType: 1, sourceId: 1 });

export const Voucher = models.Voucher || model("Voucher", VoucherSchema);

