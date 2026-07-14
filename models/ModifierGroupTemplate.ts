import mongoose, { Schema, models } from "mongoose";

// A selectable item option within a modifier group template
const ModifierTemplateItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  label: { type: String, default: null },
  price: { type: Number, default: null, min: 0 },
  snapshotName: { type: String, default: null },
  snapshotPrice: { type: Number, default: null },
  position: { type: Number, default: 0 },
}, { _id: false });

// A reusable modifier group template — can be applied to multiple combo/set products
const ModifierGroupTemplateSchema = new Schema({
  name: { type: String, required: true },
  required: { type: Boolean, default: true },
  minSelect: { type: Number, default: 1, min: 1 },
  maxSelect: { type: Number, default: 1, min: 1 },
  items: { type: [ModifierTemplateItemSchema], default: [] },
}, { timestamps: true });

export const ModifierGroupTemplate =
  models.ModifierGroupTemplate || mongoose.model("ModifierGroupTemplate", ModifierGroupTemplateSchema);
