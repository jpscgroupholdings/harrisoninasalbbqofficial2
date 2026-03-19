"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Rocket } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-all duration-300 ${
        isScrolled ? "shadow-xl" : ""
      }`}
    >
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-around h-18 lg:h-20">
          {/* Logo */}
          <BrandLogo />

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="gap-6 hidden lg:flex">
              <Link href={"/franchise#opportunity"} className="hover:text-brand-color-500">
                The Opportunity
              </Link>
              <Link href={"/franchise#our-advantages"} className="hover:text-brand-color-500">
                Our Advantage
              </Link>
              <Link href={"/franchise#opportunity"} className="hover:text-brand-color-500">
                Investment Tiers
              </Link>
            </div>
            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-2">
              <button className="flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer">
                <Rocket size={16} />
                Start Your Journey
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 darkText hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Menu button"}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1a1a1a] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <div className="gap-4 flex flex-col lg:hidden">
              <Link
                href={"/catering"}
                className="hover:text-brand-color-500 text-white"
              >
                The Opportunity
              </Link>
              <Link
                href={"/contact"}
                className="hover:text-brand-color-500 text-white"
              >
                Our Advantage
              </Link>
              <Link
                href={"/contact"}
                className="hover:text-brand-color-500 text-white"
              >
                Investment Tiers
              </Link>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white px-4 py-3 rounded-lg cursor-pointer"
              >
                <Rocket size={16} />
                Start Your Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
