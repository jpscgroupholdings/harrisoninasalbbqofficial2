"use client";

import { ProductDiscountPromotionEditor } from "../components/ProductDiscountPromotionEditor";
import { getCreateDefaultPromotion } from "../helpers/getCreateDefaultPromotion";

export default function CreateProductDiscountPromotionPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="mb-0 text-xl font-bold text-gray-800 md:mb-2 md:text-2xl lg:text-3xl">
          Create Product Discount
        </h1>
        <p className="text-sm text-gray-500 lg:text-lg">
          Select discounted products, discount amount, period, days, and
          redemption limit.
        </p>
      </div>
      <ProductDiscountPromotionEditor
        mode="create"
        promotion={getCreateDefaultPromotion()}
      />
    </section>
  );
}
