import mongoose, { models, Schema } from "mongoose";

/** Sub-schema: a single selected modifier item within a group */
const ModifierSelectionItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    label: { type: String, default: null },
    upgradePrice: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { _id: false },
);

/** Sub-schema: a completed modifier group selection */
const ModifierSelectionSchema = new Schema(
  {
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    required: { type: Boolean, default: true },
    minSelect: { type: Number, default: 1, min: 1 },
    maxSelect: { type: Number, default: 1, min: 1 },
    items: { type: [ModifierSelectionItemSchema], default: [] },
  },
  { _id: false },
);

export const CartItemSchema = new Schema(
  {
    _id: { type: String, required: true }, // preserves your MenuItem._id
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    category: {
      _id: { type: String },
      name: { type: String },
    },
    productType: {
      type: String,
      enum: ["solo", "combo", "set"],
      default: "solo",
    },
    modifierSelections: {
      type: [ModifierSelectionSchema],
      default: [],
    },
    activeProductDiscount: {
      promotionId: { type: String },
      name: { type: String },
      discountType: { type: String, enum: ["percentage", "fixed"] },
      discountValue: { type: Number },
      originalPrice: { type: Number },
      discountedPrice: { type: Number },
      discountAmount: { type: Number },
      label: { type: String },
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }, // prevent Mongoose from overriding your string _id
);

const CartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      unique: true,
      required: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  },
);

export const Cart = models.Cart || mongoose.model("Cart", CartSchema)
