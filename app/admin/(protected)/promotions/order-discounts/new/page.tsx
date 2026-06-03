"use client";

import {
  OrderDiscountPromotionEditor,
} from "../components/OrderDiscountPromotionEditor";
import { getCreateDefaultPromotion } from "../helpers/getCreateDefaultPromotion";

export default function CreateOrderDiscountPromotionPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="mb-0 text-xl font-bold text-gray-800 md:mb-2 md:text-2xl lg:text-3xl">
          Create Order Discount
        </h1>
        <p className="text-sm text-gray-500 lg:text-lg">
          Configure a whole-order discount with schedule, minimum order, caps,
          and redemption limits
        </p>
      </div>
      <OrderDiscountPromotionEditor
        mode="create"
        promotion={getCreateDefaultPromotion()}
      />
    </section>
  );
}
