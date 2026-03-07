import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/ui/Footer";
import Header from "@/components/customer/homepage/Header";
import { CartProvider } from "@/contexts/CartContext";
import React from "react";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer | House of Inasal & BBQ",
  manifest: "/manifest.json",
};

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartProvider>
        <Header />
        <CartDrawer />
        {children}
        <PWAInstallPrompt />
        <Footer />
      </CartProvider>
    </>
  );
}
