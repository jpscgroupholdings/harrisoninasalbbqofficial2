/**
 * PATCH /api/customer/reviews/[id]
 *
 * Allow an authenticated customer to edit their own review.
 * Only the review author (customerId match) can edit.
 *
 * Supports two edit contexts:
 *
 * 1. **Item-level edit** (from product page):
 *    Sends only `itemReviews` with the specific productId.
 *    The route merges by productId — only that item is updated,
 *    other items in the same order are untouched.
 *    Order-level rating/comment are NOT changed.
 *    Example: { itemReviews: [{ productId: "item1", rating: 5, comment: "..." }] }
 *
 * 2. **Full-order edit** (from order review page):
 *    Sends `rating`, `comment`, `isAnonymous`, and optionally `itemReviews`
 *    for multiple items. Each itemReview is individually merged.
 *    Items not included in the payload stay untouched.
 *    Example: { rating: 5, comment: "...", itemReviews: [{ productId: "item1", ... }, { productId: "item2", ... }] }
 *
 * All fields are optional — only provided fields are updated.
 */

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Review } from "@/models/Review";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";
import { Order } from "@/models/Orders";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reviewId } = await params;

    if (!getValidObjectId(reviewId)) {
      return getAPIError("Invalid review id", 400);
    }

    await connectDB();

    // ── Auth check: only authenticated customers ──────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.userId) {
      return getAPIError("Authentication requried", 401);
    }

    const userId = session.session.userId;

    if (!getValidObjectId(userId)) {
      return getAPIError("Invalid user id", 400);
    }

    // ── Find the review ──────────────────────────────────────────────────
    const review = await Review.findById(reviewId);

    if (!review) {
      return getAPIError("Review not found", 404);
    }

    // ── Ownership check ──────────────────────────────────────────────────
    // Only the original author can edit; guest reviews (customerId null) cannot be edited
    if (!review.customerId || review.customerId.toString() !== userId) {
      return getAPIError("Forbidden", 403);
    }

    // ── Validate and apply edits ──────────────────────────────────────────
    const body = await req.json();

    if (body.rating != null) {
      const rating = Number(body.rating);
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return getAPIError("Rating must be an integer between 1 and 5", 422);
      }
      review.rating = rating;
    }

    if (body.comment != null) {
      if (typeof body.comment !== "string" || body.comment.length > 1000) {
        return getAPIError(
          "Comment must be a string up to 1000 characters",
          422,
        );
      }
      review.comment = body.comment.trim() || null;
    }

    if (body.isAnonymous != null) {
      if (typeof body.isAnonymous !== "boolean") {
        return getAPIError("isAnonymous must be a boolean");
      }
      review.isAnonymous = body.isAnonymous;
    }

    // Edit items under the order
    if (body.itemReviews != null) {
      if (!Array.isArray(body.itemReviews)) {
        return getAPIError("itemReviews must be an array");
      }

      // input validation
      for (const item of body.itemReviews) {
        if (!item.productId) {
          return getAPIError("productId is required for each itemReview", 422);
        }

        if (item.rating != null && (item.rating < 1 || item.rating > 5)) {
          return getAPIError(`Invalid rating for item ${item.name}`);
        }
      }

      // Fetch the order so we can validate that each incoming productId
      // actually belongs to this order (prevents fake/unrelated productIds
      // from being attached as item reviews)
      const order = await Order.findById(review.orderId).select("items");
      if (!order) {
        return getAPIError("Associated order not found", 404);
      }

      // Map productId → order item snapshot (name, image) for lookup when appending
      const orderItemMap = new Map<string, { name: string; image?: string }>();
      for (const item of order.items) {
        orderItemMap.set(item.productId.toString(), {
          name: item.name,
          image: item.image,
        });
      }

      const validProductIds = new Set(orderItemMap.keys());

      for (const incoming of body.itemReviews) {
        if (!validProductIds.has(incoming.productId)) {
          return getAPIError(
            `Product ${incoming.productId} was not part of this order`,
            422,
          );
        }

        const existingIndex = review.itemReviews.findIndex(
          (ir: any) => ir.productId?.toString() === incoming.productId,
        );

        if (existingIndex >= 0) {
          // Merge into existing entry — untouched fields keep their old value
          const existing = review.itemReviews[existingIndex];
          if (incoming.rating != null) existing.rating = incoming.rating;
          if (incoming.comment !== undefined)
            existing.comment = incoming.comment?.trim() || null;
        } else {
          // New item review — append (customer reviewing an item they previously skipped)
          // Name/image come from the order snapshot, not the payload, to prevent spoofing
          const orderItem = orderItemMap.get(incoming.productId)!;
          review.itemReviews.push({
            productId: incoming.productId,
            name: orderItem.name,
            image: orderItem.image ?? null,
            rating: incoming.rating ?? null,
            comment: incoming.comment?.trim() ?? null,
          });
        }
      }

      review.markModified("itemReviews");
    }

    await review.save();

    return NextResponse.json({
      message: "Review updated successfully",
      reviewId: review._id.toString(),
      rating: review.rating,
    });
  } catch (error: any) {
    console.error("PATCH /api/customer/reviews/[id] error:", error);
    return getAPIError(error, 500, {fallbackMessage: "Failed to update review"});
  }
}
