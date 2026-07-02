import OrderNowButton from "@/components/ui/OrderNowButton";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/api/customers/useCustomerOrders";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Branch } from "@/types/branch";
import Link from "next/link";
import { toast } from "sonner";
import { CustomerSchema, OrderFormState, ShippingSchema } from "./FormSchema";
import useFormErrors from "./useFormErrors";
import { usePathname, useRouter } from "next/navigation";
import { CheckoutStep } from "@/contexts/CheckoutContext";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { CreateOrderPayload } from "@/types/OrderTypes";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/apiClient";
import { trackAddPaymentInfo } from "@/lib/metaPixel";
import {
  getPromoCardDay,
  getPromoCardDiscountRateForDay,
  PROMO_CARD,
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
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
  subtractMoney,
} from "@/lib/money";
import { CartItem } from "@/types/MenuTypes";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";
import { OrderItemImage } from "../components/OrderItemImage";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";
import { FREE_DELIVERY_ENABLED } from "@/lib/deliveryFee";
import { getCheckoutActionMode } from "./checkoutAction";
import { useBranchCapacity } from "@/hooks/api/useBranchCapacity";

const createCodOrder = async (payload: CreateOrderPayload) => {
  const res = await fetch("/api/customer/cod-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to place order.");
  }

  return data as {
    success: boolean;
    referenceNumber: string;
  };
};

