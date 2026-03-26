import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { extractPublicId } from "@/helper/extractImagePublicId";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let uploadResult: any;

  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const {
      name,
      price,
      image,
      imageFile,
      info,
      description,
      category,
      subcategory,
      isSignature,
      isPopular,
      productType,
      paxCount,
      includedItems,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // ── Image handling (unchanged from your original) ─────────────────────────

    let finalImage = existingProduct.image;

    if (imageFile) {
      uploadResult = await cloudinary.uploader.upload(imageFile, {
        folder: "products",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto" },
        ],
      });

      finalImage = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };

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
          public_id: extractPublicId(image)
        };
      }
    }

    // ── Update product ────────────────────────────────────────────────────────

    const resolvedProductType = productType ?? existingProduct.productType ?? "solo";

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: price !== undefined ? (price === null ? null : parseFloat(price)) : existingProduct.price,
        image: finalImage,
        category,
        subcategory: subcategory ?? null,

        info: info ?? "Product info is not available",
        description: description ?? "Product description is not available",

        isSignature,
        isPopular,
        productType: resolvedProductType,
        paxCount: resolvedProductType === "set" ? (paxCount ?? null) : null,
        includedItems: resolvedProductType !== "solo"
          ? (includedItems ?? []).map((item: any) => ({
              product: item.product,
              quantity: item.quantity,
              label: item.label ?? null,
            }))
          : [],
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Product already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found!" },
        { status: 404 }
      );
    }

    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Product deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}