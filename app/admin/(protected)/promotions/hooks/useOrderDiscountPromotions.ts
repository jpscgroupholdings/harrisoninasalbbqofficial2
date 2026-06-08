import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderDiscountPromotionMutationResponse,   OrderDiscountPromotionsResponse,
  OrderDiscountPromotionSavePayload,} from "../(pages)/order-discounts/types";

export const ORDER_DISCOUNT_PROMOTIONS_QUERY_KEY = [
  "admin",
  "order-discount-promotions",
] as const;

export function useOrderDiscountPromotions() {
  return useQuery({
    queryKey: ORDER_DISCOUNT_PROMOTIONS_QUERY_KEY,
    queryFn: () =>
      apiClient.get<OrderDiscountPromotionsResponse>(
        "/admin/order-discount-promotions",
      ),
  });
}

export function useDeleteOrderDiscountPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) =>
      apiClient.delete<{ success: boolean }>(
        `/admin/order-discount-promotions/${promotionId}`,
      ),
    onSuccess: async () => {
      toast.success("Order discount promotion deleted.");
      await queryClient.invalidateQueries({
        queryKey: ORDER_DISCOUNT_PROMOTIONS_QUERY_KEY,
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message ?? "Failed to delete order discount promotion.",
      );
    },
  });
}

export function useSaveOrderDiscountPromotion({
  mode,
  promotionId,
  onSuccess,
}: {
  mode: "create" | "edit";
  promotionId: string | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderDiscountPromotionSavePayload) =>
      mode === "create"
        ? apiClient.post<OrderDiscountPromotionMutationResponse>(
            "/admin/order-discount-promotions",
            payload,
          )
        : apiClient.patch<OrderDiscountPromotionMutationResponse>(
            `/admin/order-discount-promotions/${promotionId}`,
            payload,
          ),
    onSuccess: async () => {
      toast.success(
        mode === "create"
          ? "Order discount promotion created."
          : "Order discount promotion updated.",
      );
      await queryClient.invalidateQueries({
        queryKey: ORDER_DISCOUNT_PROMOTIONS_QUERY_KEY,
      });
      onSuccess();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save order discount promotion.");
    },
  });
}
