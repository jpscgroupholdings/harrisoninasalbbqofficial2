"use client";

import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import OrderNowButton from "@/components/ui/OrderNowButton";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  getPromoCardDay,
  getPromoCardDiscountRateForDay,
  PROMO_CARD,
} from "@/lib/promoCard";
import {
  getBestOrderDiscountEstimate,
  getNextOrderDiscountEligibilityHint,
} from "@/lib/order-promotions/order-promotion.estimate";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";

const CartDrawer = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: promoCardStatus } = useQuery({
    queryKey: ["customer", "promo-card", "status"],
    queryFn: () =>
      apiClient.get<{
        hasPaidPromoCard: boolean;
        voucherBalance: number;
        config: {
          name: string;
          discountRate: number;
          purchasePrice: number;
          sku: string;
          discountRules: {
            days: PromotionDiscountDay[];
            discountRate: number;
          }[];
        };
      }>("/customer/promo-card/status"),
    enabled: Boolean(session?.user),
    staleTime: 60_000,
  });
  const canUsePromoCardDiscount = promoCardStatus?.hasPaidPromoCard === true;
  const promoCardConfig = promoCardStatus?.config ?? {
    ...PROMO_CARD,
    discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  };
  const availableVoucherBalance = promoCardStatus?.voucherBalance ?? 0;
  const activeDiscountRate = getPromoCardDiscountRateForDay(
    promoCardConfig.discountRules,
    getPromoCardDay(),
    promoCardConfig.discountRate,
  );
  const { data: activePromotions } = useQuery({
    queryKey: ["promotions", "active"],
    queryFn: () =>
      apiClient.get<ActivePromotionsResponse>("/promotions/active"),
    staleTime: 60_000,
  });
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalProducts,
    totalItems,
    subtotalPrice,
    promoCardDiscount,
    totalPrice,
    applyPromoCardDiscount,
    setApplyPromoCardDiscount,
    setPromoCardDiscountRate,
    clearCart,
  } = useCart();
  const orderDiscountPromotion = getBestOrderDiscountEstimate(
    activePromotions?.data,
    subtotalPrice,
    totalPrice,
  );
  const nextOrderDiscountHint = getNextOrderDiscountEligibilityHint(
    activePromotions?.data,
    subtotalPrice,
  );
  const orderDiscountAmount = orderDiscountPromotion?.discountAmount ?? 0;
  const displayTotalPrice = Number(
    Math.max(totalPrice - orderDiscountAmount, 0).toFixed(2),
  );
  const displayVatableSales = displayTotalPrice / 1.12;
  const displayVatAmount = displayTotalPrice - displayVatableSales;

  React.useEffect(() => {
    if (!canUsePromoCardDiscount && applyPromoCardDiscount) {
      setApplyPromoCardDiscount(false);
    }
    setPromoCardDiscountRate(activeDiscountRate);
  }, [
    activeDiscountRate,
    applyPromoCardDiscount,
    canUsePromoCardDiscount,
    setApplyPromoCardDiscount,
    setPromoCardDiscountRate,
  ]);

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout/details");
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/** Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-45 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      {/** Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-60 shadow-2xl transition-transform duration-300 flex flex-col">
        {/** Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <DynamicIcon
              name="ShoppingCart"
              className="text-brand-color-500"
              size={20}
            />
            <h2 className="text-xl font-bold text-gray-900">My order</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-brand-color-600">
                {totalProducts} products
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-brand-color-600">
                {totalItems} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <DynamicIcon name="X" size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/** Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <div className="p-2 bg-gray-100 rounded-full items-center">
                <DynamicIcon
                  name="ShoppingCart"
                  size={24}
                  className="text-slate-600"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-400">
                Your cart is empty
              </h3>
              <p className="text-gray-400 text-sm">
                Add some delicious items to get started!
              </p>
              <OrderNowButton />
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 bg-gray-50 rounded-xl p-4"
                >
                  <img
                    src={item.image}
                    alt={item.name || "product image"}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h4>
                    <p className="text-brand-color-500 font-bold">
                      ₱{item.price}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200">
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity - 1)
                          }
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        >
                          <DynamicIcon name="Minus" size={14} />
                        </button>
                        <span className="font-semibold text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        >
                          <DynamicIcon name="Plus" size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      >
                        <DynamicIcon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/** Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-xl bg-orange-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={applyPromoCardDiscount}
                  onChange={(event) =>
                    setApplyPromoCardDiscount(event.target.checked)
                  }
                  disabled={!canUsePromoCardDiscount}
                  className="mt-1 h-4 w-4 accent-brand-color-500"
                />
                <span>
                  <span className="block font-semibold text-gray-800">
                    Apply {promoCardConfig.name}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {canUsePromoCardDiscount
                      ? `${(activeDiscountRate * 100).toFixed(0)}% discount today`
                      : "Paid promo card required"}
                  </span>
                </span>
              </label>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₱{subtotalPrice.toFixed(2)}</span>
              </div>
              {promoCardDiscount > 0 && (
                <div className="flex items-center justify-between text-sm font-semibold text-green-600">
                  <span>Promo card discount</span>
                  <span>-₱{promoCardDiscount.toFixed(2)}</span>
                </div>
              )}
              {orderDiscountAmount > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-green-600">
                  <span className="min-w-0 truncate">
                    {orderDiscountPromotion?.name}
                  </span>
                  <span>-₱{orderDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {orderDiscountAmount === 0 && nextOrderDiscountHint && (
                <p className="block font-extralight text-brand-color-500 text-sm">
                  Spend <span className="font-bold">₱{nextOrderDiscountHint.amountUntilEligible.toFixed(2)}</span>{" "}
                  more to use {nextOrderDiscountHint.name}.
                </p>
              )}
              {availableVoucherBalance > 0 && (
                <div className="rounded-xl border border-green-200 bg-white p-3 text-sm">
                  <span className="block font-semibold text-gray-800">
                    Voucher balance available
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Use up to ₱{availableVoucherBalance.toFixed(2)} at checkout.
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>VATable Sales</span>
                <span>₱{displayVatableSales.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>VAT (12%)</span>
                <span>₱{displayVatAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-900">
                  Total (VAT Inc)
                </span>
                <span className="font-bold text-xl text-brand-color-500">
                  ₱{displayTotalPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-color-500 hover:bg-[#c13500] text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to checkout
              <DynamicIcon name="ArrowRight" size={20} />
            </button>

            <button
              onClick={clearCart}
              className="w-full text-gray-500 hover:text-red-500 py-2 text-sm transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
