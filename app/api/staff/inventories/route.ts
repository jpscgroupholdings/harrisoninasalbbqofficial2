import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { syncInventoryForBranch } from "@/lib/inventory/syncInventory";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { requireAdmin } from "@/lib/getAuth";

/**
 * POST /api/inventory/sync
 * Body: { branchId: string }
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const staff = await requireAdmin(req)

    const branchId = staff.branch;

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 },
      );
    }

    const productCount = await Product.countDocuments();
    const inventoryCount = await Inventory.countDocuments({
      branchId: branchId,
    });

    if (inventoryCount < productCount) {
      await syncInventoryForBranch(branchId);
    }

    // fetch data
    const products = await Product.find().populate("category", "name");
    const inventories = await Inventory.find({ branchId: branchId });

    const inventoryMap = new Map(
      inventories.map((inv) => [
        inv.productId.toString(),
        { quantity: inv.quantity, reorderLevel: inv.reorderLevel },
      ]),
    );

    const result = products.map((product) => {
      const inv = inventoryMap.get(product._id.toString());

      const quantity = inv?.quantity ?? 0;
      const reorderLevel = inv?.reorderLevel ?? 10;

      let status = STOCK_STATUSES.IN_STOCK;

      if (quantity === 0) status = STOCK_STATUSES.OUT_OF_STOCK;
      else if (quantity <= reorderLevel) status = STOCK_STATUSES.LOW_STOCK;

      return {
        id: product._id.toString(),
        image: {
          url: product.image.url,
          public_id: product.image.public_id,
        },
        name: product.name,
        price: product.price,
        category: product.category?.name ?? "Uncategorized",
        quantity,
        reorderLevel,
        status,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("SYNC ERROR:", error);

    return NextResponse.json(
      { error: "Failed to sync inventory" },
      { status: 500 },
    );
  }
}
