import { apiClient } from "@/lib/apiClient";
import { buildQueryString } from "@/lib/buildQueryString";
import { PaginationMeta } from "@/lib/query-helpers";
import {
  OrderType,
  UpdateOrderPayLoad,
  UpdateOrderResponse,
} from "@/types/OrderTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProductResponse {
  data: OrderType[];
  pagination: PaginationMeta;
}

const ORDER_ENDPOINTS = {
  admin: "/admin/orders/",
  customer: "/customer/orders/",
} as const;

export type OrderParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  productType?: string;
};

export function useOrdersBase(
  type: keyof typeof ORDER_ENDPOINTS,
  params?: OrderParams,
) {
  return useQuery<ProductResponse, Error>({
    queryKey: ["orders", type, params],
    queryFn: () =>
      apiClient.get(`${ORDER_ENDPOINTS[type]}${buildQueryString(params)}`),
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useOrderBase(type: keyof typeof ORDER_ENDPOINTS, id: string) {
  return useQuery<OrderType, Error>({
    queryKey: ["orders", type, id],
    queryFn: () => apiClient.get(`${ORDER_ENDPOINTS[type]}${id}`),
    staleTime: 30000,
    enabled: !!id,
  });
}

export const useUpdateOrder = (type: keyof typeof ORDER_ENDPOINTS) => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateOrderResponse,
    Error,
    { id: string; data: UpdateOrderPayLoad }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderPayLoad }) =>
      apiClient.patch(`${ORDER_ENDPOINTS[type]}${id}`, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
