import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Review } from "@/models/Review";
import { ReviewBody } from "@/types/ReviewTypes";
import { getAPIError } from "@/lib/getApiError";
import { ORDER_STATUSES } from "@/types/orderConstants";

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
      const belongsToOrder = order.items.some(
        (i: any) => i.productId.toString() === item.productId,
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

    return NextResponse.json(
      { message: "Review submitted successfully", reviewId: review._id },
      { status: 201 },
    );
  } catch (error: any) {
    // Duplicate key — review already exists at DB level
    if (error?.code === 11000) {
      return getAPIError("This order has already been reviewed", 409);
    }

    console.error("[POST /review]", error);
    return getAPIError(error, 500);
  }
}
