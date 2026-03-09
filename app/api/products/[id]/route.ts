import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let uploadResult;

  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const {
      name,
      price,
      description,
      image,
      imageFile,
      category,
      stock,
      isSignature,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let finalImage = existingProduct.image;

    // ✅ If user uploaded new image
    if (imageFile) {
      // 1️⃣ Upload new image
      uploadResult = await cloudinary.uploader.upload(imageFile, {
        folder: "products",
      });

      finalImage = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };

      // 2️⃣ Delete old image
      if (existingProduct.image?.public_id) {
        await cloudinary.uploader.destroy(existingProduct.image.public_id);
      }
    } else if (image && image.startsWith("http")) {
      const isSameImage = existingProduct.image?.url === image;

      if (!isSameImage) {
        if (existingProduct.image?.public_id) {
          await cloudinary.uploader.destroy(existingProduct.image.public_id);
        }

        finalImage = {
          url: image,
          public_id: undefined,
        };
      }
    }

    // 3️⃣ Update product
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: parseFloat(price),
        description,
        image: finalImage,
        category,
        stock: parseInt(stock),
        isSignature,
      },
      { new: true },
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    // 🔥 Rollback if DB update failed after upload
    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    return NextResponse.json(
      { error: error.message || "Failed to update item" },
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found!" },
        { status: 404 },
      );
    }

    // Delete image from cloudinary
    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    // Then delete product from DB
    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Product deleted successfully!" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete an item" },
      { status: 500 },
    );
  }
}
