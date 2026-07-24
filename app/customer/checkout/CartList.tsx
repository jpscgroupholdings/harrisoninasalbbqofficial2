import OrderNowButton from "@/components/ui/OrderNowButton";
import { useCart, getCartKey } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/api/customers/useCustomerOrders";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useSettings } from "@/hooks/api/useSettings";
import { getStoreStatus } from "@/lib/storeStatus";
import { Branch } from "@/types/branch";
import Link from "next/link";
import { toast } from "sonner";
import { CustomerSchema, OrderFormState, ShippingSchema,ReservationSchema } from "./FormSchema";
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
  multiplyMoney,
  subtractMoney,
} from "@/lib/money";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";
import { FREE_DELIVERY_ENABLED } from "@/lib/deliveryFee";
import { getCheckoutActionMode } from "./checkoutAction";
import { useBranchCapacity } from "@/hooks/api/useBranchCapacity";
import { AppImage } from "@/components/AppImage";
import { formatCurrency } from "@/helper/formatter/";
import { Checkbox, InputField } from "@/components/ui/FormComponents";
import { validatePickupTime } from "@/lib/operatingHours";
import { SummaryRow } from "@/components/ui/SummaryRow";
import ProductRecommendations from "../components/ProductRecommendations";
import { IconButton } from "@/components/ui/buttons";
import CartItemRow from "@/components/customer/CartItemRow";

