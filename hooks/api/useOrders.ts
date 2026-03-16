import { apiClient } from "@/lib/apiClient";
import {
  CreateOrderPayload,
  CreateOrderResponse,
  OrderType,
  UpdateOrderPayLoad,
  UpdateOrderResponse,
} from "@/types/OrderTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_PRIORITY: Record<OrderType["status"], number> = {
  paid:       0, // needs immediate attention
  pending:    1,
  preparing:  2,
  ready:      3,
  dispatched: 4,
  completed:  5,
  cancelled:  6,
  failed: 7,
  expired: 8
};


export const useOrders = () => {
  return useQuery<OrderType[]>({
    // unique query
    queryKey: ["orders"],
    queryFn: () => apiClient.get("/orders"),
    staleTime: 30000,
    select: (data) => 
      [...data].sort((a, b) => {
        const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];

        // if same status, keep most recent first
        if(priorityDiff !== 0) return priorityDiff;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
  });
};

export const useOrder = (id: string) => {
  return useQuery<OrderType>({
    queryKey: ["orders", id],
    queryFn: () => apiClient.get(`/orders/${id}`),
    staleTime: 30000,
  });
};

// ============================================
// MUTATIONS (CREATE/UPDATE/DELETE data)
// ============================================

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  /*
   * Returns → CreateOrderResponse
   * Throws → Error
   * Accepts → CreateOrderPayload
   */
  return useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    retry: false,
    mutationFn: async (payload) => {
      const response = await fetch("/api/paymaya/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse user-friendly error messages from PayMongo
        let userMessage = "Unable to create payment link. Please try again.";

        if (data.error?.errors && Array.isArray(data.error.errors)) {
          const errorDetails = data.error.errors[0];

          // Handle specific PayMongo error codes
          switch (errorDetails.code) {
            case "parameter_below_minimum":
              userMessage = `Order amount is below the minimum requirement of ₱100.00. Please add more items to your cart.`;
              break;
            case "parameter_above_maximum":
              userMessage = `Order amount exceeds the maximum limit. Please contact support.`;
              break;
            case "parameter_invalid":
              userMessage = `Invalid payment details. Please check your information and try again.`;
              break;
            case "authentication_failed":
              userMessage = `Payment service is temporarily unavailable. Please try again later or contact support.`;
              break;
            default:
              // Show the actual error detail if it's user-friendly
              if (errorDetails.detail && errorDetails.detail.length < 100) {
                userMessage = errorDetails.detail;
              }
          }
        } else if (data.error) {
          // Fallback for simple error messages
          userMessage =
            typeof data.error === "string" ? data.error : userMessage;
        }

        throw new Error(userMessage);
      }

      return data;
    },

    onSuccess: () => {
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateOrderResponse,
    Error,
    { id: string; data: UpdateOrderPayLoad }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update order!");
      }

      return result;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
