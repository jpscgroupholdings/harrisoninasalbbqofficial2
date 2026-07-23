import { apiClient } from "@/lib/apiClient";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { useQuery } from "@tanstack/react-query";

export type RecommendationProduct = Omit<BranchProduct, "modifierGroups">;

export type RecommendationsResponse = {
  success: boolean;
  data: RecommendationProduct[];
};

type UseRecommendationsOptions = {
  branchId: string | null;
  excludeIds?: string[];
  categoryId?: string | null;
  limit?: number;
  enabled?: boolean;
};

/**
 * Fetches popular products computed from completed orders.
 * Used by the ProductRecommendations component across checkout, product pages, and modals.
 */
export const useRecommendations = ({
  branchId,
  excludeIds = [],
  categoryId,
  limit = 6,
  enabled = true,
}: UseRecommendationsOptions) => {
  return useQuery({
    queryKey: [
      "recommendations",
      branchId,
      excludeIds.sort().join(","),
      categoryId,
      limit,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ branchId: branchId! });
      if (excludeIds.length > 0) {
        params.set("excludeIds", excludeIds.join(","));
      }
      if (categoryId) {
        params.set("categoryId", categoryId);
      }
      params.set("limit", String(limit));

      return apiClient.get<RecommendationsResponse>(
        `/customer/products/recommendations?${params.toString()}`,
      );
    },
    enabled: !!branchId && enabled,
    staleTime: 5 * 60_000, // 5 minutes — popularity doesn't change rapidly
  });
};
