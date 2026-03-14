"use client";

import React, { useState } from "react";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import Link from "next/link";
import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import BrandLogo from "../BrandLogo";
import { Menu, Section, ShoppingCart, X } from "lucide-react";

const Header = () => {
  useScrollToSection();
  const orderUrl = useSubdomainPath("/", "food");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { label: "Products", section: "/#products-main-section" },
    { label: "About", section: "/#about-section" },
    { label: "Catering", section: "/catering" },
    { label: "Franchise Now", section: "/franchise" },
    { label: "Locations", section: "/#locations-section" },
  ];

  return (
    <nav className="sticky top-0 bg-white z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-4">
        <div className="flex items-center justify-between h-10 md:h-12">
          {/* Logo */}
          <BrandLogo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.section}
                href={item.section}
                className="text-gray-800 font-[550] hover:text-brand-color-500 transition-colors text-nowrap text-sm"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={orderUrl}
              className="flex items-center justify-center gap-2 w-full bg-brand-color-500 text-white px-4 py-2 text-sm font-bold text-center hover:bg-brand-color-600 transition-colors rounded-full"
            >
              <ShoppingCart size={16} />
              <p>Order Now</p>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-800 p-2 cursor-pointer transition-transform"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.section}
                href={item.section}
                className="block w-full text-left text-gray-800 font-[550] py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={orderUrl}
              className="block w-full bg-brand-color-500 text-white px-6 py-3 font-bold text-center hover:bg-brand-color-600 transition-colors"
            >
              Order Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
