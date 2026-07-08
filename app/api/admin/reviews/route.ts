/**
 * GET /api/admin/reviews
 *
 * List all reviews with pagination, search, filters, and stats.
 * Resolves customer names (handles anonymous/guest), branch names.
 * Supports filters: rating, isVisible, branchId,
 */

import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { Review } from "@/models/Review";
import { STAFF_ROLES } from "@/types/staff";
import { buildPaginationMeta, parseRequestQuery } from "@/utils/query-helpers";
import { PipelineStage } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin(req);

    if (!canAccess(admin.role, "reviews.read")) {
      return getAPIError("Forbidden", 403);
    }

    const { page, limit, skip, sort, match } = parseRequestQuery(req, {
      exactFields: ["rating", "isVisible"],
      searchFields: ["comment"],
      defaultLimit: 20,
      maxLimit: 50,
      defaultSort: { createdAt: -1 },
    });

    const filter: Record<string, any> = { ...match };

    // Branch scoping: admin role can only access their own branch
    const requestBranchId = req.nextUrl.searchParams.get("branchId");

    if (admin.role !== STAFF_ROLES.ADMIN) {
      if (requestBranchId && requestBranchId !== "all") {
        const branchObjectId = getValidObjectId(requestBranchId);
        if (!branchObjectId) {
          return getAPIError("Invalid branch id", 400);
        }

        filter.branchId = branchObjectId;
      }
    } else {
      if (!admin.branch) {
        return getAPIError("No branch assigned", 403);
      }

      const assignedBranchId = getValidObjectId(admin.branch);
      if (!assignedBranchId) {
        return getAPIError("Invalid assigned branch", 403);
      }

      filter.branchId = assignedBranchId;
    }

    // Convert string "true"/"false" to boolean for isVisible if present
    if (typeof filter.isVisible === "string") {
      filter.isVisible = filter.isVisible === "true";
    }

    // Convert rating to number if present
    if (filter.rating) {
      filter.rating = Number(filter.rating);
    }

    // Stats (unfiltered by search, only by branch scope)
    const statsFilter: Record<string, any> = {};
    if (filter.branchId) statsFilter.branchId = filter.branchId;

    const statsPipeline: PipelineStage[] = [
      { $match: statsFilter },
      {
        // Runs multiple independent sub-queries on the same filtered data at the same time
        $facet: {
          averageRating: [
            {
              $group: {
                _id: null,
                avg: { $avg: "$rating" },
                total: { $sum: 1 },
              },
            },
          ],

          ratingDistribution: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ];

    const [statsResult] = await Review.aggregate(statsPipeline);

    const avgRatingDoc = statsResult.averageRating[0];
    const averageRating = avgRatingDoc?.avg
      ? Math.round(avgRatingDoc.avg * 10) / 10
      : 0;
    const totalReviews = avgRatingDoc?.total ?? 0;

    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i < 5; i++) ratingDistribution[i] = 0;
    for (const entry of statsResult.ratingDistribution) {
      ratingDistribution[entry._id] = entry.count;
    }

    // Main query with customer/branch lookups
    const pipeline: any[] = [
      { $match: filter },

      //Lookup customer from better auth user collection
      {
        $lookup: {
          from: "user",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      // Lookup branch
      {
        $lookup: {
          from: "branches",
          localField: "branchId",
          foreignField: "_id",
          as: "branchDoc",
        },
      },

      // Add resolves fields
      {
        $addFields: {
          customerName: {
            $cond: [
              { $eq: ["$isAnonymous", true] },
              null,
              {
                $cond: [
                  { $eq: ["$customerId", null] },
                  null, // guest order - no linked customer
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

          customerEmail: {
            $cond: [
              { $eq: ["$isAnonymous", true] },
              null,
              {
                $cond: [
                  { $eq: ["$customerId", null] },
                  null,
                  { $arrayElemAt: ["$customerDoc.email", 0] },
                ],
              },
            ],
          },

          branchName: {
            $ifNull: [{ $arrayElemAt: ["$branchDoc.name", 0] }, null],
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

      // Remove lookup arrays
      {
        $project: {
          customerDoc: 0,
          branchDoc: 0,
        },
      },

      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const data = await Review.aggregate(pipeline);

    // Total count for pagination (same filter, no skip/limit)
    const total = await Review.countDocuments(filter);

    return NextResponse.json({
      data,
      pagination: buildPaginationMeta(total, page, limit),
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized!" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("GET /api/admin/reviews error:", error);

    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch reviews",
    });
  }
}
