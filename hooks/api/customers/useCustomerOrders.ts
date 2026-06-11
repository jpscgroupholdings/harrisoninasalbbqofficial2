import { toast } from "sonner";
import { OrderParams, useOrderBase, useOrdersBase, useUpdateOrder } from "../shared/useOrdersBase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateOrderPayload,
  CreateOrderResponse,
} from "@/types/OrderTypes";
import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";

const userType = "customer"

export const useCustomerOrders = (params?: OrderParams) => {
  return useOrdersBase(userType, params);
};

export const useCustomerOrder = (id: string) => {
  return useOrderBase(userType, id);
};

export const useCustomerUpdateOrder = () => {
  return useUpdateOrder(userType);
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  /*
   * Returns → CreateOrderResponse
   * Throws → Error
   * Accepts → CreateOrderPayload
   */
  return useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    retry: false,
    mutationFn: (payload: CreateOrderPayload) =>
      apiClient.post<CreateOrderResponse>("/paymaya/checkout", payload),

    onError: (error: any) => {
      let userMessage = "Unable to create payment link. Please try again.";

      const data = error?.details;

      if (data?.error?.errors && Array.isArray(data.error.errors)) {
        const errorDetails = data.error.errors[0];

        switch (errorDetails.code) {
          case "parameter_below_minimum":
            userMessage = "Order must be at least ₱100.";
            break;
          case "parameter_above_maximum":
            userMessage = "Order exceeds maximum limit.";
            break;
          case "parameter_invalid":
            userMessage = "Invalid payment details.";
            break;
          case "authentication_failed":
            userMessage = "Payment service unavailable.";
            break;
          default:
            if (errorDetails.detail?.length < 100) {
              userMessage = errorDetails.detail;
            }
        }
      } else if (data?.error) {
        userMessage = typeof data.error === "string" ? data.error : userMessage;
      }

      toast.error(userMessage);
    },

    onSuccess: () => {
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export type OrderSummary = {
  pending: number;
  preparing: number;
  dispatch: number;
  completed: number;
  cancelled: number;
  total: number;
};
 
export const useCustomerOrderSummary = () => {

  const {data: session} = authClient.useSession();

  return useQuery<OrderSummary, Error>({
    queryKey: ["orders", "summary"],
    queryFn: () => apiClient.get("/orders/summary"),
    staleTime: 30_000,
    enabled: !!session?.user,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

