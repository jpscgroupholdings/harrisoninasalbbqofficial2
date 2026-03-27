import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";

/**
 *
 * Sync missing inventory for a branch
 * - does NOT overwrite existing inventory
 * - only creates missing ones
 *
 */

export async function syncInventoryForBranch(branchId: string) {
  // 1. Get all products id
  const products = await Product.find().select("_id");

  
  // 2. get Existing inventory product IDs for this branch
  const existingInventory = await Inventory.find({
    branchId: branchId,
  }).select("productId");

  const existingProductIds = new Set(
    existingInventory.map((inv) => inv.productId.toString()),
  );

  // 3. Find missing products
  const missingProducts = products.filter(
    (p) => !existingProductIds.has(p._id.toString()),
  );

  // 4. Prepare new inventory docs
  const newDocs = missingProducts.map((p) => ({
    productId: p._id,
    branchId: p.branchId,
    quantity: 0
  }));

  // 5. Insert (if any)
  if (newDocs.length > 0){
    await Inventory.insertMany(newDocs, {
      ordered: false // skip duplicates safely
    })
  }

  return {
    created: newDocs.length,
    totalProducts: products.length,
    existing: existingProductIds.size
  }

}
