"use client";

import React, { useState, useMemo } from "react";
import Pagination from "@/components/ui/Pagination";
import { useAdminReviews } from "@/hooks/api/admin/useAdminReviews";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useBranchName } from "@/app/admin/hooks/useBranchName";
import LoadingPage from "@/components/ui/LoadingPage";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import ReviewStatsCard from "../components/ReviewStatsCard";
import { useReviewFilters } from "../hooks/useReviewFilter";
import ReviewFilter from "../components/ReviewFilter";
import { groupByProduct } from "./functions/groupByProduct";
import { ProductViewDetailsModal } from "./components/ProductViewDetailsModal";
import { ProductGroupCard } from "./components/ProductGroupCard";
import { ProductGroup } from "./types/product-review.types";

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