/** Single cart row */
const CartRow = ({
  item,
  onRemove,
  onUpdate,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, qty: number) => void;
}) => {
  const unitDiscount = item.activeProductDiscount?.discountAmount ?? 0;
  const lineSubtotal = multiplyMoney(item.price, item.quantity);
  const lineDiscount = minMoney(multiplyMoney(unitDiscount, item.quantity), lineSubtotal);
  const discountedLineTotal = clampMoneyMin(subtractMoney(lineSubtotal, lineDiscount));
  const hasProductDiscount = lineDiscount > 0;

  return (
    <div className="flex gap-3 py-3 first:pt-0">
      <div className="w-14 h-14 rounded-xl object-cover shrink-0">
        <OrderItemImage image={item.image} name={item.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {item.name}
            </p>
            {item.category?.name && (
              <p className="text-xs text-slate-400 mt-0.5">
                {item.category.name}
              </p>
            )}
            {hasProductDiscount && (
              <p className="mt-1 text-[11px] font-semibold text-green-600">
                {item.activeProductDiscount?.label}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(item._id)}
            aria-label="Remove item"
            className="p-1 text-slate-300 hover:text-red-400 transition-colors shrink-0 rounded-full"
          >
            <DynamicIcon name="Trash2" size={13} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          {/* Quantity stepper */}
          <div className="flex items-center gap-0.5 border border-slate-200 rounded-full overflow-hidden">
            <button
              onClick={() => onUpdate(item._id, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600"
            >
              <DynamicIcon name="Minus" size={11} />
            </button>
            <span className="w-6 text-center text-xs font-semibold text-slate-800">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item._id, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600"
            >
              <DynamicIcon name="Plus" size={11} />
            </button>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-brand-color-500">
              PHP {discountedLineTotal.toFixed(2)}
            </span>
            {hasProductDiscount && (
              <span className="text-[11px] text-slate-400 line-through">
                PHP {lineSubtotal.toFixed(2)}
              </span>
            )}
          </div>
          <span className="hidden">
            ₱{multiplyMoney(item.price, item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

type CartListProps = {
  selectedBranch: Branch | null;
  orderDetails: OrderFormState;
  onNext: () => void;
};

type DeliveryFeeEstimateResponse = {
  data: {
    distanceKm: number;
    billableKm: number;
    deliveryFee: number;
    freeDeliveryEligible: boolean;
    effectiveDeliveryFee: number;
    freeDeliveryReason?: string;
  };
};

type PaymentButtonProps = {
  id: "maya" | "cod";
  label: string;
  description: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
  selectedPayment: "maya" | "cod";
  setSelectedPayment: (payment: "maya" | "cod") => void;
};

const PaymentButton = ({
  id,
  label,
  description,
  badge,
  imageSrc,
  imageAlt,
  selectedPayment,
  setSelectedPayment,
}: PaymentButtonProps) => {
  const isSelected = selectedPayment === id;

  return (
    <button
      onClick={() => setSelectedPayment(id)}
      className={`flex flex-col p-4 rounded-xl border-2 transition-all text-left w-full gap-6
        ${
          isSelected
            ? "border-green-500 bg-green-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
    >
      <div className="flex items-start justify-between w-full">
        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shrink-0">
          <div className="w-full h-full object-contain">
            <OrderItemImage image={imageSrc} name={imageAlt} />
          </div>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
          ${isSelected ? "border-green-500" : "border-gray-300"}`}
        >
          {isSelected && (
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-500">{label}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
};

const CartList = ({ selectedBranch, orderDetails, onNext }: CartListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const isDetails = pathname === CheckoutStep.DETAILS;
  const isShipping = pathname === CheckoutStep.SHIPPING;
  const isDelivery = orderDetails.fulfillmentType === FULFILLMENT_TYPE.DELIVERY;
  const checkoutActionMode = getCheckoutActionMode({
    pathname,
    fulfillmentType: orderDetails.fulfillmentType,
  });

  const { data: branchCapacity } = useBranchCapacity(selectedBranch?._id ?? null);
  const isAtCapacity = branchCapacity?.canAcceptOrders === false;

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

  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const { validateAll, customerErrors, shippingErrors } =
    useFormErrors(orderDetails);

  const { firstName, lastName, customerPhone, customerEmail, notes } =
    orderDetails?.customer;
  const {
    line1,
    line2,
    city,
    zipCode,
    province,
    country,
    landmark,
    coordinates,
    placeName,
  } = orderDetails?.shippingAddress;
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
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
  const {
    data: deliveryFeeEstimate,
    isError: isDeliveryFeeError,
    isLoading: isDeliveryFeeLoading,
  } = useQuery({
    queryKey: [
      "customer",
      "delivery-fee",
      selectedBranch?._id,
      coordinates?.lat,
      coordinates?.lng,
      productDiscountedSubtotal,
    ],
    queryFn: () => {
      if (!selectedBranch?._id || !coordinates) {
        throw new Error("Branch and delivery pin are required.");
      }

      return apiClient.post<
        DeliveryFeeEstimateResponse,
        {
          branchId: string;
          coordinates: { lat: number; lng: number };
          itemSubtotalAmount: number;
        }
      >("/customer/delivery-fee/estimate", {
        branchId: selectedBranch._id,
        coordinates,
        itemSubtotalAmount: productDiscountedSubtotal,
      });
    },
    enabled: Boolean(isDelivery && selectedBranch?._id && coordinates),
    staleTime: 60_000,
    retry: false,
  });
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
  const discountAdjustedTotal = clampMoneyMin(subtractMoney(totalPrice, orderDiscountAmount));
  const [voucherAmount, setVoucherAmount] = useState("");
  const parsedVoucherAmount = Math.min(
    Math.max(0, Number(voucherAmount || 0)),
    availableVoucherBalance,
    discountAdjustedTotal,
  );
  const freeDeliveryEligible =
    FREE_DELIVERY_ENABLED && isDelivery
      ? (deliveryFeeEstimate?.data.freeDeliveryEligible ?? false)
      : false;
  const freeDeliveryReason =
    FREE_DELIVERY_ENABLED && isDelivery
      ? (deliveryFeeEstimate?.data.freeDeliveryReason ?? undefined)
      : undefined;
  const deliveryFeeAmount = isDelivery
    ? (deliveryFeeEstimate?.data.deliveryFee ?? 0)
    : 0;
  const effectiveDeliveryFee = freeDeliveryEligible ? 0 : deliveryFeeAmount;
  const displayTotalPrice = clampMoneyMin(
    addMoney(subtractMoney(discountAdjustedTotal, parsedVoucherAmount), effectiveDeliveryFee),
  );
  const displayVatableSales = multiplyMoney(displayTotalPrice, 1 / 1.12);
  const displayVatAmount = subtractMoney(displayTotalPrice, displayVatableSales);

  useEffect(() => {
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

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"maya" | "cod">(
    "maya",
  );
  const [isCodPending, setIsCodPending] = useState(false);

  // check if current step has any errors or empty required fields
  const isDetailsIncomplete = !CustomerSchema.safeParse(orderDetails.customer)
    .success;
  const isShippingIncomplete =
    isDelivery &&
    !ShippingSchema.safeParse(orderDetails.shippingAddress).success;

  const isNextDisabled =
    !selectedBranch ||
    isAtCapacity ||
    (isDetails && isDetailsIncomplete) ||
    (isShipping &&
      (isShippingIncomplete ||
        (isDelivery && (isDeliveryFeeLoading || isDeliveryFeeError))));

  const isActionPending = isPending || isCodPending;

  const handleNext = () => {
    if (!selectedBranch) {
      toast.error("Please select a branch.");
      return;
    }

    if (isDetails) {
      const result = CustomerSchema.safeParse(orderDetails.customer);
      if (!result.success) {
        // populate customerErrors so fields show red
        validateAll(); // or a step-scoped validate
        return;
      }
    }

    // same for shipping step
    onNext();
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validateAll()) {
      const errors = [
        ...Object.values(customerErrors),
        ...Object.values(shippingErrors),
      ].filter(Boolean);

      errors.map((error) => toast.error(error));
      return;
    }

    if (!selectedBranch) {
      toast.error("Please select a branch.");
      return;
    }

    const MINIMUM_AMOUNT = 100;

    if (displayTotalPrice < MINIMUM_AMOUNT) {
      toast.warning("Minimum Order Amount", {
        description: `The minimum amount for online payment is ₱${MINIMUM_AMOUNT.toFixed(2)}.`,
        duration: 6000,
      });
      return;
    }

    const orderPayload: CreateOrderPayload = {
      branchId: selectedBranch!._id,
      fulfillmentType: orderDetails.fulfillmentType,
      firstName,
      lastName,
      customerEmail,
      customerPhone: customerPhone || "",
      paymentMethod: selectedPayment,
      notes,
      applyPromoCardDiscount,
      voucherAmount: parsedVoucherAmount,
      items: cartItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({ _id: item._id, quantity: item.quantity })),
      ...(isDelivery && {
        shippingAddress: {
          line1,
          line2,
          city,
          zipCode,
          province,
          country,
          landmark,
          coordinates,
          placeName,
        },
      }),
    };

    try {
      if (selectedPayment === "cod") {
        setIsCodPending(true);
        try {
          const codOrder = await createCodOrder(orderPayload);
          toast.success("Order placed successfully!");
          await clearCart();
          if (session?.user) {
            router.push(`/orders?status=pending`);
          } else {
            router.push(
              `/orders/guest/${encodeURIComponent(codOrder.referenceNumber)}`,
            );
          }
        } finally {
          setIsCodPending(false);
        }
      } else {
        const data = await createOrder({
          ...orderPayload,
          paymentMethod: "maya",
        });

        if (!data.redirectUrl) {
          throw new Error(
            "Payment link was not generated. Please try again or contact support.",
          );
        }
        // clear cart and draft before redirecting to ensure a clean state when user returns from payment
        window.sessionStorage.removeItem("checkout_order_draft");
        await clearCart();
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      toast.error("Order Failed", {
        description:
          error instanceof Error ? error.message : "Failed to place order.",
      });
      console.log(error instanceof Error ? error.message : error);
    }
  };

  const isSubmitStep = checkoutActionMode === "submit";

  if (cartItems.length === 0) {
    return (
      <div className="bg-brand-color-50 text-center min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="bg-white p-12 rounded-xl shadow">
          <DynamicIcon
            name="ShoppingBag"
            size={64}
            className="mx-auto text-slate-200 mb-4"
          />
          <h3 className="text-xl text-slate-500 mb-2">Your cart is empty</h3>
          <p className="text-slate-400">
            Add your favourite before checking out!
          </p>
          <OrderNowButton />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {/* High demand banner */}
      {isAtCapacity && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <DynamicIcon name="Clock" size={16} className="text-amber-500" />
            <p className="text-sm font-bold text-amber-700">
              We&apos;re Experiencing High Demand
            </p>
          </div>
          <p className="text-xs text-amber-600">
            We&apos;re currently at capacity and can&apos;t accept new orders at this moment.
            We&apos;ll be ready shortly — please check back soon!
          </p>
        </div>
      )}

      {/* Cart Items */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Order summary
            </h2>
            <span className="text-xs text-slate-400">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Cart items list */}
        <div className="px-5 py-4 divide-y divide-slate-100 max-h-72 overflow-y-auto hide-scrollbar">
          {cartItems.map((item, index) => (
            <CartRow
              key={index}
              item={item}
              onRemove={removeFromCart}
              onUpdate={updateQuantity}
            />
          ))}
        </div>

        {/* Order Totals */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
          {isPromoCardEnabled && (
            <label className="flex items-start gap-3 rounded-xl border border-brand-color-500/20 bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={applyPromoCardDiscount}
                onChange={(event) =>
                  setApplyPromoCardDiscount(event.target.checked)
                }
                disabled={!canUsePromoCardDiscount}
                className="mt-1 h-4 w-4 accent-brand-color-500"
              />
              <span className="flex-1">
                <span className="block font-semibold text-slate-800">
                  Apply {promoCardConfig.name}
                </span>
                <span className="block text-xs text-slate-500">
                  {canUsePromoCardDiscount
                    ? `Enjoy ${(activeDiscountRate * 100).toFixed(0)}% off this order today.`
                    : "Purchase and pay for a promo card to unlock this discount."}
                </span>
              </span>
            </label>
          )}
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotalPrice.toFixed(2)}</span>
          </div>
          {productDiscountAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Product discounts</span>
              <span>-PHP {productDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          {promoCardDiscount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Promo card discount</span>
              <span>-₱{promoCardDiscount.toFixed(2)}</span>
            </div>
          )}
          {orderDiscountAmount > 0 && (
            <div className="flex justify-between gap-3 text-sm font-semibold text-green-600">
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
            <label className="block rounded-xl border border-green-200 bg-white p-3 text-sm">
              <span className="block font-semibold text-slate-800">
                Use voucher balance
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Available: ₱{availableVoucherBalance.toFixed(2)}
              </span>
              <input
                type="number"
                min={0}
                max={Math.min(availableVoucherBalance, discountAdjustedTotal)}
                step={0.01}
                value={voucherAmount}
                onChange={(event) => setVoucherAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-color-500"
                placeholder="Enter voucher amount"
              />
            </label>
          )}
          {parsedVoucherAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Voucher discount</span>
              <span>-₱{parsedVoucherAmount.toFixed(2)}</span>
            </div>
          )}
          {isDelivery && (deliveryFeeAmount > 0 || isDeliveryFeeLoading) && (
            <div className="flex justify-between gap-3 text-sm">
              <span className={freeDeliveryEligible ? "text-green-600 font-semibold" : "text-green-500"}>
                Delivery fee
                {deliveryFeeEstimate?.data.distanceKm != null && (
                  <span className="ml-1 text-xs">
                    ({deliveryFeeEstimate.data.distanceKm.toFixed(2)} km)
                  </span>
                )}
              </span>
              {freeDeliveryEligible ? (
                <span className="flex items-center gap-1.5">
                  <span className="line-through text-slate-400">₱{deliveryFeeAmount.toFixed(2)}</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </span>
              ) : (
                <span className="text-slate-500">
                  {isDeliveryFeeLoading
                    ? "Calculating..."
                    : `₱${deliveryFeeAmount.toFixed(2)}`}
                </span>
              )}
            </div>
          )}
          {isDelivery && !freeDeliveryEligible && freeDeliveryReason && !isDeliveryFeeLoading && (
            <p className="text-xs font-medium text-red-600">
              {freeDeliveryReason}
            </p>
          )}
          {isDelivery && isDeliveryFeeError && (
            <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500">
              Delivery fee could not be calculated. Please adjust your pin or
              try again.
            </p>
          )}
          <div className="flex justify-between text-sm text-slate-500">
            <span>VATable Sales</span>
            <span>₱{displayVatableSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>VAT (12%)</span>
            <span>₱{displayVatAmount.toFixed(2)}</span>
          </div>
          <div className="  flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-sm font-semibold text-slate-900">
              Total (VAT Inc)
            </span>
            <span className="text-lg font-bold text-brand-color-500">
              ₱{displayTotalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Estimated time hint */}
      <div className="flex items-center gap-2 px-1">
        <DynamicIcon name="Clock" size={13} className=" text-slate-400" />
        <p className="text-xs text-gray-400">
          Estimated prep time: 30 - 45 minutes
        </p>
      </div>

      {/* CTA */}
      <>
        <button
          onClick={isSubmitStep ? handlePlaceOrder : handleNext}
          disabled={isActionPending || isNextDisabled}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
            isPending || isNextDisabled || isCodPending
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "cursor-pointer bg-brand-color-500 hover:bg-[#c13500] active:scale-[0.98] text-white shadow-sm shadow-brand-color-500/20"
          }`}
        >
          {isActionPending ? (
            <span className="flex items-center gap-2 justify-center">
              Placing order…
              <DynamicIcon name="Loader" size={14} className="animate-spin" />
            </span>
          ) : isSubmitStep && !isDelivery ? (
            <span className="flex items-center gap-2 justify-center">
              Place Pickup Order
              <DynamicIcon name="ShoppingBag" size={14} />
            </span>
          ) : isSubmitStep ? (
            <span className="flex items-center gap-2 justify-center">
              Place Order
              <DynamicIcon name="ShoppingBag" size={14} />
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Next — {isDelivery ? "Shipping details" : "Pickup details"}
              <DynamicIcon name="ArrowRight" size={14} />
            </span>
          )}
        </button>

        {/* show which fields are still missing */}
        {isNextDisabled && !selectedBranch && (
          <p className="text-xs text-center text-red-400">
            Select a branch to continue
          </p>
        )}

        {isNextDisabled && selectedBranch && isAtCapacity && (
          <p className="text-xs text-center text-amber-500">
            Currently at capacity — please check back shortly
          </p>
        )}

        {isNextDisabled && selectedBranch && !isAtCapacity && (
          <p className="text-xs text-center text-red-400">
            Complete all required fields to continue
          </p>
        )}
      </>

      <Link
        href="/"
        className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2 pt-1"
      >
        Need to add more items?
      </Link>

      <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        By placing an order, you agree to our{" "}
        <span className="font-semibold text-slate-600">Terms of Service</span>,{" "}
        <Link
          href="/policies/privacy-policy"
          className="font-semibold text-brand-color-600 hover:underline"
        >
          Privacy Policy
        </Link>
        , and delivery service guidelines, including use of your provided
        contact details and delivery location to process the order.
      </p>

      {showPaymentOptions && (
        <Modal
          title="Choose Payment Method"
          onClose={() => setShowPaymentOptions(false)}
        >
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {/* Maya */}
              <PaymentButton
                id="maya"
                label="Maya"
                description="Pay via Maya e-wallet or card"
                badge="Instant"
                imageSrc="/images/maya-white.png"
                imageAlt="Maya"
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
              />
              <PaymentButton
                id="cod"
                label={isDelivery ? "Cash on Delivery" : "Cash on Pickup"}
                description="Pay when your order arrives"
                badge="No fee"
                imageSrc="/images/cod-icon.png"
                imageAlt={isDelivery ? "Cash on Delivery" : "Cash on Pickup"}
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
              />
            </div>
            {/* Confirm */}
            <button
              disabled={!selectedPayment}
              onClick={() => {
                trackAddPaymentInfo({
                  content_category: selectedPayment === "maya" ? "Maya" : "Cash on Delivery",
                  currency: "PHP",
                  value: totalPrice,
                });
                handlePlaceOrder();
                setShowPaymentOptions(false);
              }}
              className="w-full py-3 mt-1 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600
    disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Confirm Payment
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CartList;
