import { useAdminMe } from "@/hooks/api/useAuthMe";
import { Bell, CircleUser, Menu } from "lucide-react";
import React from "react";

const AdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const currentData = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const {data: currentAdmin, isPending} = useAdminMe();

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex item-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/** Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-200 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={16} />
        </button>

        <div>
          <h2 className="text-lg lg:text-2xl font-bold text-slate-800">
          Welcome to <span className="text-brand-color-500">{currentAdmin?.branch?.name}</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">{currentData}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/** Notifications */}
        <button className="relative p-2 lg:p-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <Bell size={20} />
          <div className="absolute top-1 lg:top-2 right-1 lg:right-2 rounded-full h-2 w-2 bg-red-500" />
        </button>

        {/** Profile */}
        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{`${currentAdmin?.firstName ?? "Admin"} ${currentAdmin?.lastName ?? ""}`} </p>
            <p className="text-xs text-slate-500">{currentAdmin?.role ?? "Admin role"}</p>
          </div>

          <CircleUser size={24}/>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
