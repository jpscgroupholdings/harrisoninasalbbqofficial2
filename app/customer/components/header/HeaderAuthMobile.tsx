"use client";

import Link from "next/link";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { useCart } from "@/contexts/CartContext";
import { authClient } from "@/lib/auth-client";
import { MODAL_TYPES, ModalType } from "@/hooks/utils/useModalQuery";

interface Props {
  session: ReturnType<typeof authClient.useSession>["data"];
  isLoggingOut: boolean;
  onClose: () => void;
  onOpenModal: (type: ModalType) => void;
}

export const HeaderMobileMenu = ({
  session,
  isLoggingOut,
  onClose,
  onOpenModal,
}: Props) => {
  const { setIsCartOpen } = useCart();

  return (
    <div className="xl:hidden bg-[#1a1a1a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
        {/* Nav links */}
        <div className="gap-4 flex flex-col lg:hidden">
          <Link
            href="/orders"
            onClick={onClose}
            className="text-white md:hidden hover:bg-brand-color-500 p-2 rounded transition-colors"
          >
            Orders
          </Link>
          <button
            onClick={() => { setIsCartOpen(true); onClose(); }}
            className="text-left text-white md:hidden hover:bg-brand-color-500 p-2 rounded transition-colors"
          >
            Cart
          </button>
          <Link href="/catering" onClick={onClose} className="text-white hover:bg-brand-color-500 p-2 rounded transition-colors">
            Catering
          </Link>
          <Link href="/contact" onClick={onClose} className="text-white hover:bg-brand-color-500 p-2 rounded transition-colors">
            Contact Us
          </Link>
        </div>

        {/* Auth section */}
        {session?.user ? (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-brand-color-500 flex items-center justify-center text-white text-sm font-bold">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{session.user.name}</p>
                <p className="text-gray-400 text-xs">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onOpenModal(MODAL_TYPES.LOGOUT); }}
              className="flex items-center justify-center gap-2 text-white bg-red-500/80 hover:bg-red-600 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <DynamicIcon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <DynamicIcon name="LogOut" size={16} />
              )}
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { onOpenModal(MODAL_TYPES.LOGIN); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 text-white bg-white/10 px-4 py-3 rounded-lg"
            >
              <DynamicIcon name="LogIn" size={18} />
              <span>Login</span>
            </button>
            <button
              onClick={() => { onOpenModal(MODAL_TYPES.SIGNUP); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-color-500 text-white px-4 py-3 rounded-lg"
            >
              <DynamicIcon name="User" size={18} />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};