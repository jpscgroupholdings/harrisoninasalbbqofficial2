"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import OrderNowButton from "@/components/ui/OrderNowButton";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/api/useOrders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syne } from "@/app/font";
import { InputField } from "@/components/ui/InputField";
import { useBranch } from "@/contexts/BranchContext";
import { TextareaField } from "@/components/ui/TextAreaField";
import { Branch } from "@/types/branch";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/lib/DynamicIcon";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  branch?: string;
}

/** Thin transparent top bar — logo-level minimal */
const CheckoutHeader = () => (
  <header className="z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <Link
        href="/menu"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <DynamicIcon name="ArrowLeft" size={15} />
        <span>Back to menu</span>
      </Link>
      <p className="text-xl font-semibold tracking-tight text-slate-900">
        Checkout
      </p>
      {/* Spacer to center the title */}
      <div className="w-24" />
    </div>
  </header>
);

const BranchBadge = ({ branch }: { branch: Branch }) => (
  <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 px-3.5 py-3">
    <DynamicIcon
      name="MapPin"
      size={14}
      className="text-brand-color-500 mt-0.5 shrink-0"
    />
    <div className="min-w-0">
      <p className="text-xs font-medium text-brand-color-900 truncate">
        {branch.name}
      </p>
      {branch.address && (
        <p className="text-xs text-brand-color-600 mt-0.5 leading-snug">
          {branch.address}
        </p>
      )}
    </div>
  </div>
);

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

const OrderSummaryStep = () => {
  const { selectedBranch } = useBranch();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    vatableSales,
    vatAmount,
    totalPrice,
    clearCart,
  } = useCart();

  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  const { openModal } = useModalQuery();

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    note: "",
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "name":
        return value.trim() ? "" : "Full name is required.";
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        if (!/^(09|\+639)\d{9}$/.test(value.replace(/\s/g, "")))
          return "Enter a valid PH mobile number.";
        return "";
      case "email":
        if (!value.trim()) return ""; // optional
        return /^\S+@\S+\.\S+$/.test(value)
          ? ""
          : "Enter a valid email address.";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(
        field,
        customerDetails[field as keyof typeof customerDetails],
      ),
    }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField("name", customerDetails.name),
      phone: validateField("phone", customerDetails.phone),
      email: validateField("email", customerDetails.email),
      branch: selectedBranch?._id
        ? ""
        : "No branch selected. Please go back and select one.",
    };
    // Remove empty strings
    Object.keys(newErrors).forEach((k) => {
      if (!newErrors[k as keyof FormErrors])
        delete newErrors[k as keyof FormErrors];
    });
    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true });
    return Object.keys(newErrors).length === 0;
  };

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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validateAll()) {
      toast.error("Please fix the errors before continuing.");
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
        customerName: customerDetails.name.trim(),
        customerEmail: customerDetails.email.trim() || undefined,
        customerPhone: customerDetails.phone.trim(),
        note: customerDetails.note.trim() || undefined,
        items: cartItems
          .filter((item) => item.quantity > 0)
          .map((item) => ({ _id: item._id, quantity: item.quantity })),
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

  return (
    <div className={`${syne.className} min-h-screen bg-slate-50`}>
      <CheckoutHeader />

      {/** Page body - offset for fixed header */}
      <div className="">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
            {/* ── LEFT: Customer Details ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Your details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  We'll use this to process and contact you about your order.
                </p>
              </div>

              {/* Branch badge */}
              {selectedBranch ? (
                <BranchBadge branch={selectedBranch} />
              ) : (
                <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <DynamicIcon
                      name="MapPin"
                      size={14}
                      className="text-red-400 shrink-0"
                    />
                    <p className="text-sm text-red-500 font-medium">
                      No branch selected
                    </p>
                  </div>
                  <button
                    className="text-sm underline text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    onClick={() => openModal(MODAL_TYPES.MAP)}
                  >
                    Select Branch
                  </button>
                </div>
              )}

              <InputField
                label="Full Name"
                placeholder="Juan Dela Cruz"
                type="text"
                name="name"
                value={customerDetails.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                required
                leftIcon={<DynamicIcon name="User" size={15} />}
                error={errors.name}
              />
              <InputField
                label="Phone number"
                placeholder="09171234567"
                type="tel"
                name="phone"
                value={customerDetails.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                required
                leftIcon={<DynamicIcon name="Phone" size={15} />}
                error={errors.phone}
              />
              <InputField
                label="Email"
                placeholder="juan@example.com"
                type="email"
                name="email"
                value={customerDetails.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                leftIcon={<DynamicIcon name="Mail" size={15} />}
                error={errors.email}
              />
              <TextareaField
                label="Note (Optional)"
                placeholder="Enter any special instructions for your order"
                name="note"
                value={customerDetails.note}
                onChange={(e) => handleChange("note", e.target.value)}
              />
            </div>

            {/* ── RIGHT: Order Summary ───────────────────────────────────── */}
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
                <DynamicIcon
                  name="Clock"
                  size={13}
                  className=" text-slate-400"
                />
                <p className="text-xs text-gray-400">
                  Estimated prep time: 30 - 45 minutes
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPending || !selectedBranch}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isPending || !selectedBranch
                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                    : "cursor-pointer bg-brand-color-500 hover:bg-[#c13500] active:scale-[0.98] text-white shadow-sm shadow-brand-color-500/20"
                }`}
              >
                {isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    Placing order…
                    <DynamicIcon
                      name="Loader"
                      size={14}
                      className="animate-spin"
                    />
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>

              <Link
                href="/"
                className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2 pt-1"
              >
                Need to add more items?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryStep;
