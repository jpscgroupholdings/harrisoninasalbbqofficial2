/**
 * ORDER HOOKS (React Query)
 *
 * Uses orderConstants.ts for status priority, transitions, and UI config
 * Single source of truth eliminates duplication
 */

import { apiClient } from "@/lib/apiClient";
import {
  isValidOrderStatus,
  ORDER_ACTION_CONFIG,
  OrderStatus,
  STATUS_PRIORITY,
  STATUS_TRANSITIONS,
} from "@/types/orderConstants";
import {
  CreateOrderPayload,
  CreateOrderResponse,
  OrdersApiResponse,
  OrderType,
  UpdateOrderPayLoad,
  UpdateOrderResponse,
} from "@/types/OrderTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const ORDER_ENDPOINTS = {
  admin: "/admin/orders",
  customer: "/orders/my",
} as const;

export const useOrders = ({ type }: { type: keyof typeof ORDER_ENDPOINTS }) => {
  return useQuery<OrdersApiResponse, Error, OrderType[]>({
    queryKey: ["orders", type],
    queryFn: () => apiClient.get(ORDER_ENDPOINTS[type]),
    staleTime: 30000,
     select: (response) =>
      [...response.data].sort((a, b) => {
        const priorityDiff =
          STATUS_PRIORITY[a.status as OrderStatus] -
          STATUS_PRIORITY[b.status as OrderStatus];

        if (priorityDiff !== 0) return priorityDiff;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
  });
};

/**
 * Fetch a single order by ID
 */

export const useOrder = (id: string) => {
  return useQuery<OrderType>({
    queryKey: ["orders", id],
    queryFn: () => apiClient.get(`/admin/orders/${id}`),
    staleTime: 30000,

    // Validate status on fetch
    select: (data) => {
      if (!isValidOrderStatus(data.status)) {
        console.warn(`Invalid status received: ${data.status}`);
      }
      return data;
    },
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

/**
 * Update order status with validation
 * Uses STATUS_TRANSITIONS from constants for safety
 */

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateOrderResponse,
    Error,
    { id: string; data: UpdateOrderPayLoad }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderPayLoad }) =>
      apiClient.patch(`/orders/${id}`, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Get the action config for a specific order status
 * Returns button label and styling, or null if no action
 */
export const useOrderActionConfig = (status: string) => {
  if (!isValidOrderStatus(status)) {
    return null;
  }
  return ORDER_ACTION_CONFIG[status];
};

/**
 * Check if an order can transition to a new status
 */
export const useCanTransition = (currentStatus: string) => {
  if (!isValidOrderStatus(currentStatus)) {
    return null;
  }
  return STATUS_TRANSITIONS[currentStatus];
};

/**
 * Get priority score for sorting
 */
export const useStatusPriority = (status: string) => {
  if (!isValidOrderStatus(status)) {
    return Infinity; // Low priority for invalid statuses
  }
  return STATUS_PRIORITY[status];
};
