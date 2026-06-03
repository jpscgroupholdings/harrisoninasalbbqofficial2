"use client";

import SectionHeader from "@/app/admin/components/SectionHeader";
import LoadingPage from "@/components/ui/LoadingPage";
import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PromotionList } from "./components/PromotionList";
import { OrderDiscountPromotionsResponse } from "./types";

export default function OrderDiscountPromotionsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "order-discount-promotions"],
    queryFn: () =>
      apiClient.get<OrderDiscountPromotionsResponse>(
        "/admin/order-discount-promotions",
      ),
  });
  const promotions = data?.data ?? [];

  if (isLoading) return <LoadingPage />;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Order Discounts"
        subTitle="Create and manage whole-order discounts with schedule, minimum order, caps, and redemption limits"
        onClick={() => router.push("/promotions/order-discounts/new")}
        btnTxt="+ Create Discount"
        permission=""
      />
      {error ? (
        <p className="text-sm font-medium text-red-600">
          Failed to load order discount promotions.
        </p>
      ) : (
        <PromotionList promotions={promotions} />
      )}
    </section>
  );
}
