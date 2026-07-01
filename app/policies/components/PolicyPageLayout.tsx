"use client";

import { usePathname } from "next/navigation";
import NewHeader from "@/app/main/components/newdesign/NewHeader";
import Footer from "@/components/ui/Footer";
import React from "react";

const PARENT_PAGE = "/policies";

const POLICY_NAV_ITEMS = [
  { name: "Privacy Policy", href: `${PARENT_PAGE}/privacy-policy` },
  { name: "Terms of Use", href: `${PARENT_PAGE}/terms-of-use` },
  { name: "Refund Policy", href: `${PARENT_PAGE}/refund-policy` },
  { name: "Delivery Policy", href: `${PARENT_PAGE}/delivery-policy` },
];

const PolicyPageLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <>
      <NewHeader />
      <main className="min-h-screen bg-white">
        <nav className="sticky top-18 md:top-20 z-10 border-b border-gray-200 bg-gray-50">
          <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 sm:px-6">
            {POLICY_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  pathname === item.href
                    ? "border-b-2 border-brand-color-500 text-brand-color-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>
        </nav>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
          {children}
        </div>
      </main>
      <Footer variant="marketing" />
    </>
  );
};

export default PolicyPageLayout;
