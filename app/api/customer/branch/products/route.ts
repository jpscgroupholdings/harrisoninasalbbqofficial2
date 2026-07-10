import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { STOCK_STATUSES } from "@/types/inventory_types";
import "@/lib/registerModels";
import { buildPaginationMeta } from "@/utils/query-helpers";
import { getActiveProductDiscountPreviews } from "@/lib/product-promotions/product-promotion.application";
import { fetchBranch } from "@/services/branch/branch.service";

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

/**
 * GET /api/branch/products
 *
 * Fetch all products with stock information for a specific branch
 * Customer-facing endpoint to display products available in selected branch
 *
 * Query Parameters:
 * - branchId (required): The branch ID to fetch products for
 *
 * Example:
 * GET /api/branch/products?branchId=507f1f77bcf86cd799439011
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        {
          error: "Missing branchId",
          message: "Please provide branchId as query parameter",
          example: "/api/branch/products?branchId=507f1f77bcf86cd799439011",
        },
        { status: 400 },
      );
    }

    console.log(`[BRANCH_PRODUCTS] Fetching products for branch: ${branchId}`);

    // Verify the branch is available for ordering via shared service
    try {
      await fetchBranch(branchId);
    } catch (err: any) {
      const status = err.message.includes("not found") ? 404 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const categoryName = searchParams.get("categoryName");
    const subcategoryName = searchParams.get("subcategoryName");
    const skip = (page - 1) * limit;

    // Use aggregation pipeline to get products sorted by category position
    const basePipeline: any[] = [
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

      ...(categoryName ? [{ $match: { "category.name": categoryName } }] : []),
      ...(subcategoryName
        ? [{ $match: { "subcategory.name": subcategoryName } }]
        : []),

      // Lookup inventory for this specific branch
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
                    { $eq: ["$branchId", { $toObjectId: branchId }] }, // match branch
                  ],
                },
              },
            },
            { $project: { quantity: 1, reorderLevel: 1 } },
          ],
          as: "inventory",
        },
      },

      // ✅ Flatten inventory array into fields (default to 0 if no record)
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

      // ✅ Compute stock status
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$quantity", 0] },
                  then: STOCK_STATUSES.OUT_OF_STOCK,
                },
                {
                  case: { $lte: ["$quantity", "$reorderLevel"] },
                  then: STOCK_STATUSES.LOW_STOCK,
                },
              ],
              default: STOCK_STATUSES.IN_STOCK,
            },
          },
        },
      },

      // ✅ Sort by category position first, then quantity descending within each category
      { $sort: { "category.position": 1, quantity: -1 } },

      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          image: 1,
          info: 1,
          description: 1,
          category: { _id: "$category._id", name: "$category.name" },
          subcategory: { _id: "$subcategory._id", name: "$subcategory.name" },
          productType: 1,
          modifierGroups: 1,
          paxCount: 1,
          isPopular: 1,
          isSignature: 1,
          quantity: 1,
          status: 1,
        },
      },
    ];

    const [countResult, products] = await Promise.all([
      Product.aggregate([...basePipeline, { $count: "total" }]),
      Product.aggregate([...basePipeline, { $skip: skip }, { $limit: limit }]),
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

    // Merge inventory data into each product (preserving category.position sort order)
    const result = products.map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: {
        url: product.image?.url || "",
        public_id: product.image?.public_id || "",
      },
      info: product.info || "Product info is not available",
      description:
        product.description || "Product description is not available",
      category: {
        _id: product.category?._id?.toString() || "",
        name: product.category?.name || "Uncategorized",
      },
      subcategory: product.subcategory?._id
        ? {
            _id: product.subcategory._id.toString(),
            name: product.subcategory.name,
          }
        : null,
      productType: product.productType || "solo",
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
      paxCount: product.paxCount,
      isPopular: product.isPopular || false,
      isSignature: product.isSignature || false,
      activeProductDiscount:
        discountPreviews.get(product._id.toString()) ?? null,
      quantity: product.quantity,
      status: product.status,
    }));

    return NextResponse.json(
      {
        success: true,
        branchId,
        data: result,
        pagination: buildPaginationMeta(total, page, limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[BRANCH_PRODUCTS] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: error.message || "An error occurred while fetching products",
      },
      { status: 500 },
    );
  }
}
