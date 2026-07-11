import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { Branch } from "@/models/Branch";
import { NextResponse, NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";
import "@/models/Category";
import "@/models/SubCategory";
import { extractPublicId } from "@/utils/extractImagePublicId";
import { requireAdmin, requireSuperAdmin } from "@/lib/getAuth";
import { buildPaginationMeta, parseRequestQuery } from "@/utils/query-helpers";
import { getActiveProductDiscountPreviews } from "@/lib/product-promotions/product-promotion.application";
import { getAPIError } from "@/lib/getApiError";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const modifierItemSchema = z.object({
  product: z.string().min(1, "Modifier item must reference a product"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
  label: z.string().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  snapshotName: z.string().nullable().optional(),
  snapshotPrice: z.coerce.number().nullable().optional(),
});

const modifierGroupSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Group name is required"),
  required: z.boolean().default(true),
  minSelect: z.coerce.number().int().min(1).default(1),
  maxSelect: z.coerce.number().int().min(1).default(1),
  items: z.array(modifierItemSchema).min(1, "Group must have at least one item"),
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
  modifierGroups: z.array(modifierGroupSchema).optional().default([]),
});

const productCreateSchema = productBaseSchema
  .refine((data) => data.image || data.imageFile, {
    message: "Image is required",
    path: ["image"],
  })
  .refine(
    (data) => {
      if (data.productType !== "solo") {
        return (data.modifierGroups ?? []).length > 0;
      }
      return true;
    },
    {
      message: "Combo and Set products must have at least one modifier group",
      path: ["modifierGroups"],
    },
  );

type ModifierProductAggregate = {
  _id?: { toString: () => string };
  name?: string;
  price?: number | null;
  image?: {
    url?: string;
    public_id?: string;
  };
  productType?: string;
};

type ModifierItemAggregate = {
  product?: ModifierProductAggregate | null;
  quantity: number;
  label?: string | null;
  price?: number | null;
  snapshotName?: string | null;
  snapshotPrice?: number | null;
};

type ModifierGroupAggregate = {
  _id?: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  items: ModifierItemAggregate[];
};

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
      exactFields: ["productType", "status", "category", "subcategory"],
      searchFields: ["name", "description", "productType", "price"],
      defaultSort: { "category.position": 1, createdAt: -1 },
    });

    const searchParams = new URL(request.url).searchParams;
    const categoryName = searchParams.get("categoryName");
    const subcategoryName = searchParams.get("subcategoryName");

    const postLookupMatch: any = {};
    if (categoryName) postLookupMatch["category.name"] = categoryName;
    if (subcategoryName) postLookupMatch["subcategory.name"] = subcategoryName;

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
      ...(Object.keys(postLookupMatch).length ? [{ $match: postLookupMatch }] : []),
      {
        $lookup: {
          from: "products",
          localField: "modifierGroups.items.product",
          foreignField: "_id",
          as: "_modifierProducts",
        },
      },
      {
        $addFields: {
          modifierGroups: {
            $map: {
              input: { $ifNull: ["$modifierGroups", []] },
              as: "group",
              in: {
                _id: "$$group._id",
                name: "$$group.name",
                required: "$$group.required",
                minSelect: "$$group.minSelect",
                maxSelect: "$$group.maxSelect",
                items: {
                  $map: {
                    input: { $ifNull: ["$$group.items", []] },
                    as: "item",
                    in: {
                      product: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$_modifierProducts",
                              as: "p",
                              cond: { $eq: ["$$p._id", "$$item.product"] },
                            },
                          },
                          0,
                        ],
                      },
                      quantity: "$$item.quantity",
                      label: "$$item.label",
                      price: "$$item.price",
                      snapshotName: "$$item.snapshotName",
                      snapshotPrice: "$$item.snapshotPrice",
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $unset: "_modifierProducts" },
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
    const discountPreviews = await getActiveProductDiscountPreviews(
      products
        .filter(
          (product) =>
            product._id &&
            Number.isFinite(product.price) &&
            product.price > 0,
        )
        .map((product) => ({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        })),
    );
    const normalizedProducts = products.map((product) => ({
      ...product,
      _id: product._id?.toString(),
      category: product.category
        ? {
            ...product.category,
            _id: product.category._id?.toString(),
          }
        : null,
      subcategory: product.subcategory?._id
        ? {
            ...product.subcategory,
            _id: product.subcategory._id?.toString(),
          }
        : null,
      modifierGroups:
        product.modifierGroups?.map((group: ModifierGroupAggregate) => ({
          _id: group._id?.toString(),
          name: group.name,
          required: group.required,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          items:
            group.items?.map((item: ModifierItemAggregate) => ({
              product: item.product
                ? {
                    _id: item.product._id?.toString() || "",
                    name: item.product.name || "",
                    price: item.product.price ?? null,
                    image: {
                      url: item.product.image?.url || "",
                      public_id: item.product.image?.public_id || "",
                    },
                    productType: item.product.productType || "solo",
                  }
                : "",
              quantity: item.quantity,
              label: item.label,
              price: item.price,
              snapshotName: item.snapshotName,
              snapshotPrice: item.snapshotPrice,
            })) || [],
        })) || [],
      activeProductDiscount:
        discountPreviews.get(product._id.toString()) ?? null,
    }));

    // Return paginated envelope instead of bare array
    return NextResponse.json(
      {
        data: normalizedProducts,
        pagination: buildPaginationMeta(total, page, limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("GET /products error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch products"}, { status: 500 });
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
      modifierGroups,
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
      modifierGroups:
        productType !== "solo"
          ? (modifierGroups ?? []).map((group) => ({
              name: group.name,
              required: group.required ?? true,
              minSelect: group.minSelect ?? 1,
              maxSelect: group.maxSelect ?? 1,
              items: (group.items ?? []).map((item) => ({
                product: item.product,
                quantity: item.quantity ?? 1,
                label: item.label ?? null,
                price: item.price ?? null,
                snapshotName: item.snapshotName ?? item.label ?? null,
                snapshotPrice: item.snapshotPrice ?? null,
              })),
            }))
          : [],
    });

    if (!product && uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    // Create unlimited inventory records for all active branches
    const activeBranches = await Branch.find({ isActive: true }).select("_id");
    if (activeBranches.length > 0) {
      await Inventory.insertMany(
        activeBranches.map((branch) => ({
          productId: product._id,
          branchId: branch._id,
          quantity: 20,
        })),
        { ordered: false },
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {

    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    return getAPIError(error, 500, {fallbackMessage: "Failed to create product"});
  }
}
