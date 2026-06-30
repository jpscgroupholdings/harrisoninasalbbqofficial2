import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

type BranchCapacityResponse = {
  canAcceptOrders: boolean;
  reason?: "high_demand";
  message?: string;
  activeOrderCount?: number;
  maxActiveOrders?: number;
};

/**
 * Check whether a branch can currently accept new orders.
 * Returns canAcceptOrders: true when capacity is available,
 * false with a polite message when at capacity.
 */
export function useBranchCapacity(branchId: string | null) {
  return useQuery<BranchCapacityResponse, Error, BranchCapacityResponse>({
    queryKey: ["branchCapacity", branchId],
    queryFn: () =>
      apiClient.get<BranchCapacityResponse>(
        `/customer/branch/capacity?branchId=${branchId}`,
      ),
    enabled: !!branchId,
    staleTime: 1000 * 30, // 30 seconds — capacity can change quickly
    refetchInterval: 1000 * 60, // Poll every 60s while the user is on the page
    select: (res) => res,
  });
}
