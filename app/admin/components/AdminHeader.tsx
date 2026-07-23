"use client";

import { currentDate } from "@/helper/formatter";
import { useStaffData } from "../hooks/useStaffData";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLogoutAdmin } from "@/hooks/api/useLogout";
import LogoutModal from "@/components/ui/LogoutModal";
import { IconButton } from "@/components/ui/buttons";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import NotificationBell from "./NotificationBell";

const AdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { staff, staffRole } = useStaffData();

  const { firstName, lastName } = staff;
  const avatarUrl = staff.image?.url;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ?? "Admin Fullname";

  const [viewMenu, setViewMenu] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useLogoutAdmin();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setViewMenu(false);
      }
    };
    if (viewMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewMenu]);

  const menuItems = [
    {
      label: "View Profile",
      icon: "UserCircle",
      path: "/profile",
      permission: "profile.read",
    },
    {
      label: "Legal Policies",
      icon: "Scale",
      path: "/legal",
      permission: "legal.read",
    },
    {
      label: "Activity Logs",
      path: "/activity-logs",
      icon: "ScrollText",
      permission: "activity-logs.read",
    },
  ];

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/** Mobile menu button */}
          <IconButton
            onClick={onMenuClick}
            aria-label="Toggle Menu"
            icon={{ name: "Menu", size: 16 }}
            variant="ghost"
            className="lg:hidden rounded-lg"
          />
          <div>
            <p className="text-xs lg:text-lg text-slate-500 mt-1">
              {currentDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/** Notifications */}
          <NotificationBell />

          {/** Profile */}
          <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {fullName}
                </p>
                <p className="text-xs text-slate-500">{staffRole ?? "--"}</p>
              </div>

              {/** Avatar or fallback icon */}
              <button
                onClick={() => setViewMenu(!viewMenu)}
                className="relative rounded-full border-2 border-brand-color-500 overflow-hidden h-10 w-10 shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-color-300 transition-all"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-brand-color-500 flex items-center justify-center text-white">
                    <DynamicIcon name="User" size={20} />
                  </div>
                )}
              </button>
            </div>

            {/** Floating dropdown menu */}
            {viewMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/** User info header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">
                    {fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {staff?.email}
                  </p>
                </div>

                {/** Navigation items */}
                <div className="py-1">
                  {menuItems.map((item) => {
                    const hasAccess = staffRole
                      ? canAccess(staffRole, item.permission)
                      : false;
                    if (!hasAccess) return;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setViewMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <DynamicIcon name={item.icon} size={16} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/** Divider + Logout */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setViewMenu(false);
                      setLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <DynamicIcon name="LogOut" size={16} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {logoutModal && (
        <LogoutModal
          onClose={() => setLogoutModal(false)}
          onConfirm={() => logout.mutate()}
          isLoading={logout.isPending}
        />
      )}
    </>
  );
};

export default AdminHeader;
