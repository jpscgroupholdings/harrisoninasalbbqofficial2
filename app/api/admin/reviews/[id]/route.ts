/**
 * PATCH /api/admin/reviews/[id]
 *
 * Supports two actions via body.action:
 *    - "reply" : Admin/Staff reply to a review
 *    - "toggleVisibility": Flip review visibility for moderation
 */

import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { Review } from "@/models/Review";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!getValidObjectId(id)) {
      return getAPIError("Invalid review id", 400);
    }

    await connectDB();

    const admin = await requireAdmin(req);

    if (!canAccess(admin.role, "reviews.update")) {
      return getAPIError("Forbidden", 403);
    }

    const body = await req.json();
    const action = body.action;

    if (!action) {
      return getAPIError(
        "Missing action field. Reply or toggleVisibility",
        400,
      );
    }

    // Reply Action
    if (action === "reply") {
      const { comment } = body;

      if (
        !comment ||
        typeof comment !== "string" ||
        comment.trim().length === 0
      ) {
        return getAPIError("Reply comment is required", 400);
      }
      if (comment.trim().length > 500) {
        return getAPIError("Reply comment must be at most 500 characters", 400);
      }

      const updated = await Review.findByIdAndUpdate(
        id,
        {
          $set: {
            reply: {
              staffId: admin._id,
              staffName: `${admin.firstName} ${admin.lastName}`,
              comment: comment.trim(),
            },
          },
        },
        {
          new: true,
        },
      ).lean();

      if (!updated) {
        return getAPIError("Review not found", 404);
      }

      return NextResponse.json({ message: "Reply added successfully" });
    }

    // Toggle visibility action
    if (action === "toggleVisibility") {
      const review = await Review.findById(id);

      if (!review) {
        return getAPIError("Review not found", 404);
      }

      review.isVisible = !review.isVisible;
      await review.save();

      return NextResponse.json({
        message: `Review visibility set to ${review.isVisible}`,
        isVisible: review.isVisible,
      });
    }

    return getAPIError(`Unknown action ${action}`, 400);
  } catch (error) {
    return getAPIError(error, 500, {fallbackMessage: "Failed to update review"});
  }
}
