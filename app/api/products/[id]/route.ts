import "@/lib/registerModels";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { extractPublicId } from "@/utils/extractImagePublicId";
import { requireSuperAdmin } from "@/lib/getAuth";
import mongoose from "mongoose";
import { STOCK_STATUSES } from "@/types/inventory_types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const { id } = await context.params;
  const branchId = new URL(request.url).searchParams.get("branchId");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const pipeline: any[] = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "subcategories",
        localField: "subcategory",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "products",
        localField: "includedItems.product",
        foreignField: "_id",
        as: "_includedItems",
      },
    },
    {
      $addFields: {
        includedItems: {
          $map: {
            input: { $ifNull: ["$includedItems", []] },
            as: "item",
            in: {
              product: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$_includedItems",
                      as: "p",
                      cond: { $eq: ["$$p._id", "$$item.product"] },
                    },
                  },
                  0,
                ],
              },

              quantity: "$$item.quantity",
              label: "$$item.label",
            },
          },
        },
      },
    },
    {
      $unset: "_includedProducts",
    },

    ...(branchId && mongoose.Types.ObjectId.isValid(branchId)
      ? [
          {
            $lookup: {
              from: "inventories",
              let: { productId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$productId", "$$productId"] },
                        { $eq: ["$branchId", { $toObjectId: branchId }] },
                      ],
                    },
                  },
                },
                { $project: { quantity: 1, reorderLevel: 1 } },
              ],
              as: "inventory",
            },
          },
          {
            $addFields: {
              quantity: {
                $ifNull: [{ $arrayElemAt: ["$inventory.quantity", 0] }, 0],
              },
              reorderLevel: {
                $ifNull: [{ $arrayElemAt: ["$inventory.reorderLevel", 0] }, 10],
              },
            },
          },
          { $unset: "inventory" },
          {
            $addFields: {
              status: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$quantity", 0],
                      },
                      then: STOCK_STATUSES.OUT_OF_STOCK,
                    },
                    {
                      case: {
                        $lte: ["$quantity", "$reorderLevel"],
                      },
                      then: STOCK_STATUSES.LOW_STOCK,
                    },
                  ],
                  default: STOCK_STATUSES.IN_STOCK,
                },
              },
            },
          },
        ]
      : []),
  ];
  try {
    const [product] = await Product.aggregate(pipeline);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found!" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: product }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let uploadResult: any;

  try {
    await connectDB();
    await requireSuperAdmin(request);

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
        { status: 400 },
      );
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
          public_id: extractPublicId(image),
        };
      }
    }

    // ── Update product ────────────────────────────────────────────────────────

    const resolvedProductType =
      productType ?? existingProduct.productType ?? "solo";

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price:
          price !== undefined
            ? price === null
              ? null
              : parseFloat(price)
            : existingProduct.price,
        image: finalImage,
        category,
        subcategory: subcategory ?? null,

        info: info ?? "Product info is not available",
        description: description ?? "Product description is not available",

        isSignature,
        isPopular,
        productType: resolvedProductType,
        paxCount: resolvedProductType === "set" ? (paxCount ?? null) : null,
        includedItems:
          resolvedProductType !== "solo"
            ? (includedItems ?? []).map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
                label: item.label ?? null,
              }))
            : [],
      },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Product already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update product" },
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

    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Product deleted successfully!" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