const createCodOrder = async (payload: CreateOrderPayload) => {
  const response = await apiClient.post<{
    success: boolean;
    referenceNumber: string;
  }>("/customer/cod-checkout", payload);

  return response;
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
            <AppImage src={imageSrc} alt={imageAlt} />
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
  const isDineIn = orderDetails.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;
  const isPickup = orderDetails.fulfillmentType === FULFILLMENT_TYPE.PICKUP;
  const checkoutActionMode = getCheckoutActionMode({
    pathname,
    fulfillmentType: orderDetails.fulfillmentType,
  });

  const { data: branchCapacity } = useBranchCapacity(
    selectedBranch?._id ?? null,
    orderDetails.fulfillmentType ?? null,
  );
  const isAtCapacity = branchCapacity?.canAcceptOrders === false;

  // Check if the store is currently open — disables checkout when closed
  const { data: settings } = useSettings();
  const storeStatus = settings?.operatingHours
    ? getStoreStatus(settings.operatingHours)
    : null;
  const isStoreClosed = storeStatus ? !storeStatus.isOpen : false;
  const storeClosedInfo =
    storeStatus && !storeStatus.isOpen
      ? {
          title: storeStatus.title,
          body: storeStatus.body,
          suggestion: storeStatus.suggestion,
        }
      : null;

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
  const discountAdjustedTotal = clampMoneyMin(
    subtractMoney(totalPrice, orderDiscountAmount),
  );
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
    addMoney(
      subtractMoney(discountAdjustedTotal, parsedVoucherAmount),
      effectiveDeliveryFee,
    ),
  );
  const displayVatableSales = multiplyMoney(displayTotalPrice, 1 / 1.12);
  const displayVatAmount = subtractMoney(
    displayTotalPrice,
    displayVatableSales,
  );

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
  const isReservationIncomplete =
    isDineIn && !ReservationSchema.safeParse(orderDetails.reservation).success;
  const pickupTimeValidationError = isPickup
    ? validatePickupTime(orderDetails.pickupTime, settings?.operatingHours)
    : null;
  const isPickupTimeIncomplete = isPickup && !!pickupTimeValidationError;

  const isNextDisabled =
    isStoreClosed ||
    !selectedBranch ||
    isAtCapacity ||
    (isDetails &&
      (isDetailsIncomplete ||
        isReservationIncomplete ||
        isPickupTimeIncomplete)) ||
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

    // Frontend business-rule guard — catches issues before hitting the API.
    // Server-side validation is the final safety net.
    if (pickupTimeValidationError) {
      toast.error(pickupTimeValidationError);
      return;
    }

    if (!selectedBranch) {
      toast.error("Please select a branch.");
      return;
    }

    const MINIMUM_AMOUNT = 100;

    if (displayTotalPrice < MINIMUM_AMOUNT) {
      toast.warning("Minimum Order Amount", {
        description: `The minimum amount for online payment is ${formatCurrency(MINIMUM_AMOUNT)}.`,
        duration: 6000,
      });
      return;
    }

    // Guard: prevent submitting items with empty or invalid quantities
    const validCartItems = cartItems.filter((item) => item.quantity >= 1);
    if (validCartItems.length === 0) {
      toast.error("Your cart has no valid items. Please update quantities.");
      return;
    }
    if (validCartItems.length !== cartItems.length) {
      toast.warning(
        "Some items with invalid quantities were removed from your order.",
      );
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
      items: validCartItems.map((item) => ({
        _id: item._id,
        quantity: item.quantity,
        // Include modifier selections for combo/set products so they persist on the order
        ...(item.modifierSelections && item.modifierSelections.length > 0
          ? { modifierSelections: item.modifierSelections }
          : {}),
      })),
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
      ...(isDineIn && {
        reservation: {
          scheduledAt: orderDetails.reservation.scheduledAt,
          partySize: orderDetails.reservation.partySize,
        },
      }),
      ...(isPickup && {
        pickupTime: orderDetails.pickupTime,
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
          // ── Maya Payment Flow Toggle ──
          // true  → QR PH only (direct QR code page). Uses MAYA_QR_PUBLIC_KEY + /payments/v1/qr/payments
          // false → Full payment page (card, QR, bank, etc.). Uses MAYA_PUBLIC_KEY + /checkout/v1/checkouts
          useQrPh: true,
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
    <div className="flex flex-col 2xl:flex-row gap-4 min-w-auto 2xl:min-w-3xl relative">
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
              We&apos;re currently at capacity and can&apos;t accept new orders
              at this moment. We&apos;ll be ready shortly — please check back
              soon!
            </p>
          </div>
        )}
        {/* Cart Items */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <SummaryRow
              title="Order summary"
              subTitle={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`}
              className={{ title: "text-base font-semibold text-black" }}
            />
          </div>
          {/* Cart items list */}
          <div className="px-5 py-4 divide-y divide-slate-100 max-h-96 overflow-y-auto hide-scrollbar">
            {cartItems.map((item) => (
              <CartItemRow
                key={getCartKey(item)}
                item={item}
                onRemove={removeFromCart}
                onUpdate={updateQuantity}
              />
            ))}
          </div>
          {/* Order Totals */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
            {isPromoCardEnabled && (
              <div className="bg-white border border-brand-color-500/20 rounded-lg">
                <Checkbox
                  label={`Apply ${promoCardConfig.name}`}
                  subLabel={
                    canUsePromoCardDiscount
                      ? `Enjoy ${(activeDiscountRate * 100).toFixed(0)}% off this order today.`
                      : "Purchase a promo card to unlock this discount."
                  }
                  checked={applyPromoCardDiscount}
                  onChange={(event) =>
                    setApplyPromoCardDiscount(event.target.checked)
                  }
                  disabled={!canUsePromoCardDiscount}
                  wrapperClassName="py-6"
                />
              </div>
            )}
            <SummaryRow
              title="Subtotal"
              subTitle={formatCurrency(subtotalPrice)}
            />
            {productDiscountAmount > 0 && (
              <SummaryRow
                title="Product discounts"
                subTitle={`- ${formatCurrency(productDiscountAmount)}`}
                className={{ title: "text-green-600" }}
              />
            )}
            {promoCardDiscount > 0 && (
              <SummaryRow
                title="Promo card discount"
                subTitle={`- ${formatCurrency(promoCardDiscount)}`}
                className={{ title: "text-green-600" }}
              />
            )}
            {orderDiscountAmount > 0 && (
              <SummaryRow
                title={orderDiscountPromotion?.name || "Order Discount"}
                subTitle={`- ${formatCurrency(orderDiscountAmount)}`}
                className={{ title: "text-green-600 min-w-0 truncate" }}
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
              <InputField
                label="Use voucher balance"
                subLabel={`Available ${formatCurrency(availableVoucherBalance)}`}
                type="number"
                min={0}
                max={Math.min(availableVoucherBalance, discountAdjustedTotal)}
                step={0.01}
                value={voucherAmount}
                onChange={(event) => setVoucherAmount(event.target.value)}
                placeholder="Enter voucher amount"
              />
            )}
            {parsedVoucherAmount > 0 && (
              <SummaryRow
                title="Voucher discount"
                subTitle={`- ${formatCurrency(parsedVoucherAmount)}`}
                className={{ title: "text-green-600" }}
              />
            )}
            {isDelivery && (deliveryFeeAmount > 0 || isDeliveryFeeLoading) && (
              <div className="flex justify-between gap-3 text-sm">
                <span
                  className={
                    freeDeliveryEligible
                      ? "text-green-600 font-semibold"
                      : "text-green-500"
                  }
                >
                  Delivery fee
                  {deliveryFeeEstimate?.data.distanceKm != null && (
                    <span className="ml-1 text-xs">
                      ({deliveryFeeEstimate.data.distanceKm.toFixed(2)} km)
                    </span>
                  )}
                </span>
                {freeDeliveryEligible ? (
                  <span className="flex items-center gap-1.5">
                    <span className="line-through text-slate-400">
                      {formatCurrency(deliveryFeeAmount)}
                    </span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {isDeliveryFeeLoading
                      ? "Calculating..."
                      : formatCurrency(deliveryFeeAmount)}
                  </span>
                )}
              </div>
            )}
            {isDelivery &&
              !freeDeliveryEligible &&
              freeDeliveryReason &&
              !isDeliveryFeeLoading && (
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
                title: "font-bold text-slate-900",
                subTitle: "text-lg font-bold text-brand-color-500",
              }}
            />
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
          <IconButton
            onClick={isSubmitStep ? handlePlaceOrder : handleNext}
            disabled={isActionPending || isNextDisabled}
            text={
              isActionPending
                ? "Placing Order..."
                : isSubmitStep && isDineIn
                  ? "Confirm Reservation"
                  : isSubmitStep && !isDelivery
                    ? "Place Pickup Order"
                    : isSubmitStep
                      ? "Place Order"
                      : `Next —${isDelivery ? "Shipping Details" : isDineIn ? "Reservaton Details" : "Pickup Details"}`
            }
            icon={{
              name: isActionPending
                ? "Loader2"
                : isSubmitStep && isDineIn
                  ? "CalendarCheck"
                  : (isSubmitStep && !isDelivery) || isSubmitStep
                    ? "ShoppingBag"
                    : "ArrowRight",
              className: isActionPending ? "animate-spin" : "",
            }}
            className="py-3.5 rounded-2xl w-full"
          />
          {/* show which fields are still missing */}
          {isNextDisabled && !selectedBranch && !isStoreClosed && (
            <p className="text-xs text-center text-red-400">
              Select a branch to continue
            </p>
          )}
          {isNextDisabled && selectedBranch && isAtCapacity && (
            <p className="text-xs text-center text-amber-500">
              Currently at capacity — please check back shortly
            </p>
          )}
          {isStoreClosed && storeClosedInfo && (
            <div className="bg-red-50 border border-red-200/60 rounded-2xl px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DynamicIcon name="Store" size={14} className="text-red-500" />
                <p className="text-xs font-bold text-red-700">
                  {storeClosedInfo.title}
                </p>
              </div>
              <p className="text-xs text-red-600">{storeClosedInfo.body}</p>
              <p className="text-xs text-red-500 mt-1">
                {storeClosedInfo.suggestion}
              </p>
            </div>
          )}
          {isNextDisabled &&
            selectedBranch &&
            !isAtCapacity &&
            !isStoreClosed && (
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
        {!isStoreClosed && (
          <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            By placing an order, you agree to our{" "}
            <span className="font-semibold text-slate-600">
              Terms of Service
            </span>
            ,{" "}
            <Link
              href="/policies/privacy-policy"
              className="font-semibold text-brand-color-600 hover:underline"
            >
              Privacy Policy
            </Link>
            , and delivery service guidelines, including use of your provided
            contact details and delivery location to process the order.
          </p>
        )}
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
                  label={
                    isDelivery
                      ? "Cash on Delivery"
                      : isDineIn
                        ? "Pay at Branch"
                        : "Cash on Pickup"
                  }
                  description="Pay when your order arrives"
                  badge="No fee"
                  imageSrc="/images/cod-icon.png"
                  imageAlt={
                    isDelivery
                      ? "Cash on Delivery"
                      : isDineIn
                        ? "Pay at Branch"
                        : "Cash on Pickup"
                  }
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                />
              </div>
              {/* Confirm */}
              <IconButton
                disabled={isStoreClosed || !selectedPayment}
                onClick={() => {
                  trackAddPaymentInfo({
                    content_category:
                      selectedPayment === "maya" ? "Maya" : "Cash on Delivery",
                    currency: "PHP",
                    value: totalPrice,
                  });
                  handlePlaceOrder();
                  setShowPaymentOptions(false);
                }}
                text="Confirm Payment"
                variant="primary"
                className="bg-green-500 hover:bg-green-600 rounded-lg py-3"
              />
              {isStoreClosed && storeClosedInfo && (
                <p className="text-xs text-center text-red-500 mt-2">
                  {storeClosedInfo.body} — {storeClosedInfo.suggestion}
                </p>
              )}
            </div>
          </Modal>
        )}
      </div>

      <div className="sticky top-24 w-full">
        <ProductRecommendations
          branchId={selectedBranch?._id ?? null}
          excludeIds={cartItems.map((item) => item._id)}
          title="You may also like"
          layout="column"
        />
      </div>
    </div>
  );
};

export default CartList;
