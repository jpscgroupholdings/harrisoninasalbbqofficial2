import mongoose, { Schema, models } from "mongoose";

// A selectable item option within a modifier group
const ModifierItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  label: { type: String, default: null },
  price: { type: Number, default: null, min: 0 },
  snapshotName: { type: String, default: null },
  snapshotPrice: { type: Number, default: null },
  position: { type: Number, default: 0 },
}, { _id: false });

// A group of choices the customer must fill — e.g. "Grilled", "Drink"
const ModifierGroupSchema = new Schema({
  templateId: { type: Schema.Types.ObjectId, ref: "ModifierGroupTemplate", default: null },
  name: { type: String, required: true },
  required: { type: Boolean, default: true },
  minSelect: { type: Number, default: 1, min: 1 },
  maxSelect: { type: Number, default: 1, min: 1 },
  position: { type: Number, default: 0 },
  items: { type: [ModifierItemSchema], default: [] },
}, { _id: true });

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },

    // Null for range-priced items (Party Trays, Catering)
    price: { type: Number, min: 0, default: null },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    info: {type: String, default: "Product info is not available"},
    description: {type: String, default: "Product description is not available"},

    category: { type: Schema.Types.ObjectId, ref: 'Category'},
    subcategory: {type: Schema.Types.ObjectId, ref: 'SubCategory', default: null},

    productType: {
      type: String,
      enum: ["solo", "combo", "set"],
      default: "solo"
    },

    // Modifier groups for combo/set products — each group defines a customer choice slot
    modifierGroups: { type: [ModifierGroupSchema], default: [] },

    paxCount: {type: Number, default: null},

    isPopular: { type: Boolean, default: false },
    isSignature: { type: Boolean, default: false },
  },
  { timestamps: true }, 
);

export const Product =
  models.Product || mongoose.model("Product", ProductSchema);
