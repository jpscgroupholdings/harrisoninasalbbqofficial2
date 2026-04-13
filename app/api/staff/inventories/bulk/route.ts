import z from "zod";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/getAuth";
import { Inventory } from "@/models/Inventory";

const bulkUpdateSchema = z.object({
  items: z
    .array(
      z
        .object({
          productId: z.string().min(1),
          quantity: z.coerce.number().min(0).optional(),
          reorderLevel: z.coerce.number().min(0).optional(),
        })
        .refine((d) => d.quantity != null || d.reorderLevel != null),
      {
        message: "Each item must have at least quantity or reorderLevel",
      },
    )
    .min(1, "At least one item is required"),
});

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const staff = await requireAdmin(request);

    const branchId = staff.branch as string;
    const staffId = staff.id as string;

    if (!branchId) {
      return NextResponse.json(
        { error: "No branch assigned" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = bulkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { items } = parsed.data;

    // Run all updates in parallel
    const results = await Promise.allSettled(
      items.map(({ productId, quantity, reorderLevel }) => {
        const updateData: Record<string, unknown> = { updatedBy: staffId };

        if (quantity != null) updateData.quantity = quantity;
        if (reorderLevel != null) updateData.reorderLevel = reorderLevel;

        return Inventory.findOneAndUpdate(
          { productId, branchId },
          { $set: updateData },
          { new: true, upsert: true },
        );
      }),
    );

    const failed = results.filter((r) => r.status === "rejected");
    const updated = results.filter((r) => r.status === "fulfilled").length;

    if (failed.length > 0) {
      console.error("Some inventory updates failed:", failed);
    }

    return NextResponse.json({
      message: `${updated} item(s) updated successfully!`,
      updated,
      ...(failed.length > 0 && { partialFailures: failed.length }),
    });
  } catch (error) {
    console.error("BULK UPDATE INVENTORY ERROR:", error);
    return NextResponse.json(
      { error: "Failed to bulk update inventory" },
      { status: 500 },
    );
  }
}
