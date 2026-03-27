import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { syncInventoryForBranch } from "@/lib/inventory/syncInventory";
import { jwtVerify } from "jose";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";

/**
 * POST /api/inventory/sync
 * Body: { branchId: string }
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get cookie
    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // verify + decode JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const branchId = payload.branch as string;

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 },
      );
    }

    const productCount = await Product.countDocuments();
    const inventoryCount = await Product.countDocuments({
      branchId: branchId,
    });

    if (inventoryCount < productCount) {
      await syncInventoryForBranch(branchId);
    }

    // fetch data
    const products = await Product.find();
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

      let status = "OK";

      if (quantity === 0) status = "OUT_OF_STOCK";
      else if (quantity <= reorderLevel) status = "LOW_STOCK";

      return {
        id: product._id.toString(),
        image: {
            url: product.image.url,
            public_id: product.image.public_id
        },
        name: product.name,
        price: product.price,
        category: product.category,
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
