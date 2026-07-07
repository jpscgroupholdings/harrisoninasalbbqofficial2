/* ── Product View Details Modal ──────────────────────────────────────────── */

import { useToggleReviewVisibility } from "@/hooks/api/admin/useAdminReviews";
import Modal from "@/components/ui/Modal";
import { OrderItemImage } from "@/app/customer/components/OrderItemImage";
import StarRatingDisplay, {
  RatingDistributionBar,
} from "@/components/ui/StarRating";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { formatDate } from "@/helper/formatDate";
import PermissionGuard from "@/lib/PermissionGuard";
import { ProductGroup } from "../types/product-review.types";

/** Modal showing all review entries for a specific product */
export const ProductViewDetailsModal = ({
  group,
  onClose,
}: {
  group: ProductGroup;
  onClose: () => void;
}) => {
  const toggleVisibilityMutation = useToggleReviewVisibility();
  /* Rating distribution for this specific product */
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const entry of group.entries) {
    if (entry.itemRating !== null) {
      distribution[entry.itemRating] =
        (distribution[entry.itemRating] || 0) + 1;
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={`Reviews for ${group.name}`}
      subTitle={`${group.averageItemRating.toFixed(1)}/5 average — ${group.totalRatings} rating(s)`}
      contentClassName="!p-0"
    >
      <div className="divide-y divide-gray-100">
        {/* ── Product header ──────────────────────────────────────────────── */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0">
              <OrderItemImage image={group.image ?? ""} name={group.name} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {group.name}
                {!group.productId && (
                  <span className="text-sm text-red-400 italic ml-2">
                    (Deleted Product)
                  </span>
                )}
              </h3>
              {group.totalRatings > 0 ? (
                <div className="flex items-center gap-2 mt-1">
                  <StarRatingDisplay
                    rating={group.averageItemRating}
                    size={16}
                  />
                  <span className="text-xs text-gray-500">
                    {group.totalRatings} rating(s) · {group.entries.length}{" "}
                    review entry(s)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mt-1">
                  No ratings — only comments · {group.entries.length} review
                  entry(s)
                </p>
              )}
            </div>
          </div>

          {/* Rating distribution for this product */}
          {group.totalRatings > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Item Rating Distribution
              </p>
              <RatingDistributionBar
                distribution={distribution}
                total={group.totalRatings}
              />
            </div>
          )}
        </div>

        {/* ── All review entries ─────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Customer Reviews ({group.entries.length})
          </p>
          <p className="text-xs text-gray-400 italic mb-3">
            Note: Visibility toggle affects the entire order review, not just
            this product entry.
          </p>
          <div className="space-y-3">
            {group.entries.map((entry, idx) => {
              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${
                    !entry.isVisible
                      ? "border-red-200 bg-red-50/30"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  {/* Customer + rating row */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-color-50 flex items-center justify-center shrink-0 border border-brand-color-200">
                      <DynamicIcon
                        name="User"
                        size={14}
                        className="text-brand-color-500"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {entry.isAnonymous
                            ? "Anonymous"
                            : entry.customerName || "Guest"}
                        </span>
                      </div>
                      {entry.itemRating !== null && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <StarRatingDisplay
                            rating={entry.itemRating}
                            size={12}
                          />
                          <span className="text-xs text-gray-500">
                            {entry.itemRating}/5
                          </span>
                        </div>
                      )}
                      {entry.itemComment ? (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {entry.itemComment}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No comment
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Context row: date, branch, order rating, visibility */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <DynamicIcon name="Calendar" size={12} />{" "}
                      {formatDate(entry.createdAt)}
                    </span>
                    {entry.branchName && (
                      <span className="flex items-center gap-1">
                        <DynamicIcon name="MapPin" size={12} />{" "}
                        {entry.branchName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-500">
                      Order rated {entry.orderRating}/5
                    </span>

                    {/* Visibility status + toggle */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <PermissionGuard permission="reviews.update">
                        <button
                          onClick={() =>
                            toggleVisibilityMutation.mutate(entry.orderReviewId)
                          }
                          disabled={toggleVisibilityMutation.isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          title="Toggle visibility (affects entire order review)"
                          data-tooltip-id="app-tooltip"
                          data-tooltip-content={
                            "Toggle visibility (affects entire order review)"
                          }
                        >
                          {entry.isVisible
                            ? "Visible"
                            : toggleVisibilityMutation.isPending
                              ? "Updating..."
                              : "Hidden"}
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
