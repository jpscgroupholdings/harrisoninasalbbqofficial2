import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ProductDiscountOptionsResponse,
  ProductDiscountPromotionMutationResponse,
  ProductDiscountPromotionsResponse,
  ProductDiscountPromotionSavePayload,
} from "../product-discounts/types";

export const PRODUCT_DISCOUNT_PROMOTIONS_QUERY_KEY = [
  "admin",
  "product-discount-promotions",
] as const;

export const PRODUCT_DISCOUNT_OPTIONS_QUERY_KEY = [
  "admin",
  "product-discount-promotion-options",
] as const;

export function useProductDiscountPromotions() {
  return useQuery({
    queryKey: PRODUCT_DISCOUNT_PROMOTIONS_QUERY_KEY,
    queryFn: () =>
      apiClient.get<ProductDiscountPromotionsResponse>(
        "/admin/product-discount-promotions",
      ),
  });
}

export function useProductDiscountOptions() {
  return useQuery({
    queryKey: PRODUCT_DISCOUNT_OPTIONS_QUERY_KEY,
    queryFn: () =>
      apiClient.get<ProductDiscountOptionsResponse>(
        "/admin/product-discount-promotions/options",
      ),
  });
}

export function useDeleteProductDiscountPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) =>
      apiClient.delete<{ success: boolean }>(
        `/admin/product-discount-promotions/${promotionId}`,
      ),
    onSuccess: async () => {
      toast.success("Product discount promotion deleted.");
      await queryClient.invalidateQueries({
        queryKey: PRODUCT_DISCOUNT_PROMOTIONS_QUERY_KEY,
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message ?? "Failed to delete product discount promotion.",
      );
    },
  });
}

export function useSaveProductDiscountPromotion({
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
    mutationFn: (payload: ProductDiscountPromotionSavePayload) =>
      mode === "create"
        ? apiClient.post<ProductDiscountPromotionMutationResponse>(
            "/admin/product-discount-promotions",
            payload,
          )
        : apiClient.patch<ProductDiscountPromotionMutationResponse>(
            `/admin/product-discount-promotions/${promotionId}`,
            payload,
          ),
    onSuccess: async () => {
      toast.success(
        mode === "create"
          ? "Product discount promotion created."
          : "Product discount promotion updated.",
      );
      await queryClient.invalidateQueries({
        queryKey: PRODUCT_DISCOUNT_PROMOTIONS_QUERY_KEY,
      });
      onSuccess();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save product discount promotion.");
    },
  });
}
