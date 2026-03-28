"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogIn,
  Package,
  LogOut,
  Loader2,
  MapPin,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useOrders } from "@/hooks/api/useOrders";
import BrandLogo from "@/components/BrandLogo";
import AuthModal from "./AuthModal";
import { useCustomerMe } from "@/hooks/api/useAuthMe";
import { useLogoutCustomer } from "@/hooks/api/useLogout";
import LogoutModal from "@/components/ui/LogoutModal";
import Modal from "@/components/ui/Modal";
import MapPage from "@/app/customer/map/page";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useBranch } from "@/contexts/BranchContext";

const Header = () => {
  const { data: currentUser, isPending } = useCustomerMe();
  const userLogout = useLogoutCustomer();

  const searchParams = useSearchParams();
  const modalType = searchParams.get("modal");
  const pathname = usePathname();
  const router = useRouter();

  const { selectedBranch } = useBranch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { totalItems, setIsCartOpen } = useCart();
  const { data: placedOrders } = useOrders();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeOrdersCount =
    placedOrders?.filter(
      (order) =>
        order.status !== "cancelled" &&
        (order.status !== "completed" || !order.isReviewed),
    ).length || 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Preserve other query params
  const handleOpenModal = (modalType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", modalType);

    const query = params.toString();
    router.replace(query ? `?${query}` : "");
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    console.log("modalType:", modalType);

    const query = params.toString();
    router.replace(query ? `?${query}` : pathname);
    console.log("modalType:", modalType);
  };

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

          <button
            onClick={() => handleOpenModal("map")}
            className="flex items-center justify-center gap-2 bg-white hover:bg-brand-color-50 hover:text-brand-color-600 text-brand-color-500 px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer max-w-35 sm:max-w-none"
          >
            <MapPin size={16} className="shrink-0" />
            <span className="truncate">
              {mounted
                ? selectedBranch
                  ? selectedBranch.name
                  : "Select Branch"
                : "Select Branch"}{" "}
              {/* matches server render */}
            </span>
            <ChevronDown size={16} className="shrink-0" />
          </button>

          <div className="gap-6 hidden lg:flex">
            <Link href={"/catering"} className="hover:text-brand-color-500">
              Catering
            </Link>
            <Link href={"/contact"} className="hover:text-brand-color-500">
              Contact Us
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/orders"
              className="relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer"
            >
              <Package
                size={20}
                className="group-hover:scale-110 transition-transform darkText"
              />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                  {activeOrdersCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer"
            >
              <ShoppingBag
                size={20}
                className="group-hover:scale-110 transition-transform darkText"
              />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-2">
              {isPending ? (
                <div className="flex items-center gap-3 animate-pulse">
                  {/* avatar skeleton */}
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>

                  {/* name skeleton */}
                  <div className="h-4 w-24 rounded bg-gray-300"></div>

                  {/* logout skeleton */}
                  <div className="h-4 w-16 rounded bg-gray-300 ml-2"></div>
                </div>
              ) : currentUser ? (
                <div className="flex items-center gap-3">
                  {/* Username */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                    <div className="w-6 h-6 rounded-full bg-brand-color-500 flex items-center justify-center text-white text-xs font-bold">
                      {currentUser.fullname?.[0]?.toUpperCase() || "N"}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {currentUser.fullname || "Name not found"}
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => handleOpenModal("logout")}
                    disabled={userLogout.isPending}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-500 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {userLogout.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <LogOut size={15} />
                    )}
                    {userLogout.isPending ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenModal("login")}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogIn size={18} />
                    <span className="text-sm font-medium">Login</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal("signup")}
                    className="flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer"
                  >
                    <User size={16} />
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 darkText hover:bg-white/10 rounded-lg transition-colors"
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
                href={"/menu"}
                className="text-white hover:text-brand-color-500"
              >
                Menu
              </Link>
              <Link
                href={"/events"}
                className="text-white hover:text-brand-color-500"
              >
                Events
              </Link>
              <Link
                href={"/contact"}
                className="text-white hover:text-brand-color-500"
              >
                Contact Us
              </Link>
            </div>

            {currentUser ? (
              // logged in mobile menu
              <div className="flex flex-col gap-2 pt-2">
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-brand-color-500 flex items-center justify-center text-white text-sm font-bold">
                    {currentUser.fullname?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {currentUser.fullname}
                    </p>
                    <p className="text-gray-400 text-xs">{currentUser.email}</p>
                  </div>
                </div>

                {/* Mobile logout */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenModal("logout");
                  }}
                  className="flex items-center justify-center gap-2 text-white bg-red-500/80 hover:bg-red-600 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {userLogout.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  {userLogout.isPending ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : (
              // guest mobile menu
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenModal("login");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-white bg-white/10 px-4 py-3 rounded-lg"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenModal("signup");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 text-white px-4 py-3 rounded-lg"
                >
                  <User size={18} />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={modalType === "login" || modalType === "signup"}
        onClose={handleCloseModal}
        initialMode={(modalType as "login") || "signup"}
      />

      {modalType === "logout" && (
        <LogoutModal
          onConfirm={() => userLogout.mutate()}
          onClose={handleCloseModal}
          isLoading={userLogout.isPending}
        />
      )}

      {modalType === "map" && (
        <Modal onClose={handleCloseModal} title="Select Harrison Branch">
          <MapPage />
        </Modal>
      )}
    </header>
  );
};

export default Header;
