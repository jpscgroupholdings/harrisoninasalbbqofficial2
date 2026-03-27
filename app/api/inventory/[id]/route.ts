import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Inventory } from "@/models/Inventory";
import { jwtVerify } from "jose";
import z from "zod";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const updateInventorySchema = z.object({
  quantity: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    // Get token first for the branchid and staffid
    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const branchId = payload.branch as string;
    const staffId = payload.id as string;

    if (!branchId) {
      return NextResponse.json(
        { error: "No branch assigned" },
        { status: 403 },
      );
    }

    // Get Product id from the params
    const { id: productId } = await context.params;
    const body = await req.json();
    const { quantity, reorderLevel } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }

    // ⚠️ validation
    if (quantity != null && quantity < 0) {
      return NextResponse.json(
        { error: "Quantity cannot be negative" },
        { status: 400 },
      );
    }

    if (reorderLevel != null && reorderLevel < 0) {
      return NextResponse.json(
        { error: "reorderLevel cannot be negative" },
        { status: 400 },
      );
    }

    // 🧠 3. Build update object (only update provided fields)
    const updateData: any = {
      updatedBy: staffId,
    };

    if (quantity != null) updateData.quantity = quantity;
    if (reorderLevel != null) updateData.reorderLevel = reorderLevel;

    // 🔥 4. Update (or create if missing)
    const inventory = await Inventory.findOneAndUpdate(
      {
        productId: productId,
        branchId: branchId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        upsert: true, // 🔥 auto create if missing
      },
    );

    return NextResponse.json({
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("UPDATE INVENTORY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 },
    );
  }
}
