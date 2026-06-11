import {
  BUNDLE_TYPE,
  BundleDiscountProductSnapshot,
  DEFAULT_BUNDLE_PROMOTION_DISCOUNT,
  type BundleType,
} from "@/types/promotions/bundle-discount.type";
import {
  PROMOTION_DAY_MODE,
  PROMOTION_DISCOUNT_DAYS,
  PROMOTION_DISCOUNT_TYPE,
  PROMOTION_TYPES,
} from "@/types/promotions/promotion-constant";
import { model, models, Schema } from "mongoose";

type BundleDiscountPromotionDocument = {
  bundleType: BundleType;
  requiredQuantity?: number | null;
  products: BundleDiscountProductSnapshot[];
  categoryIds?: unknown[];
  invalidate(path: string, message: string): void;
};

const requiresGlobalQuantity = (bundleType: BundleType) =>
  bundleType !== BUNDLE_TYPE.COMBO_ITEMS;

const getBundleItemQuantity = (product: BundleDiscountProductSnapshot) =>
  product.quantity ?? 1;

const BundleDiscountProductSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

const BundleDiscountPromotionSchema = new Schema(
  {
    promotionType: {
      type: String,
      enum: [PROMOTION_TYPES.BUNDLE_DISCOUNT],
      default: PROMOTION_TYPES.BUNDLE_DISCOUNT,
      required: true,
    },
    bundleType: {
      type: String,
      enum: Object.values(BUNDLE_TYPE),
      default: BUNDLE_TYPE.ANY_ITEMS,
      required: true,
    },
    requiredQuantity: {
      type: Number,
      min: 2,
      validate: {
        validator(value: number | null | undefined) {
          return value == null || Number.isInteger(value);
        },
        message: "Required quantity must be a whole number.",
      },
    },
    enabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.name,
      maxLength: 80,
    },
    discountType: {
      type: String,
      enum: PROMOTION_DISCOUNT_TYPE,
      required: true,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.discountType,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.discountValue,
    },
    products: {
      type: [BundleDiscountProductSchema],
      default: [],
      validate: {
        validator(products: BundleDiscountProductSnapshot[]) {
          if (!Array.isArray(products) || products.length === 0) return false;
          return products.every((product) =>
            Number.isInteger(getBundleItemQuantity(product)),
          );
        },
        message: "Choose at least one product with valid item quantities.",
      },
    },
    categoryIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    endsAt: {
      type: Date,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.endsAt,
      index: true,
    },
    dayMode: {
      type: String,
      enum: PROMOTION_DAY_MODE,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.dayMode,
      required: true,
    },
    days: {
      type: [String],
      enum: PROMOTION_DISCOUNT_DAYS,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.days,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.startTime,
    },
    endTime: {
      type: String,
      required: true,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.endTime,
    },
    maximumRedemptions: {
      type: Number,
      min: 1,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.maximumRedemptions,
    },
    redemptionCount: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_BUNDLE_PROMOTION_DISCOUNT.redemptionCount,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

BundleDiscountPromotionSchema.pre(
  "validate",
  function validateBundleRules(this: BundleDiscountPromotionDocument) {
  if (requiresGlobalQuantity(this.bundleType)) {
    if (
      this.bundleType === BUNDLE_TYPE.SAME_ITEMS &&
      this.products.length !== 1
    ) {
      this.invalidate(
        "products",
        "Same-item bundle discounts must target exactly one product.",
      );
    }

    if (this.bundleType === BUNDLE_TYPE.SAME_ITEMS) {
      this.categoryIds = [];
    }

    if (
      this.requiredQuantity == null ||
        !Number.isInteger(this.requiredQuantity) ||
        this.requiredQuantity < 2
      ) {
        this.invalidate(
          "requiredQuantity",
          "Required quantity must be at least 2 for this bundle type.",
        );
      }

      return;
    }

    this.requiredQuantity = undefined;

    const totalComboQuantity = this.products.reduce(
      (total, product) => total + getBundleItemQuantity(product),
      0,
    );

    if (totalComboQuantity < 2) {
      this.invalidate(
        "products",
        "A combo bundle needs at least 2 total items.",
      );
    }
  },
);

BundleDiscountPromotionSchema.index({ enabled: 1, startsAt: 1, endsAt: 1 });
BundleDiscountPromotionSchema.index({ "products.product": 1, enabled: 1 });

export const BundleDiscountPromotion =
  models.BundleDiscountPromotion ||
  model("BundleDiscountPromotion", BundleDiscountPromotionSchema);
