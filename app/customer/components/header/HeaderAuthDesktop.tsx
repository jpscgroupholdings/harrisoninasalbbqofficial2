"use client";

import { useState } from "react";
import Link from "next/link";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { authClient } from "@/lib/auth-client";
import { syne } from "@/app/font";
import { MODAL_TYPES, ModalType } from "@/hooks/utils/useModalQuery";

interface Props {
  sessionPending: boolean;
  session: ReturnType<typeof authClient.useSession>["data"];
  isLoggingOut: boolean;
  onOpenModal: (type: ModalType) => void;
}

export const HeaderAuthDesktop = ({
  sessionPending,
  session,
  isLoggingOut,
  onOpenModal,
}: Props) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (sessionPending) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <div className="h-4 w-24 rounded bg-gray-300" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 rounded-full pl-1 pr-3 py-1 transition-all cursor-pointer"
        >
          <img
            src={session.user.image ?? "/images/harrison_logo.png"}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover border border-gray-100"
          />
          <DynamicIcon
            name="ChevronDown"
            size={14}
            className={`text-gray-500 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isProfileOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />

            {/* Dropdown */}
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <img
                  src={session.user.image ?? "/images/harrison_logo.png"}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <Link
                  href="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <DynamicIcon name="User" size={15} />
                  View profile
                </Link>

                <div className="h-px bg-gray-100 my-1" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenModal(MODAL_TYPES.LOGOUT);
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <DynamicIcon name="Loader2" size={15} className="animate-spin" />
                  ) : (
                    <DynamicIcon name="LogOut" size={15} />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => onOpenModal(MODAL_TYPES.LOGIN)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
      >
        <DynamicIcon name="LogIn" size={18} />
        <span className="text-sm font-medium">Login</span>
      </button>
      <button
        onClick={() => onOpenModal(MODAL_TYPES.SIGNUP)}
        className={`${syne.className} flex bg-brand-color-500 text-white items-center justify-center text-sm hover:bg-brand-color-600 font-bold py-2 px-4 rounded-full`}
      >
        <DynamicIcon name="User" className="inline-block mr-2" size={18} />
        Sign Up
      </button>
    </>
  );
};