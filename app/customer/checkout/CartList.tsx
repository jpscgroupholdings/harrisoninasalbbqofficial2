import OrderNowButton from "@/components/ui/OrderNowButton";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/api/useOrders";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { Branch } from "@/types/branch";
import { OrderType } from "@/types/OrderTypes";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { CustomerSchema, OrderFormState, ShippingSchema } from "./FormSchema";
import useFormErrors from "./useFormErrors";
import { CheckoutStep } from "./ClientPage";

/** Single cart row */
const CartRow = ({
  item,
  onRemove,
  onUpdate,
}: {
  item: any;
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
  step: CheckoutStep;
  onNext: () => void;
};

const CartList = ({
  selectedBranch,
  orderDetails,
  step,
  onNext,
}: CartListProps) => {
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
    vatableSales,
    vatAmount,
    totalPrice,
    clearCart,
  } = useCart();

  // check if current step has any errors or empty required fields
  const isDetailsIncomplete =
    !orderDetails.customer.firstName ||
    !orderDetails.customer.lastName ||
    !orderDetails.customer.customerEmail;

  const isShippingIncomplete =
    !orderDetails.shippingAddress.line1 ||
    !orderDetails.shippingAddress.city ||
    !orderDetails.shippingAddress.province ||
    !orderDetails.shippingAddress.zipCode;

  const isNextDisabled =
    !selectedBranch ||
    (step === "customer" && isDetailsIncomplete) ||
    (step === "shipping" && isShippingIncomplete);

  const handleNext = () => {
    // validate current step only before proceeding
    const result =
      step === "customer"
        ? CustomerSchema.safeParse(orderDetails.customer)
        : ShippingSchema.safeParse(orderDetails.shippingAddress);

    if (!result.success) {
      toast.error("Please fix the errors before continuing.");
      return;
    }

    onNext(); // parent pushes ?step=shipping or whatever
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validateAll()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!selectedBranch) {
      toast.error("Please select a branch.");
      return;
    }

    const MINIMUM_AMOUNT = 100;

    if (totalPrice < MINIMUM_AMOUNT) {
      toast.warning("Minimum Order Amount", {
        description: `The minimum amount for online payment is ₱${MINIMUM_AMOUNT.toFixed(2)}.`,
        duration: 6000,
      });
      return;
    }

    try {
      const data = await createOrder({
        branchId: selectedBranch!._id,
        firstName,
        lastName,
        customerEmail,
        customerPhone: customerPhone || "",
        notes,

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
      });

      if (!data.redirectUrl) {
        throw new Error(
          "Payment link was not generated. Please try again or contact support.",
        );
      }

      window.location.href = data.redirectUrl;

      clearCart();
    } catch (error: any) {
      toast.error("Order Failed", {
        description: error.message,
      });
    }
  };

  const isSubmitStep = step === "shipping";

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
          <div className="flex justify-between text-sm text-slate-500">
            <span>VATable Sales</span>
            <span>₱{vatableSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>VAT (12%)</span>
            <span>₱{vatAmount.toFixed(2)}</span>
          </div>
          <div className="  flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-sm font-semibold text-slate-900">
              Total (VAT Inc)
            </span>
            <span className="text-lg font-bold text-brand-color-500">
              ₱{totalPrice.toFixed(2)}
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
          disabled={isPending || isNextDisabled}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
            isPending || isNextDisabled
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "cursor-pointer bg-brand-color-500 hover:bg-[#c13500] active:scale-[0.98] text-white shadow-sm shadow-brand-color-500/20"
          }`}
        >
          {isPending ? (
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
    </div>
  );
};

export default CartList;
