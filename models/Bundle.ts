import mongoose, { models, Schema } from "mongoose";

const BundleItemSchema = new Schema(
  {
    // Reference to a Product - or fall bacl to a plain string if not in DB yet
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    label: { type: String, required: true }, // display name e.g "Lechon Kawali"
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const BundleSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. "Party Tray - Lechon Kawali"

    // Price range — both required for bundles
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, required: true, min: 0 },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    bundleType: {
      type: String,
      enum: ["party_tray", "catering"],
      required: true,
    },

    // Open-ended list of dishes included or available in this bundle
    items: { type: [BundleItemSchema], ref: "Product" },

    // Serving range — e.g. min: 12, max: 14 for "12–14 pax"
    minPax: { type: Number, default: null },
    maxPax: { type: Number, default: null },

    // Extra notes — e.g. "Minimum 30 pax", "1 week lead time"
    description: { type: String, default: null },

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Bundle = models.Bundle || mongoose.model("Bundle", BundleSchema)
