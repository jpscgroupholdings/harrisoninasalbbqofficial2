import { ReviewListItem } from "@/types/ReviewTypes";
import { ProductGroup } from "../types/product-review.types";

/**
 * Flatten itemReviews across all order reviews and group by productId (or name
 * for deleted products where productId is null). Each group aggregates all
 * customer feedback for a single product.
 */
export function groupByProduct(reviews: ReviewListItem[]): ProductGroup[] {
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