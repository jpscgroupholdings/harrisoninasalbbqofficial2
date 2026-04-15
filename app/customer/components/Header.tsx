"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useOrders } from "@/hooks/api/useOrders";
import BrandLogo from "@/components/BrandLogo";
import AuthModal from "./AuthModal";
// --- BETTER AUTH IMPORTS ---
import { authClient } from "@/lib/auth-client";
import LogoutModal from "@/components/ui/LogoutModal";
import Modal from "@/components/ui/Modal";
import MapPage from "@/app/customer/map/page";
import { useBranch } from "@/contexts/BranchContext";
import { syne } from "@/app/font";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { toast } from "sonner";

const Header = () => {
  // --- USE BETTER AUTH SESSION ---
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { selectedBranch } = useBranch();

  const {
    modal: modalType,
    openModal: handleOpenModal,
    closeModal: handleCloseModal,
  } = useModalQuery();

  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { totalItems, setIsCartOpen } = useCart();
  const { data: placedOrders = [] } = useOrders({ type: "customer" });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Better-Auth Logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          handleCloseModal();
          toast.success("Logged out successfully");
          setIsLoggingOut(false);
        },
      },
    });
  };

  const activeOrdersCount =
    placedOrders.filter(
      (order) =>
        order.status !== "cancelled" &&
        (order.status !== "completed" || !order.isReviewed),
    ).length || 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 pt-2 bg-white transition-all duration-300 ${
        isScrolled ? "shadow-xl" : ""
      }`}
    >
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-around h-18 lg:h-20">
          <BrandLogo />

          <button
            onClick={() => handleOpenModal(MODAL_TYPES.MAP)}
            className="flex items-center justify-center gap-2 bg-brand-color-100 hover:bg-brand-color-50 hover:text-brand-color-600 text-brand-color-500 px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer max-w-35 sm:max-w-none"
          >
            <DynamicIcon name="MapPin" size={16} className="shrink-0" />
            <span className="truncate">
              {mounted
                ? selectedBranch
                  ? selectedBranch.name
                  : "Select Branch"
                : "Select Branch"}
            </span>
            <DynamicIcon name="ChevronDown" size={16} className="shrink-0" />
          </button>

          <div className="gap-6 hidden lg:flex">
            <Link href={"/catering"} className="hover:text-brand-color-500">
              Catering
            </Link>
            <Link href={"/contact"} className="hover:text-brand-color-500">
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              <Link
                href="/orders"
                className="relative p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 group cursor-pointer"
              >
                <DynamicIcon
                  name="BaggageClaim"
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
                <DynamicIcon
                  name="ShoppingBag"
                  size={20}
                  className="group-hover:scale-110 transition-transform darkText"
                />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-color-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden xl:flex items-center gap-2">
              {sessionPending ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  <div className="h-4 w-24 rounded bg-gray-300"></div>
                </div>
              ) : session?.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                    <div className="w-6 h-6 rounded-full bg-brand-color-500 flex items-center justify-center text-white text-xs font-bold">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {session.user.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenModal(MODAL_TYPES.LOGOUT)}
                    disabled={isLoggingOut}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-500 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <DynamicIcon
                        name="Loader2"
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <DynamicIcon name="LogOut" size={15} />
                    )}
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenModal(MODAL_TYPES.LOGIN)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <DynamicIcon name="LogIn" size={18} />
                    <span className="text-sm font-medium">Login</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(MODAL_TYPES.SIGNUP)}
                    className={`${syne.className} flex bg-brand-color-500 text-white items-center justify-center text-sm hover:bg-brand-color-600 font-bold py-2 px-4 rounded-full`}
                  >
                    <DynamicIcon
                      name="User"
                      className="inline-block mr-2"
                      size={18}
                    />
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 darkText hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <DynamicIcon name="X" size={24} />
              ) : (
                <DynamicIcon name="Menu" size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-[#1a1a1a] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <div className="gap-4 flex flex-col lg:hidden">
              <Link
                href={"/orders"}
                className="text-white md:hidden hover:bg-brand-color-500 p-2 rounded transition-colors"
              >
                Orders
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-left text-white md:hidden hover:bg-brand-color-500 p-2 rounded transition-colors"
              >
                Cart
              </button>
              <Link
                href={"/catering"}
                className="text-white hover:bg-brand-color-500 p-2 rounded transition-colors"
              >
                Catering
              </Link>
              <Link
                href={"/contact"}
                className="text-white hover:bg-brand-color-500 p-2 rounded transition-colors"
              >
                Contact Us
              </Link>
            </div>

            {session?.user ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-brand-color-500 flex items-center justify-center text-white text-sm font-bold">
                    {session.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {session.user.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenModal(MODAL_TYPES.LOGOUT);
                  }}
                  className="flex items-center justify-center gap-2 text-white bg-red-500/80 hover:bg-red-600 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <DynamicIcon
                      name="Loader2"
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <DynamicIcon name="LogOut" size={16} />
                  )}
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenModal(MODAL_TYPES.LOGIN);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-white bg-white/10 px-4 py-3 rounded-lg"
                >
                  <DynamicIcon name="LogIn" size={18} />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenModal(MODAL_TYPES.SIGNUP);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 text-white px-4 py-3 rounded-lg"
                >
                  <DynamicIcon name="User" size={18} />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={
          modalType === MODAL_TYPES.LOGIN || modalType === MODAL_TYPES.SIGNUP
        }
        onClose={handleCloseModal}
        initialMode={modalType as any}
      />

      {modalType === MODAL_TYPES.LOGOUT && (
        <LogoutModal
          onConfirm={handleLogout}
          onClose={handleCloseModal}
          isLoading={isLoggingOut}
        />
      )}

      {modalType === MODAL_TYPES.MAP && (
        <Modal
          onClose={handleCloseModal}
          title="Select Harrison's Branch"
          subTitle="Explore the map to find the nearest branch"
          className={syne.className}
        >
          <MapPage />
        </Modal>
      )}
    </header>
  );
};

export default Header;
