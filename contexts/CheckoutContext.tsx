'use client'

import { useMyAddress } from "@/app/customer/hooks/useMyAddress";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation"; // ✅ fix: next/navigation not next/router
import { createContext, useContext, useEffect, useState } from "react";
import { useBranch } from "./BranchContext";
import { useModalQuery } from "@/hooks/utils/useModalQuery";
import { OrderFormState } from "@/app/customer/checkout/FormSchema";
import useFormErrors from "@/app/customer/checkout/useFormErrors";

// ---- Types ----
type CheckoutContextType = {
  session: ReturnType<typeof authClient.useSession>["data"];
  isPending: boolean;
  selectedBranch: ReturnType<typeof useBranch>["selectedBranch"];
  openModal: ReturnType<typeof useModalQuery>["openModal"];
  orderDetails: OrderFormState;
  customerErrors: ReturnType<typeof useFormErrors>["customerErrors"];
  shippingErrors: ReturnType<typeof useFormErrors>["shippingErrors"];
  handleStateChange: (type: keyof OrderFormState, field: string, value: string) => void;
  handleNext: () => void;
  validateField: (step: "customer" | "shippingAddress", field: string, value: string) => void
};

export const CheckoutStep = {
    DETAILS : "/checkout/details",
    SHIPPING : "/checkout/shipping"
} as const;


// ---- Context ----
const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// ---- Hook ----
export const useCheckout = () => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
};

// ---- Provider ----
export const CheckoutProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending } = authClient.useSession();
  const { data: myAddress } = useMyAddress();
  const { shippingAddress } = myAddress ?? {};

  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { openModal } = useModalQuery();

  const [orderDetails, setOrderDetails] = useState<OrderFormState>({
    customer: {
      firstName: "",
      lastName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
    shippingAddress: {
      line1: "",
      line2: "",
      city: "",
      province: "",
      zipCode: "",
      country: "Philippines",
      landmark: "",
    },
  });

  const { customerErrors, shippingErrors, validateField } = useFormErrors(orderDetails);

  const handleStateChange = (
    type: keyof OrderFormState,
    field: string,
    value: string,
  ) => {
    setOrderDetails((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleNext = () => {
    router.push(CheckoutStep.SHIPPING);
  };

  useEffect(() => {
    if (!session?.user || !myAddress) return;

    setOrderDetails((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        firstName: prev.customer.firstName || session.user.firstName || "",
        lastName: prev.customer.lastName || session.user.lastName || "",
        customerEmail: prev.customer.customerEmail || session.user.email || "",
        customerPhone: prev.customer.customerPhone || session.user.phone || "",
      },
      shippingAddress: {
        line1: shippingAddress?.line1 || "",
        line2: shippingAddress?.line2 || "",
        city: shippingAddress?.city || "",
        province: shippingAddress?.province || "",
        zipCode: shippingAddress?.zipCode || "",
        country: "Philippines",
        landmark: shippingAddress?.landmark || "",
      },
    }));
  }, [session, myAddress]);

  return (
    <CheckoutContext.Provider
      value={{
        session,
        isPending,
        selectedBranch,
        openModal,
        orderDetails,
        customerErrors,
        shippingErrors,
        handleStateChange,
        handleNext,
        validateField
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};