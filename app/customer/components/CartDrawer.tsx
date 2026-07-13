"use client";

import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { getCartKey } from "@/contexts/CartContext";
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
  addMoney,
  clampMoneyMin,
  minMoney,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from "@/lib/money";
import { formatCurrency } from "@/helper/formatCurrency";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";
import { AppImage } from "@/components/AppImage";
import { IconButton } from "@/components/ui/buttons";

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
  const handleEdit = (item: (typeof cartItems)[number], cartKey: string) => {
    removeFromCart(cartKey);
    setIsCartOpen(false);
    router.push(`/products/${item._id}`);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout/details");
  };

  const [showBreakdown, setShowBreakDown] = useState<Set<string>>(new Set());

  const toggleBreakdown = (id: string) => {
    setShowBreakDown((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
              {cartItems.map((item) => {
                const cartKey = getCartKey(item);
                const hasModifiers = (item.modifierSelections?.length ?? 0) > 0;

                // Compute upgrade total from modifier selections
                const upgradeTotal = hasModifiers
                  ? roundMoney(
                      item.modifierSelections!.reduce(
                        (sum, group) =>
                          addMoney(
                            sum,
                            group.items.reduce(
                              (gSum, modItem) =>
                                addMoney(
                                  gSum,
                                  multiplyMoney(
                                    modItem.upgradePrice,
                                    modItem.quantity,
                                  ),
                                ),
                              0,
                            ),
                          ),
                        0,
                      ),
                    )
                  : 0;

                // For combo/set: basePrice = total unit price - upgrade total
                const basePrice = hasModifiers
                  ? subtractMoney(item.price, upgradeTotal)
                  : item.price;

                // Line total (unit price × quantity)
                const lineTotal = multiplyMoney(item.price, item.quantity);

                // Discount handling for solo items
                const unitDiscount =
                  item.activeProductDiscount?.discountAmount ?? 0;
                const lineDiscount = minMoney(
                  multiplyMoney(unitDiscount, item.quantity),
                  lineTotal,
                );
                const discountedLineTotal = clampMoneyMin(
                  subtractMoney(lineTotal, lineDiscount),
                );
                const hasProductDiscount = lineDiscount > 0;

                return (
                  <div key={cartKey} className="bg-gray-50 rounded-xl">
                    {/**Details */}
                    <div className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <AppImage
                          src={item.image}
                          alt={item.name || "Product_Image"}
                          loading="lazy"
                        />
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Header: name + actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {item.name}
                            </h4>
                            {item.category?.name && (
                              <p className="text-xs text-gray-400">
                                {item.category.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit button — only for combo/set items */}
                            {hasModifiers && (
                              <IconButton
                                icon={{
                                  name: "Pencil",
                                  className:
                                    "text-green-500 hover:text-green-600",
                                }}
                                title="Edit selections"
                                onClick={() => handleEdit(item, cartKey)}
                                className=" hover:bg-green-100 rounded-none cursor-pointer p-2"
                                variant="ghost"
                              />
                            )}
                            <IconButton
                              icon={{ name: "Trash2" }}
                              title="Remove Item"
                              onClick={() => removeFromCart(cartKey)}
                              className=" hover:bg-red-100 text-red-500 rounded-none cursor-pointer p-2"
                              variant="ghost"
                            />
                          </div>
                        </div>

                        {(hasModifiers || hasProductDiscount) && (
                          <button
                            type="button"
                            onClick={() => toggleBreakdown(cartKey)}
                            className="text-xs text-gray-500 underline"
                          >
                            {showBreakdown.has(cartKey)
                              ? "Hide details"
                              : "Show details"}
                          </button>
                        )}

                        {/* Modifier selections by group */}
                        {hasModifiers && showBreakdown.has(cartKey) && (
                          <div className="mt-2 space-y-1.5">
                            {item.modifierSelections!.map((group) => (
                              <div key={group.groupId}>
                                <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">
                                  {group.groupName}
                                </p>
                                {group.items.map((modItem) => (
                                  <div
                                    key={modItem.productId}
                                    className="flex justify-between text-xs ml-2"
                                  >
                                    <span className="text-gray-500">
                                      {modItem.label ?? modItem.name}
                                      {modItem.quantity > 1 &&
                                        ` (×${modItem.quantity})`}
                                    </span>
                                    <span className="text-gray-400">
                                      {modItem.upgradePrice > 0
                                        ? `+${formatCurrency(
                                            modItem.upgradePrice,
                                          )}`
                                        : "₱0.00"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Discount label for solo items */}
                        {item.activeProductDiscount && (
                          <p className="mt-1 text-xs font-semibold text-green-600">
                            {item.activeProductDiscount.label}
                          </p>
                        )}
                      </div>
                    </div>

                    {/*Break down */}
                    <div className="p-2">
                      {/* Price breakdown */}
                      {(hasModifiers || hasProductDiscount) &&
                        showBreakdown.has(cartKey) && (
                          <div className="my-3 space-y-0.5 bg-brand-color-50 rounded-lg p-2">
                            {hasModifiers ? (
                              <>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Base price</span>
                                  <span>{formatCurrency(basePrice)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Upgrades</span>
                                  <span>+{formatCurrency(upgradeTotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-700 border-t border-gray-200 pt-1 mt-1">
                                  <span>Unit price</span>
                                  <span>{formatCurrency(item.price)}</span>
                                </div>
                              </>
                            ) : hasProductDiscount ? (
                              <>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Unit price</span>
                                  <span className="line-through">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-green-600">
                                  <span>Discounted</span>
                                  <span>
                                    {formatCurrency(
                                      item.activeProductDiscount!
                                        .discountedPrice,
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Unit price</span>
                                <span>{formatCurrency(item.price)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      {/* Quantity stepper + line total */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200">
                          <IconButton
                            onClick={() =>
                              item.quantity > 1 &&
                              updateQuantity(cartKey, item.quantity - 1)
                            }
                            icon={{ name: "Minus" }}
                            variant="secondary"
                            title="Decrease quantity"
                            disabled={item.quantity <= 1}
                            className="rounded-full p-2"
                          />

                          <span className="font-semibold text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <IconButton
                            onClick={() =>
                              updateQuantity(cartKey, item.quantity + 1)
                            }
                            icon={{ name: "Plus" }}
                            className="rounded-full p-2"
                            title="Increase Quantity"
                            variant="primary"
                          />
                        </div>
                        <span className="font-bold text-sm text-brand-color-500">
                          {formatCurrency(
                            hasProductDiscount
                              ? discountedLineTotal
                              : lineTotal,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/** Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              {isPromoCardEnabled && (
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
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₱{subtotalPrice.toFixed(2)}</span>
              </div>
              {productDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-sm font-semibold text-green-600">
                  <span>Product discounts</span>
                  <span>-PHP {productDiscountAmount.toFixed(2)}</span>
                </div>
              )}
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
                  Spend{" "}
                  <span className="font-bold">
                    ₱{nextOrderDiscountHint.amountUntilEligible.toFixed(2)}
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
