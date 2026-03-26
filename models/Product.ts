import mongoose, { Schema, models } from "mongoose";

const IncludedItemsSchema = new Schema({
  product: {type: Schema.Types.ObjectId, ref: "Product", required: true},
  quantity: {type: Number, required: true, min:1 , default: 1},

  // Override display name if needed - e.g "Drink (choice of Coke or Water)"
  // Falls back to product.name if null
  label: {type: String,  default: null}
}, {_id: false});

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

    // Descriptive included items for combo/sets - display only
    includedItems: {type: [IncludedItemsSchema], default: []},

    paxCount: {type: Number, default: null},

    isPopular: { type: Boolean, default: false },
    isSignature: { type: Boolean, default: false },
  },
  { timestamps: true }, 
);

export const Product =
  models.Product || mongoose.model("Product", ProductSchema);
