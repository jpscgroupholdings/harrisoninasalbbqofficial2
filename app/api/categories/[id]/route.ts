import cloudinary from "@/lib/cloudinary";
import { requireSuperAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let uploadResult: any;

  try {
    await connectDB();
    await requireSuperAdmin(request)

    const { id } = await context.params;
    const body = await request.json();

    const { name: newName, imageFile } = body;
    const trimmedName = newName?.trim().replace(/\s+/g, " ");

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Category name is required!" },
        { status: 400 },
      );
    }

    // Build update payload
    const updateData: Record<string, any> = { name: trimmedName };

    if (imageFile) {
      // Fetch existing category to delete old Cloudinary image
      const existing = await Category.findById(id);
      if (existing?.image?.public_id) {
        await cloudinary.uploader.destroy(existing.image.public_id);
      }

      // Upload new image
      uploadResult = await cloudinary.uploader.upload(imageFile, {
        folder: "categories",
        transformation: [
          { width: 400, height: 400, crop: "limit" },
          { quality: "auto" },
        ],
      });

      updateData.image = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!category) {
      // Clean up uploaded image if category wasn't found
      if (uploadResult?.public_id) {
        await cloudinary.uploader.destroy(uploadResult.public_id);
      }
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: "Category updated successfully!", data: category },
      { status: 200 },
    );
  } catch (error: any) {
    // Clean up uploaded image on any error
    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Category name already exists!" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireSuperAdmin(request);

    const { id } = await context.params;

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found!" },
        { status: 404 }
      );
    }

    const productCount = await Product.countDocuments({ category: id });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${productCount} product(s) are using this category` },
        { status: 409 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { success: "Category deleted successfully!" },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete the category" },
      { status: 500 }
    );
  }
}