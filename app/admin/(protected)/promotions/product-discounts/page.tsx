"use client";

import SectionHeader from "@/app/admin/components/SectionHeader";
import { useRouter } from "next/navigation";
import { useProductDiscountPromotions } from "../hooks/useProductDiscountPromotions";
import { ProductDiscountPromotionList } from "./components/ProductDiscountPromotionList";

export default function ProductDiscountPromotionsPage() {
  const router = useRouter();
  const { data, isError, isLoading } = useProductDiscountPromotions();
  const promotions = data?.data ?? [];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Product Discounts"
        subTitle="Create and manage discounts for selected products."
        btnTxt="Create Product Discount"
        onClick={() => router.push("/promotions/product-discounts/new")}
        permission="promotions.read"
      />

      {isLoading && <p className="text-sm text-stone-500">Loading...</p>}
      {isError && (
        <p className="text-sm font-semibold text-red-600">
          Failed to load product discount promotions.
        </p>
      )}
      {!isLoading && !isError && (
        <ProductDiscountPromotionList promotions={promotions} />
      )}
    </section>
  );
}
