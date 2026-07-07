'use client'

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { TextareaField } from "@/components/ui/FormComponents";
import Pagination from "@/components/ui/Pagination";
import StarRatingDisplay from "@/components/ui/StarRating";
import { formatDate } from "@/helper/formatDate";
import {
  useEditReview,
  useHelpfulVote,
  useProductReviews,
} from "@/hooks/api/customers/useProductReviews";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const ProductReviewsPage = ({ productId }: { productId: string }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // Authenticated session (for helpful votes and edit own review)
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Product reviews data
  const {
    data: reviewsData,
    isPending,
    isError,
  } = useProductReviews(productId, { page: currentPage, limit: 10 });

  const helpfulVote = useHelpfulVote();
  const editReview = useEditReview();

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editHovered, setEditHovered] = useState(0);

  // Derive product name from first review's itemReview
  const productName =
    reviewsData?.data?.[0]?.itemReviews?.find(
      (ir) => ir.productId === productId,
    )?.name ?? "Product";

  const reviews = reviewsData?.data ?? [];
  const averageRating = reviewsData?.averageRating ?? 0;
  const totalReviews = reviewsData?.totalReviews ?? 0;
  const pagination = reviewsData?.pagination;

  // Handlers

  const handleHelpfulVote = (reviewId: string, isHelpful: boolean) => {
    if (!userId) {
      toast.warning("Please sign in to vote on reviews");
      return;
    }
    helpfulVote.mutate({ reviewId, payload: { isHelpful } });
  };

  const openEditModal = (
    reviewId: string,
    rating: number,
    comment: string | null,
  ) => {
    setEditingReviewId(reviewId);
    setEditRating(rating);
    setEditComment(comment ?? "");
  };

  const closeEditModal = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
    setEditHovered(0);
  };

  /**
   * Submit edit from the product page — only updates the item-level review
   * for this specific product. Order-level rating/comment are NOT overwritten.
   * The route merges by productId, so other items in the same order stay untouched.
   */
  const submitEdit = () => {
    if (!editingReviewId || editRating === 0) return;

    editReview.mutate(
      {
        reviewId: editingReviewId,
        payload: {
          itemReviews: [
            {
              productId,
              rating: editRating,
              comment: editComment.trim() || null,
            },
          ],
        },
      },
      { onSuccess: closeEditModal },
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">Failed to load reviews.</p>
          <button
            onClick={() => router.back()}
            className="text-brand-color-500 font-semibold hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* ── Header ── */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-color-500 transition-colors mb-3"
          >
            <DynamicIcon name="ArrowLeft" size={16} />
            Back
          </button>

          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Reviews for {productName}
          </h1>

          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRatingDisplay rating={averageRating} size={18} />
              <span className="text-lg font-bold text-gray-800">
                {averageRating}
              </span>
              <span className="text-sm text-gray-500">
                ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>

        {/* ── Reviews list ── */}
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-5 animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <DynamicIcon
              name="Star"
              size={32}
              className="text-gray-300 mx-auto mb-3"
            />
            <p className="text-gray-600 font-medium">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to share your experience with this product!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              // Find the itemReview for this specific product
              const productItem = review.itemReviews.find(
                (ir) => ir.productId === productId,
              );
              const displayRating = productItem?.rating ?? review.rating;
              const displayComment = productItem?.comment ?? review.comment;

              // Check if current user owns this review
              const isOwnReview =
                userId && review.customerId === userId && !review.isAnonymous;

              // Check if current user has already voted
              const existingVote = review.helpfulVotes?.find(
                (v) => v.userId === userId,
              );

              return (
                <div
                  key={review._id}
                  className="bg-white rounded-lg shadow-sm p-5 space-y-3"
                >
                  {/* ── Review header: customer + rating + date ── */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Customer avatar placeholder */}
                      <div className="w-9 h-9 rounded-full bg-brand-color-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-brand-color-600">
                          {review.isAnonymous
                            ? "A"
                            : (review.customerName ?? "G")[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {review.isAnonymous
                            ? "Anonymous"
                            : (review.customerName ?? "Guest")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StarRatingDisplay rating={displayRating} size={13} />
                          <span className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit button for own reviews */}
                    {isOwnReview && (
                      <button
                        onClick={() =>
                          openEditModal(
                            review._id,
                            displayRating,
                            displayComment,
                          )
                        }
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-color-500 transition-colors shrink-0"
                        aria-label="Edit your review"
                      >
                        <DynamicIcon name="Pencil" size={14} />
                        Edit
                      </button>
                    )}
                  </div>

                  {/* ── Review comment ── */}
                  {displayComment && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {displayComment}
                    </p>
                  )}

                  {/* ── Item-level detail (if product has specific rating/comment) ── */}
                  {productItem &&
                    productItem.rating &&
                    productItem.rating !== review.rating && (
                      <div className="text-xs text-gray-400 italic">
                        Product rating: {productItem.rating}/5
                        {productItem.comment &&
                          productItem.comment !== review.comment && (
                            <span> — "{productItem.comment}"</span>
                          )}
                      </div>
                    )}

                  {/* ── Admin reply ── */}
                  {review.reply && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-blue-700 mb-1">
                        Response from {review.reply.staffName}
                      </p>
                      <p className="text-sm text-blue-800">
                        {review.reply.comment}
                      </p>
                    </div>
                  )}

                  {/* ── Helpful votes ── */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Was this helpful?
                    </span>

                    {/* Like */}
                    <button
                      onClick={() => handleHelpfulVote(review._id, true)}
                      disabled={helpfulVote.isPending}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                        existingVote?.isHelpful === true
                          ? "bg-green-100 text-green-700 font-semibold"
                          : "text-gray-500 hover:bg-green-50 hover:text-green-600"
                      } disabled:opacity-50`}
                      aria-label="Mark as helpful"
                    >
                      <DynamicIcon name="ThumbsUp" size={14} />
                      {review.helpfulCount ?? 0}
                    </button>

                    {/* Dislike */}
                    <button
                      onClick={() => handleHelpfulVote(review._id, false)}
                      disabled={helpfulVote.isPending}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                        existingVote?.isHelpful === false
                          ? "bg-red-100 text-red-700 font-semibold"
                          : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                      } disabled:opacity-50`}
                      aria-label="Mark as not helpful"
                    >
                      <DynamicIcon name="ThumbsDown" size={14} />
                      {review.notHelpfulCount ?? 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ── Edit Review Modal ── */}
      {editingReviewId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Your Review</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <DynamicIcon name="X" size={20} />
              </button>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditRating(s)}
                  onMouseEnter={() => setEditHovered(s)}
                  onMouseLeave={() => setEditHovered(0)}
                  className="transition-transform focus:outline-none active:scale-125"
                >
                  <DynamicIcon
                    name="Star"
                    size={28}
                    className={
                      s <= (editHovered || editRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Comment */}

            <TextareaField
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Update your comment (optional)"
              rows={4}
              maxLength={500}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={submitEdit}
                disabled={editRating === 0 || editReview.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#c13500] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <DynamicIcon name="Send" size={16} />
                {editReview.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsPage;
