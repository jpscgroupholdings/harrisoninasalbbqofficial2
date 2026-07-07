/* ── Product Group Card ──────────────────────────────────────────────────── */

import { OrderItemImage } from "@/app/customer/components/OrderItemImage";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import StarRatingDisplay from "@/components/ui/StarRating";
import { useMemo, useState } from "react";
import { formatDate } from "@/helper/formatDate";
import { ProductGroup } from "../types/product-review.types";

/** Card showing one product with aggregated ratings and expandable preview of recent reviews */
export const ProductGroupCard = ({
  group,
  onViewDetails,
}: {
  group: ProductGroup;
  onViewDetails: () => void;
}) => {
  const [showReviews, setShowReviews] = useState(false);

  /* Top 3 most recent reviews as preview */
  const previewEntries = useMemo(
    () =>
      [...group.entries]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3),
    [group.entries],
  );

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex-1">
        {/* ── Product header: image + name + rating ────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0">
            <OrderItemImage image={group.image ?? ""} name={group.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-800 truncate">
                {group.name}
              </h3>
              {!group.productId && (
                <span className="text-xs text-red-400 italic">(Deleted)</span>
              )}
            </div>
            {group.totalRatings > 0 ? (
              <div className="flex items-center gap-2">
                <StarRatingDisplay rating={group.averageItemRating} size={16} />
                <span className="text-sm font-semibold text-gray-600">
                  {group.averageItemRating.toFixed(1)}/5
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No ratings — only comments
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {group.totalRatings} rating(s) · {group.entries.length} review(s)
            </p>
          </div>
        </div>
        {/* ── Expandable review previews ───────────────────────────────────── */}
        <div className="px-5 pb-3">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-color-500 hover:text-brand-color-600 cursor-pointer mb-2"
          >
            {showReviews ? (
              <DynamicIcon name="ChevronUp" size={13} />
            ) : (
              <DynamicIcon name="ChevronDown" size={13} />
            )}
            {showReviews
              ? "Hide reviews"
              : `Show ${previewEntries.length} recent review(s)`}
          </button>
          {showReviews && (
            <div className="space-y-2">
              {previewEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-color-50 flex items-center justify-center shrink-0 border border-brand-color-100">
                    <DynamicIcon
                      name="User"
                      size={12}
                      className="text-brand-color-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {entry.isAnonymous
                          ? "Anonymous"
                          : entry.customerName || "Guest"}
                      </span>
                      {entry.itemRating !== null && (
                        <StarRatingDisplay
                          rating={entry.itemRating}
                          size={12}
                        />
                      )}
                    </div>
                    {entry.itemComment && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {entry.itemComment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {group.entries.length > 3 && (
                <p className="text-xs text-gray-400 italic text-center">
                  + {group.entries.length - 3} more review(s) — click View
                  Details to see all
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions row ──────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={onViewDetails}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        >
          <DynamicIcon name="FileText" size={13} /> View Details
        </button>
      </div>
    </div>
  );
};