import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ItemReviewInput {
  productId: string;
  name: string;
  image?: string | null;
  rating?: number | null;   // null = customer skipped this item
  comment?: string | null;
}

export interface SubmitReviewPayload {
  rating: number;           // 1-5, required
  comment?: string;         // optional overall comment
  itemReviews?: ItemReviewInput[];
}

interface SubmitReviewResponse {
  message: string;
  reviewId: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSubmitReview = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitReviewResponse, Error, SubmitReviewPayload>({
    mutationFn: (payload) =>
      apiClient.post<SubmitReviewResponse, SubmitReviewPayload>(
        `/customer/orders/${orderId}/review`,
        payload,
      ),

    onSuccess: () => {
      // Invalidate the single order so isReviewed flips to true immediately
      queryClient.invalidateQueries({ queryKey: ["orders", "customer", orderId] });
      // Also invalidate the orders list so the review badge updates
      queryClient.invalidateQueries({ queryKey: ["orders", "customer"] });
    },
  });
};