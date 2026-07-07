/**
 * GET /api/customer/products/[id]/reviews
 *
 * List reviews that contain an itemReview for the given product.
 * Only shows visible reviews (isVisible: true).
 * Resolves customer names (handles anonymous/guest).
 * Returns pagination, average rating, and total reviews for the product.
 */

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Review } from "@/models/Review";
import { getAPIError } from "@/lib/getApiError";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import { buildPaginationMeta, parseRequestQuery } from "@/utils/query-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    if (!getValidObjectId(productId)) {
      return getAPIError("Invalid product id", 400);
    }

    await connectDB();

    const productObjectId = getValidObjectId(productId);

    const { page, limit, skip, sort } = parseRequestQuery(request, {
      defaultSort: { createdAt: -1 },
      defaultLimit: 10,
      maxLimit: 50,
    });

    // Filter: visible reviews that have an itemReview matching this product
    const matchFilter = {
      isVisible: true,
      itemReviews: {
        $elemMatch: { productId: productObjectId },
      },
    };

    // ── Stats: average rating and total count for this product ──────────
    // The rating per review for a product comes from the itemReview.rating,
    // not the order-level rating. We compute from itemReviews.
    const statsPipeline = [
      { $match: matchFilter },
      { $unwind: "$itemReviews" },
      {
        $match: {
          "itemReviews.productId": productObjectId,
          "itemReviews.rating": { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$itemReviews.rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ];

    const [statsResult] = await Review.aggregate(statsPipeline);
    const averageRating = statsResult?.averageRating
      ? Math.round(statsResult.averageRating * 10) / 10
      : 0;
    const totalReviews = statsResult?.totalReviews ?? 0;

    // ── Main query ──────────────────────────────────────────────────────
    const pipeline: any[] = [
      { $match: matchFilter },

      // Lookup customer
      {
        $lookup: {
          from: "user",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDoc",
        },
      },

      // Add resolved fields
      {
        $addFields: {
          customerName: {
            $cond: [
              { $eq: ["$isAnonymous", true] },
              null,
              {
                $cond: [
                  { $eq: ["$customerId", null] },
                  null,
                  {
                    $let: {
                      vars: { cust: { $arrayElemAt: ["$customerDoc", 0] } },
                      in: {
                        $cond: [
                          { $ifNull: ["$$cust.name", false] },
                          "$$cust.name",
                          {
                            $concat: [
                              { $ifNull: ["$$cust.firstName", ""] },
                              " ",
                              { $ifNull: ["$$cust.lastName", ""] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
          helpfulCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$helpfulVotes", []] },
                as: "v",
                cond: { $eq: ["$$v.isHelpful", true] },
              },
            },
          },
          notHelpfulCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$helpfulVotes", []] },
                as: "v",
                cond: { $eq: ["$$v.isHelpful", false] },
              },
            },
          },
        },
      },

      {
        $project: {
          customerDoc: 0,
        },
      },

      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const data = await Review.aggregate(pipeline);

    const total = await Review.countDocuments(matchFilter);

    return NextResponse.json({
      data,
      pagination: buildPaginationMeta(total, page, limit),
      averageRating,
      totalReviews,
    });
  } catch (error: any) {
    console.error("GET /api/customer/products/[id]/reviews error:", error);
    return getAPIError(error, 500, "Failed to fetch product reviews");
  }
}
