import mongoose, { models, Schema } from "mongoose";

const InventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reorderLevel: {
      type: Number,
      default: 10,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true },
);

InventorySchema.index({ productId: 1, branchId: 1 }, { unique: true });

export const Inventory = models.Inventory || mongoose.model("Inventory", InventorySchema)
