import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  PolicyData,
  PolicySection,
  policyKeys,
} from "@/hooks/api/usePolicies";

/**
 * Admin-specific hooks for managing policies.
 * Uses the /admin/policies endpoints which require authentication.
 */

const ADMIN_ENDPOINT = "/admin/policies";

interface AdminPoliciesResponse {
  data: PolicyData[];
  seeded: boolean;
}

/**
 * Fetch all policies (admin view).
 * Returns `seeded: boolean` indicating whether DB records exist.
 * If not seeded, data comes from static fallback for preview.
 */
export function useAdminPolicies() {
  return useQuery<AdminPoliciesResponse>({
    queryKey: [...policyKeys.all, "admin-list"],
    queryFn: () => apiClient.get<AdminPoliciesResponse>(ADMIN_ENDPOINT),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch a single policy by slug (admin view).
 */
export function useAdminPolicy(slug: string) {
  return useQuery<{ data: PolicyData; seeded: boolean }>({
    queryKey: [...policyKeys.all, "admin-detail", slug],
    queryFn: () => apiClient.get<{ data: PolicyData; seeded: boolean }>(`${ADMIN_ENDPOINT}/${slug}`),
    staleTime: 2 * 60 * 1000,
    retry: 1,
    enabled: Boolean(slug),
  });
}

interface PolicyUpdatePayload {
  title: string;
  subtitle: string;
  sections: PolicySection[];
}

/**
 * Update a single policy by slug.
 * On success, invalidates both admin and public policy caches.
 */
export function useUpdatePolicy(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PolicyUpdatePayload) =>
      apiClient.put<{ message: string; data: PolicyData }>(
        `${ADMIN_ENDPOINT}/${slug}`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
      toast.success("Policy updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update policy");
    },
  });
}

/**
 * Seed all policies from fallback data into the database.
 * Used for initial setup when no DB records exist.
 */
export function useSeedPolicies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<{ message: string; data: PolicyData[]; count: number }>(
        ADMIN_ENDPOINT,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
      toast.success("Policies seeded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to seed policies");
    },
  });
}
