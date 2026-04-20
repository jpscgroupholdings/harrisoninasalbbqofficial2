import { apiClient } from "@/lib/apiClient";
import { Product } from "@/types/products";
import { StockStatus } from "@/types/inventory_types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { buildQueryString } from "@/lib/buildQueryString";
import { PaginationMeta } from "@/lib/query-helpers";

export type BranchProduct = Product & {
  quantity?: number;
  status?: StockStatus;
};

export type BranchProductResponse = {
  success: boolean;
  branchId: string;
  data: BranchProduct[];
  pagination: PaginationMeta
};


// hooks/api/useBranchProductInfinite.ts
export const useBranchProductInfinite = (branchId: string, params?: {
  categoryName?: string;
  subcategoryName?: string;
  limit?: number;
  enabled: boolean
}) => {
  return useInfiniteQuery({
    queryKey: ["branch-products-infinite", branchId, params],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<BranchProductResponse>(`/customer/branch/products${buildQueryString({
        branchId,
        page: pageParam,
        limit: params?.limit ?? 1,
        categoryName: params?.categoryName,
        subcategoryName: params?.subcategoryName,
      })}`),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!branchId && (params?.enabled ?? true),
    staleTime: 30_000,
  });
};
