import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import z from "zod";
import { requireAdmin } from "@/lib/getAuth";
import { Types } from "mongoose";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { STAFF_ROLES } from "@/types/staff";
import { notifyLowStock } from "@/services/notification.service";

const updateInventorySchema = z
  .object({
    quantity: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
  })
  .refine((data) => data.quantity != null || data.reorderLevel != null, {
    message: "At least one field must be provided",
  });

type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const staff = await requireAdmin(req);

    if (!canAccess(staff.role, "inventories.update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Superadmins can choose a branch; regular admins are locked to their own
    let branchId: Types.ObjectId | null = staff.branch
      ? new Types.ObjectId(String(staff.branch))
      : null;

    if (staff.role === STAFF_ROLES.SUPERADMIN) {
      const requestedBranch = searchParams.get("branchId");
      if (requestedBranch) {
        branchId = new Types.ObjectId(requestedBranch);
      }
    }

    const staffId = staff._id;

    if (!branchId) {
      return NextResponse.json(
        { error: "No branch assigned" },
        { status: 403 },
      );
    }
    // Get Product id from the params
    const { id: productId } = await context.params;
    const body = await req.json();
    const parsed = updateInventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { quantity, reorderLevel } = parsed.data;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }
    // 3. Build update object (only update provided fields)
    const updateData: Partial<UpdateInventoryInput> & {
      updatedBy: Types.ObjectId;
    } = {
      updatedBy: staffId,
    };

    if (quantity != null) updateData.quantity = quantity;
    if (reorderLevel != null) updateData.reorderLevel = reorderLevel;
    // 4. Update (or create if missing)
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
        upsert: true,
      },
    );

    // 5. Notify admins if stock dropped to or below reorder level
    const effectiveReorderLevel = inventory.reorderLevel ?? 10;
    if (inventory.quantity <= effectiveReorderLevel) {
      const product = await Product.findById(productId).lean();
      notifyLowStock({
        productId,
        productName: product?.name ?? "Unknown Product",
        branchId: branchId.toString(),
        quantity: inventory.quantity,
        reorderLevel: effectiveReorderLevel,
      });
    }

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
