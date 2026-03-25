import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/ui/Footer";
import Header from "@/app/customer/components/Header";
import { CartProvider } from "@/contexts/CartContext";
import React, { Suspense } from "react";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Metadata } from "next";
import { BranchProvider } from "@/contexts/BranchContext";
import HeaderSkeleton from "@/app/customer/components/HeaderSkeleton"

export const metadata: Metadata = {
  title: "Customer | House of Inasal & BBQ",
  manifest: "/manifest.json",
};

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BranchProvider>
        <CartProvider>
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          <CartDrawer />
          {children}
          <PWAInstallPrompt />
          <Footer />
        </CartProvider>
      </BranchProvider>
    </>
  );
}
