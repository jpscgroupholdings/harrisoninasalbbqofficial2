"use client";

import React from "react";
import { useCart, getCartKey } from "@/contexts/CartContext";
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
import {
  clampMoneyMin,
  multiplyMoney,
  subtractMoney,
} from "@/lib/money";
import { formatCurrency } from "@/helper/formatter";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";
import { IconButton } from "@/components/ui/buttons";
import { Checkbox } from "@/components/ui/FormComponents";
import { SummaryRow } from "@/components/ui/SummaryRow";
import CartItemRow from "@/components/customer/CartItemRow";
import type { CartItem } from "@/types/MenuTypes";

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
          enabled: boolean;
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
  const isPromoCardEnabled = promoCardStatus?.config?.enabled === true;
  const canUsePromoCardDiscount =
    isPromoCardEnabled && promoCardStatus?.hasPaidPromoCard === true;
  const promoCardConfig = promoCardStatus?.config ?? {
    ...PROMO_CARD,
    discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  };
  const availableVoucherBalance = promoCardStatus?.voucherBalance ?? 0;
  const activeDiscountRate = isPromoCardEnabled
    ? getPromoCardDiscountRateForDay(
        promoCardConfig.discountRules,
        getPromoCardDay(),
        promoCardConfig.discountRate,
      )
    : 0;
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
    productDiscountAmount,
    productDiscountedSubtotal,
    promoCardDiscount,
    totalPrice,
    applyPromoCardDiscount,
    setApplyPromoCardDiscount,
    setPromoCardDiscountRate,
    clearCart,
  } = useCart();
  const orderDiscountPromotion = getBestOrderDiscountEstimate(
    activePromotions?.data,
    productDiscountedSubtotal,
    totalPrice,
  );
  const nextOrderDiscountHint = getNextOrderDiscountEligibilityHint(
    activePromotions?.data,
    productDiscountedSubtotal,
  );
  const orderDiscountAmount = orderDiscountPromotion?.discountAmount ?? 0;
  const displayTotalPrice = clampMoneyMin(
    subtractMoney(totalPrice, orderDiscountAmount),
  );
  const displayVatableSales = multiplyMoney(displayTotalPrice, 1 / 1.12);
  const displayVatAmount = subtractMoney(
    displayTotalPrice,
    displayVatableSales,
  );

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

  /** Remove the item from cart and navigate to the product page to re-select modifiers */
  const handleEdit = (item: CartItem, cartKey: string) => {
    removeFromCart(cartKey);
    setIsCartOpen(false);
    router.push(`/products/${item._id}`);
  };

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
            <IconButton
              icon={{ name: "X", size: 20 }}
              onClick={() => setIsCartOpen(false)}
              title="Close cart drawer"
              variant="ghost"
            />
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
              {cartItems.map((item) => (
                <div key={getCartKey(item)} className="bg-gray-50 rounded-xl p-4">
                  <CartItemRow
                    item={item}
                    onRemove={removeFromCart}
                    onUpdate={updateQuantity}
                    onEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/** Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              {isPromoCardEnabled && (
                <Checkbox
                  checked={applyPromoCardDiscount}
                  onChange={(event) =>
                    setApplyPromoCardDiscount(event.target.checked)
                  }
                  disabled={!canUsePromoCardDiscount}
                  label={`Apply ${promoCardConfig.name}`}
                  subLabel={
                    canUsePromoCardDiscount
                      ? `${(activeDiscountRate * 100).toFixed(0)}% discount today`
                      : "Paid promo card required"
                  }
                  wrapperClassName="bg-orange-50"
                />
              )}
              <SummaryRow
                title="Subtotal"
                subTitle={formatCurrency(subtotalPrice)}
              />
              {productDiscountAmount > 0 && (
                <SummaryRow
                  title="Product discounts"
                  subTitle={`-${formatCurrency(productDiscountAmount)}`}
                  className={{ parent: "text-green-600" }}
                />
              )}
              {promoCardDiscount > 0 && (
                <SummaryRow
                  title="Promo card discount"
                  subTitle={`-${formatCurrency(promoCardDiscount)}`}
                  className={{ parent: "text-green-600" }}
                />
              )}
              {orderDiscountAmount > 0 && (
                <SummaryRow
                  title={orderDiscountPromotion?.name ?? "Order Discount"}
                  subTitle={`-${formatCurrency(orderDiscountAmount)}`}
                  className={{ parent: "text-green-600" }}
                />
              )}
              {orderDiscountAmount === 0 && nextOrderDiscountHint && (
                <p className="block font-extralight text-brand-color-500 text-sm">
                  Spend{" "}
                  <span className="font-bold">
                    {formatCurrency(nextOrderDiscountHint.amountUntilEligible)}
                  </span>{" "}
                  more to use {nextOrderDiscountHint.name}.
                </p>
              )}
              {availableVoucherBalance > 0 && (
                <div className="rounded-xl border border-green-200 bg-white p-3 text-sm">
                  <span className="block font-semibold text-gray-800">
                    Voucher balance available
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Use up to {formatCurrency(availableVoucherBalance)} at
                    checkout.
                  </span>
                </div>
              )}
              <SummaryRow
                title="VATable Sales"
                subTitle={formatCurrency(displayVatableSales)}
              />

              <SummaryRow
                title="VAT (12%)"
                subTitle={formatCurrency(displayVatAmount)}
              />

              <SummaryRow
                title="Total (VAT Inc)"
                subTitle={formatCurrency(displayTotalPrice)}
                className={{
                  title: "font-semibold text-gray-900",
                  subTitle: "font-bold text-xl text-brand-color-500",
                  parent: "pt-2 border-t border-gray-100 text-lg",
                }}
              />
            </div>
            <div className="space-y-2">
              <IconButton
                onClick={handleCheckout}
                text="Proceed to checkout"
                icon={{ name: "ArrowRight", size: 20 }}
                className="w-full py-4 rounded-lg"
              />
              <IconButton
                text="Clear cart"
                variant="ghost"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
