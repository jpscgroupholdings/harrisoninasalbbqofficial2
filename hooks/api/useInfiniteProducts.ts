// hooks/api/useProductsInfinite.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Product } from "@/types/products";
import { PaginationMeta } from "@/lib/query-helpers";

interface ProductResponse {
  data: Product[];
  pagination: PaginationMeta;
}

interface ProductParams {
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  productType?: string;
  categoryName?: string;     // ← new
  subcategoryName?: string;  // ← new
  enabled: boolean
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!filtered.length) return "";
  return "?" + new URLSearchParams(Object.fromEntries(filtered)).toString();
}

export const useProductsInfinite = (params?: ProductParams) => {
    const { enabled = true, ...queryParams } = params ?? {};

  return useInfiniteQuery<ProductResponse, Error>({
    queryKey: ["products-infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<ProductResponse>(
        `/products${buildQueryString({ ...params, page: pageParam, limit: params?.limit ?? 20 })}`
      ),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
     enabled, 
  });
};