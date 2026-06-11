import { getValidObjectIds } from "@/helper/getValidObjectIds";
import "@/lib/registerModels";
import { Product } from "@/models/Product";
import type { BundleDiscountProductSnapshot } from "@/types/promotions/bundle-discount.type";
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


export async function getBundleDiscountSnapshots(
  productIds: string[] = [],
  productQuantities: Record<string, number> = {},
) {
  const validProductIds = getValidObjectIds(productIds);

  if (validProductIds.length === 0) return [];

  const products = await Product.find({ _id: { $in: validProductIds } })
    .select({ name: 1, price: 1, image: 1, category: 1 })
    .lean<ProductSnapshotRecord[]>();

  const productOrder = new Map(
    validProductIds.map((productId, index) => [productId, index]),
  );

  return products
    .map<BundleDiscountProductSnapshot>((product) => {
      const productId = product._id.toString();
      const quantity = productQuantities[productId] ?? 1;

      return {
        product: productId,
        name: product.name,
        price: product.price ?? null,
        imageUrl: product.image?.url ?? "",
        category: product.category?.toString() ?? null,
        quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
      };
    })
    .sort(
      (left, right) =>
        (productOrder.get(left.product) ?? 0) -
        (productOrder.get(right.product) ?? 0),
    );
}
 