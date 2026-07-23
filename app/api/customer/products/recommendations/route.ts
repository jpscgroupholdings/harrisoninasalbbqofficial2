import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { Order } from "@/models/Orders";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { STOCK_STATUSES } from "@/types/inventory_types";
import "@/lib/registerModels";
import { getActiveProductDiscountPreviews } from "@/lib/product-promotions/product-promotion.application";
import { getAPIError } from "@/lib/getApiError";
import mongoose, { PipelineStage } from "mongoose";
import { fetchBranch } from "@/services/branch/branch.service";
import { getValidObjectIds, getValidObjectId } from "@/helper/getValidObjectIds";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

/**
 * GET /api/customer/products/recommendations
 *
 * Returns popular products for the recommendation section.
 * Popularity is computed from completed orders in the last 90 days (quantity sold).
 * Results are filtered by branch inventory and exclude provided product IDs.
 *
 * Query Parameters:
 * - branchId   (required) — branch to check stock availability
 * - excludeIds (optional) — comma-separated product IDs to exclude
 * - categoryId (optional) — filter to same category for relevance
 * - limit      (optional) — max products to return (default 6, max 12)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const excludeIdsRaw = searchParams.get("excludeIds") || "";
    const categoryId = searchParams.get("categoryId");
    const limitParam = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

    if (!branchId) {
      return getAPIError("Missing branchId", 400, {
        extra: { message: "Please provide branchId as query parameter" },
      });
    }

    // Verify branch exists and is active
    try {
      await fetchBranch(branchId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const status = message.includes("not found") ? 404 : 403;
      return getAPIError(err, status);
    }

    // Parse exclude IDs into valid ObjectIds
    const excludeObjectIds = getValidObjectIds(excludeIdsRaw.split(","))
      .map((id) => new mongoose.Types.ObjectId(id));

    // ── Step 1: Compute product popularity from completed orders ─────────
    // Look back 90 days to keep the aggregation bounded as orders grow
    const POPULARITY_WINDOW_DAYS = 90;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - POPULARITY_WINDOW_DAYS);

    const popularityPipeline: PipelineStage[] = [
      {
        $match: {
          status: ORDER_STATUSES.COMPLETED,
          createdAt: { $gte: windowStart },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: MAX_LIMIT * 5 },
    ];

    const popularProducts = await Order.aggregate(popularityPipeline);

    if (popularProducts.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build a sorted list of product IDs ranked by popularity
    const rankedProductIds = popularProducts
      .map((p) => p._id)
      .filter((id): id is mongoose.Types.ObjectId => id != null);

    // ── Step 2: Fetch products with branch inventory ─────────────────────
    const idMatch: Record<string, unknown> = { $in: rankedProductIds };
    if (excludeObjectIds.length > 0) {
      idMatch.$nin = excludeObjectIds;
    }

    const matchConditions: Record<string, unknown> = { _id: idMatch };

    const categoryOid = getValidObjectId(categoryId);
    if (categoryOid) matchConditions.category = categoryOid;

    const products = await Product.aggregate([
      { $match: matchConditions },
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

      // Branch inventory lookup
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
                    { $eq: ["$branchId", new mongoose.Types.ObjectId(branchId)] },
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
          quantity: { $ifNull: [{ $arrayElemAt: ["$inventory.quantity", 0] }, 0] },
          reorderLevel: { $ifNull: [{ $arrayElemAt: ["$inventory.reorderLevel", 0] }, 10] },
        },
      },
      { $unset: "inventory" },

      // Compute stock status
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $eq: ["$quantity", 0] }, then: STOCK_STATUSES.OUT_OF_STOCK },
                { case: { $lte: ["$quantity", "$reorderLevel"] }, then: STOCK_STATUSES.LOW_STOCK },
              ],
              default: STOCK_STATUSES.IN_STOCK,
            },
          },
        },
      },

      // Only return in-stock products
      { $match: { status: { $ne: STOCK_STATUSES.OUT_OF_STOCK } } },

      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          image: 1,
          info: 1,
          description: 1,
          category: { _id: "$category._id", name: "$category.name" },
          subcategory: {
            _id: "$subcategory._id",
            name: "$subcategory.name",
          },
          productType: 1,
          paxCount: 1,
          isPopular: 1,
          isSignature: 1,
          quantity: 1,
          status: 1,
        },
      },
    ]);

    // ── Step 3: Sort results by popularity (preserve order from Step 1) ──
    const popularityRank = new Map<string, number>();
    rankedProductIds.forEach((id, index) => {
      popularityRank.set(id.toString(), index);
    });

    products.sort((a, b) => {
      const rankA = popularityRank.get(a._id.toString()) ?? Infinity;
      const rankB = popularityRank.get(b._id.toString()) ?? Infinity;
      return rankA - rankB;
    });

    const sliced = products.slice(0, limit);

    // ── Step 4: Attach active discount previews ──────────────────────────
    const discountPreviews = await getActiveProductDiscountPreviews(
      sliced
        .filter((p) => p._id && Number.isFinite(p.price) && p.price > 0)
        .map((p) => ({
          productId: p._id,
          name: p.name,
          price: p.price,
          quantity: 1,
        })),
    );

    const result = sliced.map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: {
        url: product.image?.url || "",
        public_id: product.image?.public_id || "",
      },
      info: product.info || "Product info is not available",
      description: product.description || "Product description is not available",
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
      paxCount: product.paxCount,
      isPopular: product.isPopular || false,
      isSignature: product.isSignature || false,
      activeProductDiscount:
        discountPreviews.get(product._id.toString()) ?? null,
      quantity: product.quantity,
      status: product.status,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[RECOMMENDATIONS] Error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch product recommendations",
    });
  }
}
