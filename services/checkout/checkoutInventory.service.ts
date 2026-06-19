// ---------------------------------------------------------------------------
// Cart helpers
// ---------------------------------------------------------------------------

import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose, { ClientSession } from "mongoose";

export interface ResolvedCartItem {
  orderItem: {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    description: string;
    info?: string;
    image: string;
    category: string;
    quantity: number;
  };
  mayaItem: {
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    code: string;
    description: string;
    info?: string;
    amount: { value: number };
    totalAmount: { value: number; currency: string };
  };
  subtotal: number;
}

async function resolveCartItem(
  cartItem: { _id: string; quantity: number },
  branchId: string,
  session: ClientSession,
): Promise<ResolvedCartItem> {
  if (!cartItem._id || !cartItem.quantity)
    throw new Error("Invalid cart item.");

  const product = await Product.findById(cartItem._id).session(session);
  if (!product) throw new Error("Product not found!");

  const inventory = await Inventory.findOne({
    productId: cartItem._id,
    branchId,
    $expr: {
      $gte: [
        { $subtract: ["$quantity", { $sum: "$reservations.quantity" }] },
        cartItem.quantity,
      ],
    },
  }).session(session);

  if (!inventory)
    throw new Error(
      `${product.name} is out of stock or insufficient quantity.`,
    );

  return {
    orderItem: {
      productId: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      info: product.info,
      image: product.image.url,
      category: product.category,
      quantity: cartItem.quantity,
    },
    mayaItem: {
      productId: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      code: String(product._id),
      description: product.description,
      info: product.info,
      amount: { value: product.price },
      totalAmount: {
        value: product.price * cartItem.quantity,
        currency: "PHP",
      },
    },
    subtotal: product.price * cartItem.quantity,
  };
}

export async function resolveCart(
  items: CreateOrderPayload["items"],
  branchId: string,
  session: ClientSession,
) {
  const resolved = await Promise.all(
    items.map((item) => resolveCartItem(item, branchId, session)),
  );

  const totalPrice = resolved.reduce((sum, r) => sum + r.subtotal, 0);
  const orderItems = resolved.map((r) => r.orderItem);
  const mayaItems = resolved.map((r) => r.mayaItem);

  return { totalPrice, orderItems, mayaItems };
}

export async function reserveInventory(
  orderItems: ResolvedCartItem["orderItem"][],
  branchId: string,
  orderId: mongoose.Types.ObjectId,
  session: ClientSession,
) {
  for (const item of orderItems) {
    const updated = await Inventory.findOneAndUpdate(
      {
        productId: item.productId,
        branchId,
        "reservations.orderId": { $ne: orderId }, // idempotent
        $expr: {
          $gte: [
            { $subtract: ["$quantity", { $sum: "$reservations.quantity" }] },
            item.quantity,
          ],
        },
      },
      { $push: { reservations: { orderId, quantity: item.quantity } } },
      { new: true, session },
    );

    // null = already reserved (retry) OR out of stock — check which
    if (!updated) {
      const existing = await Inventory.findOne({
        productId: item.productId,
        branchId,
        "reservations.orderId": orderId,
      }).session(session);

      if (!existing) {
        throw new Error(
          `${item.name} is out of stock or insufficient quantity.`,
        );
      }
      // else: already reserved for this order (retry), continue
    }
  }
}
