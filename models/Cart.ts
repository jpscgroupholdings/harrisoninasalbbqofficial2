import mongoose, { models, Schema } from "mongoose";
import { OrderItemSchema } from "./Orders";

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
      type: [OrderItemSchema],
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
