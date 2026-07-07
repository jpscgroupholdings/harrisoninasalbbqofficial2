/**
 * POST /api/customer/reviews/[id]/helpful
 *
 * Toggle a helpful vote (like/dislike) on a review.
 * Only authenticated customers can vote.
 * If the user already voted the same way, the vote is removed (toggle off).
 * If the user voted the opposite way, it flips to the new vote.
 */

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Review } from "@/models/Review";
import mongoose from "mongoose";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";

export async function POST(
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

    const body = await req.json();
    const { isHelpful } = body;

    if (typeof isHelpful !== "boolean") {
      return getAPIError("isHelpful must be true or false", 400);
    }

    // ── Find the review ──────────────────────────────────────────────────
    const review = await Review.findById(reviewId);

    if (!review) {
      return getAPIError("Review not found", 404);
    }

    if (!review.isVisible) {
      return getAPIError("Review not found", 404);
    }

    // ── Toggle vote logic ────────────────────────────────────────────────
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const existingVoteIndex = review.helpfulVotes.findIndex(
      (v: any) => v.userId.toString() === userId,
    );

    if (existingVoteIndex >= 0) {
      const existingVote = review.helpfulVotes[existingVoteIndex];

      if (existingVote.isHelpful === isHelpful) {
        // Same vote — remove it (toggle off)
        review.helpfulVotes.splice(existingVoteIndex, 1);
      } else {
        // Opposite vote — flip it
        review.helpfulVotes[existingVoteIndex].isHelpful = isHelpful;
      }
    } else {
      // No existing vote — add new one
      review.helpfulVotes.push({ userId: userObjectId, isHelpful });
    }

    await review.save();

    // Compute counts after the change
    const helpfulCount = review.helpfulVotes.filter(
      (v: any) => v.isHelpful === true,
    ).length;
    const notHelpfulCount = review.helpfulVotes.filter(
      (v: any) => v.isHelpful === false,
    ).length;

    // Determine the user's current vote state
    const currentVote = review.helpfulVotes.find(
      (v: any) => v.userId.toString() === userId,
    );
    const userVote = currentVote ? currentVote.isHelpful : null;

    return NextResponse.json({
      message: "Vote updated",
      helpfulCount,
      notHelpfulCount,
      userVote,
    });
  } catch (error: any) {
    console.error("POST /api/customer/reviews/[id]/helpful error:", error);
    return getAPIError(error, 500, "Failed to update vote");
  }
}
