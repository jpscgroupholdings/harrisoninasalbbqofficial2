"use client";

import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import CustomerDetails from "./CustomerDetails";
import { CheckoutHeader } from "./CheckoutHeader";
import { syne } from "@/app/font";
import { useBranch } from "@/contexts/BranchContext";
import { useModalQuery } from "@/hooks/utils/useModalQuery";
import CartList from "./CartList";
import { CustomerSchema, OrderFormState } from "./FormSchema";
import useFormErrors from "./useFormErrors";
import ShippingAddress from "./ShippingAddress";
import BranchSelector from "./BranchSelector";
import { useRouter } from "next/navigation";


export type CheckoutStep = "customer" | "shipping"

const ClientPage = () => {
 const router = useRouter();
  const { selectedBranch } = useBranch();
  const { openModal } = useModalQuery();

  const searchParams = useSearchParams();
  const step = (searchParams.get("step") || "customer") as CheckoutStep;

  const [orderDetails, setOrderDetails] = useState<OrderFormState>({
    customer: {
      firstname: "",
      lastname: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
    shippingAddress: {
      line1: "",
      line2: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Philippines",
      landmark: "",
    },
  });

  const { customerErrors, shippingErrors } = useFormErrors(orderDetails);

  const handleStateChange = (type: keyof OrderFormState,field: string, value: string) => {
    setOrderDetails((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleNext = () => {
    router.push("?step=shipping"); // or however you manage search params
  };

  return (
    <div className={`${syne.className} min-h-screen bg-slate-50`}>
      <CheckoutHeader step={step}/>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {/* Shared header */}
            <div className="pb-6">
              <h2 className="text-base font-semibold text-slate-900">
                {step === "customer" ? "Your details" : "Shipping address"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === "customer"
                  ? "We'll use this to process and contact you about your order."
                  : "Where should we deliver your order?"}
              </p>
            </div>

            <BranchSelector
              selectedBranch={selectedBranch}
              openModal={openModal}
            />

            {step === "customer" && (
              <CustomerDetails
                customerData={orderDetails.customer}
                errors={customerErrors}
                onChange={handleStateChange}
              />
            )}
            {step === "shipping" && (
              <ShippingAddress
                shippingAddress={orderDetails.shippingAddress}
                errors={shippingErrors}
                openModal={openModal}
                onChange={handleStateChange}
              />
            )}
          </div>

          <CartList
            selectedBranch={selectedBranch}
            orderDetails={orderDetails}
            step={step}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
