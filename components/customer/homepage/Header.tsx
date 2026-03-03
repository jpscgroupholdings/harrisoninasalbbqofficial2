"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, Menu, X, User, LogIn, Package } from "lucide-react";
import Link from "next/link";
import { useOrders } from "@/hooks/api/useOrders";
import BrandLogo from "@/components/BrandLogo";
import AuthModal from "../AuthModal";

const Header = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { data: placedOrders } = useOrders();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const activeOrdersCount =
    placedOrders?.filter(
      (order) =>
        order.status !== "cancelled" &&
        (order.status !== "completed" || !order.isReviewed),
    ).length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthClick = (mode: typeof authMode = "login") => {
    setAuthModalOpen(true);
    setAuthMode(mode);
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-all duration-300 ${
        isScrolled ? "shadow-xl" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 lg:h-20">
          {/* Logo */}

          <BrandLogo />

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Login/Signup - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleAuthClick("login")}
                className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn size={18} className={`text-slate-600`} />
                <span className={`text-sm font-medium text-slate-600`}>
                  Login
                </span>
              </button>
              <button
                onClick={() => handleAuthClick("signup")}
                className="flex items-center justify-center gap-2 w-full bg-brand-color-500 text-white px-4 py-2 text-sm font-bold text-center hover:bg-brand-color-600 transition-colors rounded-full cursor-pointer"
              >
                <User size={16} />
                <p className="">Sign Up</p>
              </button>
            </div>

            {/** List of orders button */}
            <Link
              href="/orders"
              className={`relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer`}
            >
              <Package
                size={20}
                className={`group-hover:scale-110 transition-transform darkText`}
              />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                  {activeOrdersCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer`}
            >
              <ShoppingBag
                size={20}
                className={`group-hover:scale-110 transition-transform darkText`}
              />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 darkText hover:bg-white/10 rounded-lg transition-colors`}
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
            {/* Auth Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                // onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 text-white bg-white/10 px-4 py-3 rounded-lg"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>
              <button
                // onClick={() => { onSignupClick(); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 text-white px-4 py-3 rounded-lg"
              >
                <User size={18} />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      )}
    </header>
  );
};

export default Header;
