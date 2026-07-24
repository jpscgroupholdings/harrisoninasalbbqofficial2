"use client";

import { usePathname } from "next/navigation";
import { CheckoutHeader } from "./CheckoutHeader";
import { syne } from "@/app/font";
import CartList from "./CartList";
import BranchSelector from "./BranchSelector";
import { CheckoutStep, useCheckout } from "@/contexts/CheckoutContext";
import { FulfillmentSelector } from "./FulfillmentSelector";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";
import ProductRecommendations from "../components/ProductRecommendations";
import { useCart } from "@/contexts/CartContext";

const CheckoutShell = ({ children }: { children: React.ReactNode }) => {

  const { cartItems} = useCart();

  const {
    selectedBranch,
    orderDetails,
    handleFulfillmentTypeChange,
    handleNext,
  } = useCheckout();

  const pathname = usePathname();
  const details = pathname === CheckoutStep.DETAILS;
  const isPickup = orderDetails.fulfillmentType === FULFILLMENT_TYPE.PICKUP;
  const isDineIn = orderDetails.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;

  return (
    <div className={`${syne.className} min-h-screen bg-slate-50`}>
      <CheckoutHeader step={pathname} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {/* Shared header */}
            <div className="pb-6">
              <h2 className="text-base font-semibold text-slate-900">
                {details
                  ? "Your details"
                  : isDineIn
                    ? "Reservation details"
                    : isPickup
                      ? "Pickup details"
                      : "Shipping address"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {details
                  ? "We'll use this to process and contact you about your order."
                  : isDineIn
                    ? "Confirm your reservation at the selected branch."
                    : isPickup
                      ? "Review where you will collect your order."
                      : "Where should we deliver your order?"}
              </p>
            </div>

            <BranchSelector selectedBranch={selectedBranch} />

            <FulfillmentSelector
              value={orderDetails.fulfillmentType}
              onChange={handleFulfillmentTypeChange}
            />

            {children}
          </div>

          <CartList
            selectedBranch={selectedBranch}
            orderDetails={orderDetails}
            onNext={handleNext}
          />
        </div>

        <div className="bg-white p-4 rounded-lg">
          <ProductRecommendations
            branchId={selectedBranch?._id ?? null}
            excludeIds={cartItems.map((item) => item._id)}
            title="You may also like"
            layout="grid"
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutShell;
