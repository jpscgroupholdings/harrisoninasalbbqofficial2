import { CheckoutProvider } from "@/contexts/CheckoutContext";
import React from "react";
import CheckoutShell from "./CheckoutShell";

const CheckoutLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <CheckoutProvider>
      <CheckoutShell>{children}</CheckoutShell>
    </CheckoutProvider>
  );
};

export default CheckoutLayout;
