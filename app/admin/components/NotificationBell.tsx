"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useNotifications } from "@/hooks/api/useNotifications";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import {
  NOTIFICATION_TYPE_CONFIG,
  NotificationType,
} from "@/types/notification";
import { formatTimeAgo } from "@/helper/formatter";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const { selectedBranchId } = useAdminBranchContext();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications({ branchId: selectedBranchId });

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleClickNotification = (notification: {
    _id: string;
    link: string | null;
    isRead: boolean;
  }) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to deep link if present
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/** Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <DynamicIcon name="Bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/** Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/** Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAllRead}
                className="text-xs text-brand-color-500 hover:text-brand-color-600 font-medium cursor-pointer disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/** Filter tabs */}
          <div className="flex border-b border-slate-100">
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors cursor-pointer",
                  filter === tab
                    ? "text-brand-color-500 border-b-2 border-brand-color-500"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          {/** Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <DynamicIcon
                  name="BellOff"
                  size={32}
                  className="mx-auto text-slate-300 mb-2"
                />
                <p className="text-sm text-slate-400">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              filteredNotifications.slice(0, 50).map((notification) => {
                const config =
                  NOTIFICATION_TYPE_CONFIG[
                    notification.type as NotificationType
                  ] ?? NOTIFICATION_TYPE_CONFIG.order_status;

                return (
                  <button
                    key={notification._id}
                    onClick={() => handleClickNotification(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-slate-50 last:border-0",
                      notification.isRead
                        ? "hover:bg-slate-50"
                        : "bg-blue-50/30 hover:bg-blue-50/60",
                    )}
                  >
                    {/** Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        config.color,
                      )}
                    >
                      <DynamicIcon name={config.icon} size={16} />
                    </div>

                    {/** Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight truncate",
                            notification.isRead
                              ? "text-slate-600 font-medium"
                              : "text-slate-800 font-semibold",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
