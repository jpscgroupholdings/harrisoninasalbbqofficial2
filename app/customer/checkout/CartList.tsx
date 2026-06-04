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
import {
  getPromoCardDay,
  getPromoCardDiscountRateForDay,
  PROMO_CARD,
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  PromoCardDay,
} from "@/lib/promoCard";
import { CartItem } from "@/types/MenuTypes";
import type { ActivePromotionsResponse } from "@/types/promotions.type";
import { useQuery } from "@tanstack/react-query";

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
}) => (
  <div className="flex gap-3 py-3 first:pt-0">
    <img
      src={item.image}
      alt={item.name || "Product"}
      className="w-14 h-14 rounded-xl object-cover shrink-0"
    />
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

        <span className="text-sm font-bold text-brand-color-500">
          ₱{(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  </div>
);

type CartListProps = {
  selectedBranch: Branch | null;
  orderDetails: OrderFormState;
  onNext: () => void;
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
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-contain"
          />
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
            days: PromoCardDay[];
            discountRate: number;
          }[];
        };
      }>("/customer/promo-card/status"),
    enabled: Boolean(session?.user),
    staleTime: 60_000,
  });
  const canUsePromoCardDiscount =
    promoCardStatus?.hasPaidPromoCard === true;
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
    queryFn: () => apiClient.get<ActivePromotionsResponse>("/promotions/active"),
    staleTime: 60_000,
  });

  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const { validateAll, customerErrors, shippingErrors } =
    useFormErrors(orderDetails);

  const { firstName, lastName, customerPhone, customerEmail, notes } =
    orderDetails?.customer;
  const { line1, line2, city, zipCode, province, country, landmark } =
    orderDetails?.shippingAddress;

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    subtotalPrice,
    promoCardDiscount,
    totalPrice,
    applyPromoCardDiscount,
    setApplyPromoCardDiscount,
    setPromoCardDiscountRate,
    clearCart,
  } = useCart();
  const orderDiscountPromotion = activePromotions?.data
    ?.filter((promotion) => subtotalPrice >= promotion.minimumOrderAmount)
    .map((promotion) => {
      const discountAmount =
        promotion.discountType === "fixed"
          ? Math.min(promotion.discountValue, totalPrice)
          : Math.min(
              Number(
                (totalPrice * (promotion.discountValue / 100)).toFixed(2),
              ),
              promotion.maximumDiscountAmount ?? Number.POSITIVE_INFINITY,
            );

      return {
        name: promotion.name,
        discountAmount,
      };
    })
    .filter((promotion) => promotion.discountAmount > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0];
  const orderDiscountAmount = orderDiscountPromotion?.discountAmount ?? 0;
  const discountAdjustedTotal = Number(
    Math.max(totalPrice - orderDiscountAmount, 0).toFixed(2),
  );
  const [voucherAmount, setVoucherAmount] = useState("");
  const parsedVoucherAmount = Math.min(
    Math.max(0, Number(voucherAmount || 0)),
    availableVoucherBalance,
    discountAdjustedTotal,
  );
  const displayTotalPrice = Number(
    Math.max(discountAdjustedTotal - parsedVoucherAmount, 0).toFixed(2),
  );
  const displayVatableSales = displayTotalPrice / 1.12;
  const displayVatAmount = displayTotalPrice - displayVatableSales;

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
  const isShippingIncomplete = !ShippingSchema.safeParse(
    orderDetails.shippingAddress,
  ).success;

  const isNextDisabled =
    !selectedBranch ||
    (isDetails && isDetailsIncomplete) ||
    (isShipping && isShippingIncomplete);

  const handleNext = () => {
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
      const errors = Object.values(customerErrors || shippingErrors).filter(
        Boolean,
      );

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      } else {
        toast.error("Please complete all required fields.");
      }
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

    const orderPayload = {
      branchId: selectedBranch!._id,
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
      shippingAddress: {
        line1,
        line2,
        city,
        zipCode,
        province,
        country,
        landmark,
      },
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

        await clearCart();
        window.location.href = data.redirectUrl;
      }
    } catch (error: any) {
      toast.error("Order Failed", {
        description: error.message,
      });
      console.log(error.message);
    }
  };

  const isSubmitStep = isShipping;

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
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotalPrice.toFixed(2)}</span>
          </div>
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
          onClick={
            isSubmitStep ? () => setShowPaymentOptions(true) : handleNext
          }
          disabled={isPending || isNextDisabled || isCodPending}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
            isPending || isNextDisabled || isCodPending
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "cursor-pointer bg-brand-color-500 hover:bg-[#c13500] active:scale-[0.98] text-white shadow-sm shadow-brand-color-500/20"
          }`}
        >
          {isPending || isCodPending ? (
            <span className="flex items-center gap-2 justify-center">
              Placing order…
              <DynamicIcon name="Loader" size={14} className="animate-spin" />
            </span>
          ) : isSubmitStep ? (
            <span className="flex items-center gap-2 justify-center">
              Place Order
              <DynamicIcon name="ShoppingBag" size={14} />
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Next — Shipping details
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

        {isNextDisabled && selectedBranch && (
          <p className="text-xs text-center text-slate-400">
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
                label="Cash on Delivery"
                description="Pay when your order arrives"
                badge="No fee"
                imageSrc="/images/cod-icon.png"
                imageAlt="Cash on Delivery"
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
              />
            </div>
            {/* Confirm */}
            <button
              disabled={!selectedPayment}
              onClick={() => {
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
