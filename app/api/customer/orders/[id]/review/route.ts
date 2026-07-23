import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Review } from "@/models/Review";
import { ReviewBody } from "@/types/ReviewTypes";
import { getAPIError } from "@/lib/getApiError";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { notifyNewReview } from "@/services/notification.service";

// Lean shapes returned by Mongoose .lean() — ObjectIds stay as ObjectId objects

interface LeanItemReview {
  productId: Types.ObjectId | null;
  name: string;
  image: string | null;
  rating: number | null;
  comment: string | null;
}

interface LeanOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: Types.ObjectId;
  quantity: number;
}

// ─── GET /api/customer/orders/[id]/review ────────────────────────────────────
// Fetches the review for a given order, if one exists.
// Only the order owner (authenticated customer or guest) can access it.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;

    await connectDB();

    const session = await auth.api.getSession({ headers: await headers() });
    const sessionUserId = session?.session?.userId ?? null;

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return getAPIError("Order not found", 404);
    }

    // Authorization: authenticated user must own the order; guest orders are accessible by anyone with the orderId
    if (sessionUserId && order.customerId) {
      if (order.customerId.toString() !== sessionUserId) {
        return getAPIError("Forbidden", 403);
      }
    }

    const review = await Review.findOne({ orderId }).lean();
    if (!review) {
      return getAPIError("No review found for this order", 404);
    }

    return NextResponse.json({
      _id: review._id.toString(),
      orderId: review.orderId.toString(),
      customerId: review.customerId?.toString() ?? null,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      itemReviews: (review.itemReviews as LeanItemReview[]).map((ir) => ({
        productId: ir.productId?.toString() ?? null,
        name: ir.name,
        image: ir.image ?? null,
        rating: ir.rating ?? null,
        comment: ir.comment ?? null,
      })),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    });
  } catch (error: unknown) {
    console.error("[GET /review]", error);
    return getAPIError(error, 500, {fallbackMessage: "Failed to fetch review on this order"});
  }
}

// ─── POST /api/customer/orders/[id]/review ────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;

    await connectDB();

    // ── 1. Resolve identity (auth user OR guest) ──────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    const sessionUserId = session?.session?.userId ?? null;

    // ── 2. Fetch the order ────────────────────────────────────────────────
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return getAPIError("Order not found", 404);
    }

    // ── 3. Authorization check ────────────────────────────────────────────
    // Authenticated user: their userId must match order.customerId
    // Guest: order.customerId is null — anyone with the orderId can review
    //        (orderId is a non-guessable MongoDB ObjectId, good enough for guests)
    if (sessionUserId && order.customerId) {
      if (order.customerId.toString() !== sessionUserId) {
        return getAPIError("Forbidden", 403);
      }
    }

    // ── 4. Guard: only completed, unreviewed orders ───────────────────────
    if (order.status !== ORDER_STATUSES.COMPLETED) {
      return getAPIError("You can only review completed orders", 400);
    }

    if (order.isReviewed) {
      return getAPIError("This order has already been reviewed", 409);
    }

    // ── 5. Validate body ──────────────────────────────────────────────────
    const body: ReviewBody = await req.json();

    const { rating, comment, isAnonymous = false, itemReviews = [] } = body;

    if (!rating || rating < 1 || rating > 5) {
      return getAPIError("Rating must be between 1 and 5", 422);
    }

    // Validate each item review that has a rating
    for (const item of itemReviews) {
      if (item.rating != null && (item.rating < 1 || item.rating > 5)) {
        return getAPIError(`Invalid rating for item: ${item.name}`, 422);
      }

      // Ensure the productId actually belongs to this order
      const belongsToOrder = (order.items as LeanOrderItem[]).some(
        (i) => i.productId.toString() === item.productId,
      );
      if (!belongsToOrder) {
        return getAPIError(
          `Item ${item.name} does not belong to this order`,
          422,
        );
      }
    }

    // ── 6. Create Review + patch Order atomically ─────────────────────────
    const [review] = await Promise.all([
      Review.create({
        orderId: order._id,
        customerId: sessionUserId ?? null,
        branchId: order.branchId,
        rating,
        comment: comment?.trim() || null,
        isAnonymous,
        itemReviews: itemReviews.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image ?? null,
          rating: i.rating ?? null,
          comment: i.comment?.trim() ?? null,
        })),
      }),
      Order.findByIdAndUpdate(orderId, {
        isReviewed: true,
        reviewedAt: new Date(),
      }),
    ]);

    // Notify admins about the new review (fire-and-forget)
    notifyNewReview({
      orderId: order._id.toString(),
      branchId: order.branchId.toString(),
      referenceNumber: order.paymentInfo?.referenceNumber ?? "",
      rating,
      comment: comment?.trim() || null,
    });

    return NextResponse.json(
      { message: "Review submitted successfully", reviewId: review._id },
      { status: 201 },
    );
  } catch (error: unknown) {
    // MongoDB duplicate key — review already exists at DB level (code 11000)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return getAPIError("This order has already been reviewed", 409);
    }

    console.error("[POST /review]", error);
    return getAPIError(error, 500, {fallbackMessage: "Failed to create review"});
  }
}
