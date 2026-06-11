import { getValidObjectIds } from "@/helper/getValidObjectIds";
import "@/lib/registerModels";
import { Product } from "@/models/Product";
import type { ProductDiscountProductSnapshot } from "@/types/promotions/product-discount.type";
import mongoose from "mongoose";

type ProductSnapshotRecord = {
  _id: mongoose.Types.ObjectId;
  name: string;
  price?: number | null;
  image?: {
    url?: string;
  };
  category?: mongoose.Types.ObjectId | null;
};

export async function getProductDiscountSnapshots(productIds: string[] = []) {
  const validProductIds = getValidObjectIds(productIds);

  if (validProductIds.length === 0) return [];

  const products = await Product.find({ _id: { $in: validProductIds } })
    .select({ name: 1, price: 1, image: 1, category: 1 })
    .lean<ProductSnapshotRecord[]>();

  const productOrder = new Map(
    validProductIds.map((productId, index) => [productId, index]),
  );

  return products
    .map<ProductDiscountProductSnapshot>((product) => ({
      product: product._id.toString(),
      name: product.name,
      price: product.price ?? null,
      imageUrl: product.image?.url ?? "",
      category: product.category?.toString() ?? null,
    }))
    .sort(
      (left, right) =>
        (productOrder.get(left.product) ?? 0) -
        (productOrder.get(right.product) ?? 0),
    );
}
