import mongoose, { models, Schema } from "mongoose";

const SubCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { timestamps: true },
);

export const SubCategory = models.SubCategory || mongoose.model("SubCategory", SubCategorySchema);