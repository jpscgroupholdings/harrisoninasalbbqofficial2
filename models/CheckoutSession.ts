import { model, models, Schema } from "mongoose";
import { OrderItemSchema } from "./Orders";

// models/CheckoutSession.ts
const CheckoutSessionSchema = new Schema({
  checkoutId: { type: String, required: true, unique: true },
  referenceNumber: { type: String, required: true },
  items: [OrderItemSchema],
  total: {
    subTotal: Number,
    tax: Number,
    total: Number,
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const CheckoutSession = models.CheckoutSession || model("CheckoutSession", CheckoutSessionSchema);