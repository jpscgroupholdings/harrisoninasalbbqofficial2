"use client";

import Link from "next/link";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/hooks/api/useOrders";

interface Props {
  mounted: boolean;
}

export const HeaderCartActions = ({ mounted }: Props) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { data: placedOrders } = useOrders({ type: "customer" });

  const activeOrdersCount =
    placedOrders?.data.filter(
      (order) =>
        order.status !== "cancelled" &&
        (order.status !== "completed" || !order.isReviewed),
    ).length ?? 0;

  return (
    <div className="hidden md:flex items-center gap-2 sm:gap-4">
      <Link
        href="/orders"
        className="relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer"
      >
        <DynamicIcon
          name="ShoppingBag"
          size={20}
          className="group-hover:scale-110 transition-transform darkText"
        />
        {activeOrdersCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {activeOrdersCount}
          </span>
        )}
      </Link>

      <button
        onClick={() => setIsCartOpen(true)}
        className="relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer"
      >
        <DynamicIcon
          name="ShoppingCart"
          size={20}
          className="group-hover:scale-110 transition-transform darkText"
        />
        {mounted && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
};
