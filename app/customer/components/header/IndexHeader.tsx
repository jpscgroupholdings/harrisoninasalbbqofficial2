"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/lib/DynamicIcon";

import BrandLogo from "@/components/BrandLogo";
import { HeaderBranchButton } from "./HeaderBranchButton";
import { HeaderNavLinks } from "./HeaderNavLinks";
import { HeaderCartActions } from "./HeaderCartActions";
import { HeaderAuthDesktop } from "./HeaderAuthDesktop";
import { HeaderMobileMenu } from "./HeaderAuthMobile";
import { HeaderModals } from "./HeaderModal";

const Header = () => {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const { modal: modalType, openModal, closeModal } = useModalQuery();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          closeModal();
          toast.success("Logged out successfully");
          setIsLoggingOut(false);
        },
      },
    });
  };

  return (
    <header
      className={`sticky top-0 z-40 pt-2 bg-white transition-all duration-300 ${
        isScrolled ? "shadow-xl" : ""
      }`}
    >
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-around h-18 lg:h-20">
          <BrandLogo />

          <HeaderBranchButton mounted={mounted} onOpen={openModal} />

          <HeaderNavLinks />

          <div className="flex items-center gap-2 sm:gap-4">
            <HeaderCartActions mounted={mounted} />

            <div className="hidden xl:flex items-center gap-2">
              <HeaderAuthDesktop
                sessionPending={sessionPending}
                session={session}
                isLoggingOut={isLoggingOut}
                onOpenModal={openModal}
              />
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="xl:hidden p-2 darkText hover:bg-white/10 rounded-lg transition-colors"
            >
              <DynamicIcon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <HeaderMobileMenu
          session={session}
          isLoggingOut={isLoggingOut}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpenModal={openModal}
        />
      )}

      <HeaderModals
        modalType={modalType}
        isLoggingOut={isLoggingOut}
        onClose={closeModal}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default Header;