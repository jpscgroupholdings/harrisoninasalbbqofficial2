"use client";

import PolicyPageLayout from "@/app/policies/components/PolicyPageLayout";
import DynamicPolicyContent from "@/app/policies/components/DynamicPolicyContent";
import { usePolicy } from "@/hooks/api/usePolicies";
import { policyFallbackMap } from "@/data/policyData";
import type { PolicyData } from "@/hooks/api/usePolicies";
import LoadingPage from "@/components/ui/LoadingPage";

/**
 * Shared policy page component — fetches, falls back, and renders
 * any policy by slug. Eliminates duplicated hook + state logic
 * across the four policy pages.
 */
const PolicyPage = ({ slug }: { slug: string }) => {
  const { data: response, isLoading } = usePolicy(slug);

  if (isLoading) {
    return (
      <PolicyPageLayout>
        <LoadingPage />
      </PolicyPageLayout>
    );
  }

  /** Database data first, then static fallback from policyData.ts */
  const policy = (response?.data ?? policyFallbackMap.get(slug)) as
    | PolicyData
    | undefined;

  if (policy) {
    return (
      <PolicyPageLayout>
        <DynamicPolicyContent policy={policy} />
      </PolicyPageLayout>
    );
  }

  return (
    <PolicyPageLayout>
      <p className="text-gray-500 text-center py-12">
        Policy content is not available yet.
      </p>
    </PolicyPageLayout>
  );
};

export default PolicyPage;
