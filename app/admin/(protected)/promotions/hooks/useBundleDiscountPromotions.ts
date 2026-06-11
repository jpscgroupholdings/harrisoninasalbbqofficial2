import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BundleDiscountPromotionMutationResponse,
  BundleDiscountPromotionsResponse,
  BundleDiscountPromotionSavePayload,
} from "../(pages)/bundle-discounts/type";
import { DiscountOptionsResponse } from "../types/discount-promotion.type";

export const BUNDLE_DISCOUNT_PROMOTIONS_QUERY_KEY = [
  "admin",
  "bundle-discount-promotions",
] as const;

export const BUNDLE_DISCOUNT_OPTIONS_QUERY_KEY = [
  "admin",
  "bundle-discount-promotion-options",
] as const;

export const useBundleDiscountPromotions = () => {
  return useQuery({
    queryKey: BUNDLE_DISCOUNT_PROMOTIONS_QUERY_KEY,
    queryFn: () =>
      apiClient.get<BundleDiscountPromotionsResponse>(
        "/admin/bundle-discount-promotions",
      ),
  });
};

export const useBundleDiscountOptions = () => {
  return useQuery({
    queryKey: BUNDLE_DISCOUNT_OPTIONS_QUERY_KEY,
    queryFn: () =>
      apiClient.get<DiscountOptionsResponse>(
        "/admin/product-discount-promotions/options",
      ),
  });
};

export function useSaveBundleDiscountPromotion({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BundleDiscountPromotionSavePayload) =>
      apiClient.post<BundleDiscountPromotionMutationResponse>(
        "/admin/bundle-discount-promotions",
        payload,
      ),
    onSuccess: async () => {
      toast.success("Bundle discount promotion created.");
      await queryClient.invalidateQueries({
        queryKey: BUNDLE_DISCOUNT_PROMOTIONS_QUERY_KEY,
      });
      onSuccess();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save bundle discount promotion.");
    },
  });
}
