import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextResponse, NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";
import "@/models/Category";
import "@/models/SubCategory";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const includedItemSchema = z.object({
  product: z.string().min(1, "Included item must reference a product"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  label: z.string().nullable().optional(),
});

const productBaseSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(60, "Name must be less than 60 characters"),
  price: z.coerce.number().positive().nullable().optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().nullable().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  image: z.string().optional(),
  imageFile: z.string().optional(),
  isSignature: z.boolean().optional().default(false),
  isPopular: z.boolean().optional().default(false),
  productType: z.enum(["solo", "combo", "set"]).default("solo"),
  paxCount: z.coerce.number().int().positive().nullable().optional(),
  includedItems: z.array(includedItemSchema).optional().default([]),
});

const productCreateSchema = productBaseSchema
  .refine((data) => data.image || data.imageFile, {
    message: "Image is required",
    path: ["image"],
  })
  .refine(
    (data) => {
      if (data.productType !== "solo") {
        return (data.includedItems ?? []).length > 0;
      }
      return true;
    },
    {
      message: "Combo and Set products must have at least one included item",
      path: ["includedItems"],
    }
  );

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "0");

    const matchStage: Record<string, any> = {};
    if (typeFilter) matchStage.productType = typeFilter;

    const products = await Product.aggregate([
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
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
          as: "_includedProducts",
        },
      },
      {
        $addFields: {
          includedItems: {
            $map: {
              input: "$includedItems",
              as: "item",
              in: {
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$_includedProducts",
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
      { $unset: "_includedProducts" },
      { $sort: { "category.position": 1, createdAt: -1 } },
      ...(limit > 0 ? [{ $limit: limit }] : []),
    ]);

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("GET /products error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let uploadResult: any;

  try {
    await connectDB();

    const body = await request.json();
    const validated = productCreateSchema.parse(body);

    const {
      name,
      price,
      category,
      subcategory,
      stock,
      imageFile,
      image,
      isSignature,
      isPopular,
      productType,
      paxCount,
      includedItems,
    } = validated;

    // ── Upload image ────────────────────────────────────────────────────────

    let finalImage = { url: "", public_id: "" };

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
    } else if (image) {
      finalImage = { url: image, public_id: "" };
    }

    // ── Create ──────────────────────────────────────────────────────────────

    const product = await Product.create({
      name,
      price: price ?? null,
      image: finalImage,
      category,                          // ✅ ObjectId string — no normalization
      subcategory: subcategory ?? null,
      stock,
      isSignature,
      isPopular,
      productType,
      paxCount: productType === "set" ? (paxCount ?? null) : null,
      includedItems:
        productType !== "solo"
          ? (includedItems ?? []).map((item) => ({
              product: item.product,
              quantity: item.quantity,
              label: item.label ?? null,
            }))
          : [],
    });

    if (!product && uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("POST /products error:", error);

    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Product already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}