"use client";

import SectionHeader from "@/app/admin/components/SectionHeader";
import { useBundleDiscountPromotions } from "../../hooks/useBundleDiscountPromotions";
import { BundleDiscountPromotionList } from "./components/BundleDiscountPromotionList";
import { useRouter } from "next/navigation";

const BundleDiscountPromotionsPage = () => {
  const router = useRouter();
  const {
    data: bundleData,
    isLoading,
    isError,
  } = useBundleDiscountPromotions();

  const promotions = bundleData?.data ?? [];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Bundle Discounts"
        subTitle="Create and manage discounts for bundle items"
        btnTxt="Create Bundle Discount"
        onClick={() => router.push("/promotions/bundle-discounts/new")}
        permission="promotions.read"
      />
      {isLoading && <p className="text-sm text-stone-500">Loading...</p>}
      {isError && (
        <p className="text-sm font-semibold text-red-600">
          Failed to load bundle discount promotions.
        </p>
      )}
      {!isLoading && !isError && (
        <BundleDiscountPromotionList promotions={promotions} />
      )}
    </section>
  );
};

export default BundleDiscountPromotionsPage;
