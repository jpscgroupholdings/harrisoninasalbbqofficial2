"use client";

import BrandLogo from "@/components/BrandLogo";
import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import { Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const NewHeader = () => {
  const orderUrl = useSubdomainPath("/", "food");
  const pathname = usePathname();

  const [activeHash, setActiveHash] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { label: "Home", section: "/" },
    { label: "Menu", section: "/#menu" },
    { label: "Reserve", section: "/#reserve" },
    { label: "FAQs", section: "/#faqs" },
  ];

  // Track hash changes (for /#section links)
  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);

    updateHash();

    // hashchanges fires on hash-only changes
    window.addEventListener("hashchange", updateHash);

    // popstate fires on back/forward navigation
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  const isActive = (section: string): boolean => {
    const isHashLink = section.includes("#");

    if (isHashLink) {
      const [path, hash] = section.split("#");
      const hashWithSymbol = `#${hash}`;
      const sectionPath = path || "/";

      return pathname === sectionPath && activeHash === hashWithSymbol;
    }

    if (section === "/") {
      // Only active if we're on "/" and the current hash
      // doesn't belong to any other nav item
      const hashBelongToAnotherItem = NAV_ITEMS.some(
        (item) =>
          item.section !== "/" &&
          item.section.includes("#") &&
          item.section === `${pathname}${activeHash}`,
      );

      return pathname === "/" && !activeHash && !hashBelongToAnotherItem;
    }

    return pathname === section;
  };

  const navLinkClass = (section: string) =>
    `text-gray-800 font-[550] transition-colors text-nowrap text-sm relative ${isActive(section) ? "bg-brand-color-500 py-1.5 px-3 rounded-lg text-white hover:bg-brand-color-600" : "hover:text-brand-color-500"}`;

  const handleNavigate = (section: string) => {
    if (section.includes("#")) {
      const hash = "#" + section.split("#")[1];
      setActiveHash(hash);
    } else {
      setActiveHash(""); // clear hash for plain routes
    }
  };

  return (
    <nav className="sticky top-0 bg-white z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-4">
        <div className="flex items-center justify-between h-10 md:h-12">
          {/* Logo */}
          <BrandLogo />

          {/** Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              // On each hash link click, update state immediately
              <Link
                key={item.section}
                href={item.section}
                onClick={() => handleNavigate(item.section)}
                className={navLinkClass(item.section)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Link
              href={orderUrl}
              className="bg-brand-color-500 text-white hover:bg-brand-color-600 py-2 px-8 rounded-lg"
            >
              Order Now
            </Link>
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
                className={`block w-full text-left py-2 font-[550] text-sm transition-colors
                  ${
                    isActive(item.section)
                      ? "text-brand-color-500 border-l-2 border-brand-color-500 pl-3"
                      : "text-gray-800"
                  }`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavigate(item.section);
                }}
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

export default NewHeader;
