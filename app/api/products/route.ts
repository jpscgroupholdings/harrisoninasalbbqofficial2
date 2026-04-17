import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextResponse, NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";
import "@/models/Category";
import "@/models/SubCategory";
import { extractPublicId } from "@/helper/extractImagePublicId";
import { requireAdmin, requireSuperAdmin } from "@/lib/getAuth";
import { buildPaginationMeta, parseRequestQuery } from "@/lib/query-helpers";

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
  image: z.string().optional(),
  imageFile: z.string().optional(),

  // ✅ NEW: Creative content fields
  info: z
    .string()
    .max(200, "Info must be less than 200 characters")
    .optional()
    .default("Product info is not available"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .default("Product description is not available"),

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
    },
  );

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Fetch products with optional filtering and population
 *
 * Query params:
 * - type: Filter by productType (solo, combo, set)
 * - limit: Limit results (0 = no limit)
 */

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { page, limit, skip, sort, match } = parseRequestQuery(request, {
      exactFields: ["productType", "status"],
      searchFields: ["name", "description", "productType",  "price"],
      defaultSort: { "category.position": 1, createdAt: -1 },
    });

    const basePipeline: any[] = [
      // Use the merged match from parseRequestQuery
      ...(Object.keys(match).length ? [{ $match: match }] : []),
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
    ];

    // Run count + paginated data in parallel
    const [countResult, products] = await Promise.all([
      Product.aggregate([...basePipeline, { $count: "total" }]),
      Product.aggregate([
        ...basePipeline,
        { $sort: sort }, // dyanamic sort from parseRequestQuery
        ...(limit > 0 ? [{ $skip: skip }, { $limit: limit }] : []),
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;

    // Return paginated envelope instead of bare array
    return NextResponse.json(
      {
        data: products,
        pagination: buildPaginationMeta(total, page, limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("GET /products error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Create a new product
 *
 */
export async function POST(request: NextRequest) {
  let uploadResult: any;

  try {
    await connectDB();
    await requireSuperAdmin(request);

    const body = await request.json();
    const validated = productCreateSchema.parse(body);

    const {
      name,
      price,
      category,
      subcategory,
      imageFile,
      image,
      info,
      description,
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
      finalImage = {
        url: image,
        public_id: extractPublicId(image),
      };
    }

    // ── Create ──────────────────────────────────────────────────────────────

    const product = await Product.create({
      name,
      price: price ?? null,
      image: finalImage,
      category,
      subcategory: subcategory ?? null,

      info: info ?? "Product info is not available",
      description: description ?? "Product description is not available",
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

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 },
    );
  }
}
