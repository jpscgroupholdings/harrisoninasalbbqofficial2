import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";
import { buildQueryString } from "@/utils/buildQueryString";
import { PaginationMeta } from "@/utils/query-helpers";
import { OrderStatus } from "@/types/orderConstants";
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
  guest: "/customer/orders/guest?ref=",
} as const;

export type OrderParams = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: OrderStatus | OrderStatus[];
  branchId?: "all" | string;
  productType?: string;
};

export function useOrdersBase(
  type: keyof typeof ORDER_ENDPOINTS,
  params?: OrderParams,
) {
  const { data: session, isPending } = authClient.useSession();
  const isCustomer = type === "customer";

  return useQuery<ProductResponse, Error>({
    queryKey: ["orders", type, params],
    queryFn: () =>
      apiClient.get(`${ORDER_ENDPOINTS[type]}${buildQueryString(params)}`),
    staleTime: 30000,
    retry: false,
    enabled: isCustomer ? !!session?.user && !isPending : true,
    refetchOnWindowFocus: false,
  });
}

export function useOrderBase(type: keyof typeof ORDER_ENDPOINTS, id: string) {
  return useQuery<OrderType, Error>({
    queryKey: ["orders", type, id],
    queryFn: async () => {
      try {
        return await apiClient.get(`${ORDER_ENDPOINTS[type]}${id}`);
      } catch (error: any) {
        throw new Error(error?.message ?? "Failed to fetch order");
      }
    },
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
