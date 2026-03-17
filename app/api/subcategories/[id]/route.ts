import { connectDB } from "@/lib/mongodb";
import { SubCategory } from "@/models/SubCategory";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

// ─── PATCH — update subcategory name ─────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const trimmedName = body.name?.trim().replace(/\s+/g, " ");

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Subcategory name is required!" },
        { status: 400 }
      );
    }

    const subcategory = await SubCategory.findByIdAndUpdate(
      id,
      { name: trimmedName },
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: "Subcategory updated successfully!", data: subcategory },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Subcategory name already exists!" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

// ─── DELETE — remove subcategory ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const subcategory = await SubCategory.findById(id);

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found!" },
        { status: 404 }
      );
    }

    // Guard — prevent deleting if products are still using this subcategory
    const productCount = await Product.countDocuments({ subcategory: id });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — ${productCount} product(s) are using this subcategory`,
        },
        { status: 409 }
      );
    }

    await SubCategory.findByIdAndDelete(id);

    return NextResponse.json(
      { success: "Subcategory deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}