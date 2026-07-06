"use client";

import React, { useState, useMemo } from "react";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import {
  useAdminReviews,
  useToggleReviewVisibility,
} from "@/hooks/api/admin/useAdminReviews";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useBranchName } from "@/app/admin/hooks/useBranchName";
import PermissionGuard from "@/lib/PermissionGuard";
import { formatDate } from "@/helper/formatDate";
import { ReviewListItem } from "@/types/ReviewTypes";
import LoadingPage from "@/components/ui/LoadingPage";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import StarRatingDisplay, {
  RatingDistributionBar,
} from "@/components/ui/StarRating";
import ReviewStatsCard from "../components/ReviewStatsCard";
import { OrderItemImage } from "@/app/customer/components/OrderItemImage";
import { useReviewFilters } from "../hooks/useReviewFilter";
import ReviewFilter from "../components/ReviewFilter";

/** Single review entry scoped to one product within an order review */
interface ProductGroupEntry {
  orderReviewId: string;
  orderId: string;
  customerName: string | null;
  isAnonymous: boolean;
  customerEmail: string | null;
  branchName: string | null;
  itemRating: number | null;
  itemComment: string | null;
  orderRating: number;
  orderComment: string | null;
  isVisible: boolean;
  createdAt: string;
}

/** Aggregated product group with all review entries for one product */
interface ProductGroup {
  groupKey: string;
  productId: string | null;
  name: string;
  image: string | null;
  entries: ProductGroupEntry[];
  averageItemRating: number;
  totalRatings: number;
}

/**
 * Flatten itemReviews across all order reviews and group by productId (or name
 * for deleted products where productId is null). Each group aggregates all
 * customer feedback for a single product.
 */
function groupByProduct(reviews: ReviewListItem[]): ProductGroup[] {
  const groupMap = new Map<string, ProductGroup>();

  for (const review of reviews) {
    if (!review.itemReviews || review.itemReviews.length === 0) continue;

    for (const item of review.itemReviews) {
      /* Skip items the customer completely skipped (no rating AND no comment) */
      if (item.rating === null && item.comment === null) continue;

      const groupKey = item.productId || `deleted-${item.name}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupKey,
          productId: item.productId,
          name: item.name,
          image: item.image || null,
          entries: [],
          averageItemRating: 0,
          totalRatings: 0,
        });
      }

      const group = groupMap.get(groupKey)!;
      /* Use first non-null image across all entries for this product */
      if (!group.image && item.image) {
        group.image = item.image;
      }

      group.entries.push({
        orderReviewId: review._id,
        orderId: review.orderId,
        customerName: review.customerName,
        isAnonymous: review.isAnonymous,
        customerEmail: review.customerEmail,
        branchName: review.branchName,
        itemRating: item.rating,
        itemComment: item.comment,
        orderRating: review.rating,
        orderComment: review.comment,
        isVisible: review.isVisible,
        createdAt: review.createdAt,
      });
    }
  }

  /* Compute average rating per group (only from entries with non-null ratings) */
  const groups = Array.from(groupMap.values());
  for (const group of groups) {
    const rated = group.entries.filter((e) => e.itemRating !== null);
    group.totalRatings = rated.length;
    group.averageItemRating =
      rated.length > 0
        ? rated.reduce((sum, e) => sum + (e.itemRating ?? 0), 0) / rated.length
        : 0;
  }

  /* Sort by average rating descending — best-rated products first */
  groups.sort((a, b) => b.averageItemRating - a.averageItemRating);

  return groups;
}

/* ── Product View Details Modal ──────────────────────────────────────────── */

/** Modal showing all review entries for a specific product */
const ProductViewDetailsModal = ({
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

/* ── Product Group Card ──────────────────────────────────────────────────── */

/** Card showing one product with aggregated ratings and expandable preview of recent reviews */
const ProductGroupCard = ({
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

/* ── Main Page Component ─────────────────────────────────────────────────── */

const ProductReviewsPage = () => {
  const reviewFilter = useReviewFilters();

  const {
    jumpToPage,
    currentPage,
    appliedSearch,
    ratingFilter,
    visibilityFilter,
  } = reviewFilter;

  const { selectedBranchId } = useAdminBranchContext();
  const { branchName } = useBranchName();

  // reset pagination on branch change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    jumpToPage(1);
  }, [selectedBranchId]);

  const [limit, setLimit] = useState(20);
  const [viewingGroup, setViewingGroup] = useState<ProductGroup | null>(null);

  /* Build query params (order-level API, displayed as product-level) */
  const queryParams: Record<string, string | number | undefined> = {
    page: currentPage,
    limit,
    search: appliedSearch,
    rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
    isVisible: visibilityFilter === "all" ? undefined : visibilityFilter,
    branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
  };

  const { data, isPending } = useAdminReviews(queryParams);

  const pagination = data?.pagination;

  /* Group itemReviews by product across all fetched order reviews */
  const groups = useMemo(() => groupByProduct(data?.data ?? []), [data]);

  /* Compute product-level stats from grouped data on current page */
  const productStats = useMemo(() => {
    if (groups.length === 0) return null;

    const allRatings = groups.flatMap((g) =>
      g.entries.filter((e) => e.itemRating !== null).map((e) => e.itemRating!),
    );
    const avg =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const r of allRatings) {
      distribution[r] = (distribution[r] || 0) + 1;
    }

    return {
      averageRating: avg,
      totalProducts: groups.length,
      totalRatings: allRatings.length,
      ratingDistribution: distribution,
    };
  }, [groups]);

  if (isPending) {
    return <LoadingPage />;
  }

  return (
    <section className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Product Reviews —{" "}
          <span className="text-brand-color-500">{branchName}</span>
        </h1>
        <p className="text-gray-500">
          View product-level ratings and feedback grouped by item
        </p>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}

      <ReviewStatsCard
        stats={{
          averageRating: productStats?.averageRating ?? 0,
          totalCount: productStats?.totalProducts ?? 0,
          ratingDistribution: productStats?.ratingDistribution ?? {},
          hasRatings: (productStats?.totalRatings ?? 0) > 0 ? true : false,
        }}
        averageLabel="Average Product Rating"
        totalLabel="Products Reviewed"
      />

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <ReviewFilter filters={reviewFilter} />

      {/* ── Product cards ───────────────────────────────────────────────── */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <ProductGroupCard
              key={group.groupKey}
              group={group}
              onViewDetails={() => setViewingGroup(group)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <DynamicIcon
            name="Package"
            size={32}
            className="text-gray-300 mx-auto mb-3"
          />
          <p className="text-sm text-gray-500">
            No product-level reviews found for this branch.
          </p>
        </div>
      )}

      {/* ── Pagination (order-level, default limit=20 for better product coverage) */}
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={limit}
          onPageChange={jumpToPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            jumpToPage(1);
          }}
        />
      )}

      {/* ── View Details modal ──────────────────────────────────────────── */}
      {viewingGroup && (
        <ProductViewDetailsModal
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
        />
      )}
    </section>
  );
};

export default ProductReviewsPage;
