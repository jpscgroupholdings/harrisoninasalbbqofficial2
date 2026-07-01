import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/**
 * Types matching the Policy model and API responses.
 */
export interface PolicySection {
  heading: string;
  content: string;
}

export interface PolicyData {
  _id?: string;
  slug: string;
  title: string;
  subtitle: string;
  sections: PolicySection[];
  lastUpdatedBy?: {
    staffId: string;
    name: string;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Whether this policy exists in the database (admin responses only) */
  seeded?: boolean;
}

export interface PolicyListResponse {
  data: PolicyData[];
}

export interface PolicyDetailResponse {
  data: PolicyData | null;
}

/**
 * Query key factory for policies.
 */
export const policyKeys = {
  all: ["policies"] as const,
  list: () => [...policyKeys.all, "list"] as const,
  detail: (slug: string) => [...policyKeys.all, "detail", slug] as const,
};

/**
 * Fetch all policies from the database.
 * Returns empty array if no policies have been seeded yet.
 */
export function usePolicies() {
  return useQuery<PolicyListResponse>({
    queryKey: policyKeys.list(),
    queryFn: () => apiClient.get<PolicyListResponse>("/policies"),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch a single policy by slug from the database.
 * Returns null if the policy hasn't been seeded yet.
 */
export function usePolicy(slug: string) {
  return useQuery<PolicyDetailResponse>({
    queryKey: policyKeys.detail(slug),
    queryFn: () => apiClient.get<PolicyDetailResponse>(`/policies/${slug}`),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: Boolean(slug),
  });
}
