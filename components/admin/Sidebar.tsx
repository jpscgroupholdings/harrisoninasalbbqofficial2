import { useOrders } from "@/hooks/api/useOrders";
import { useProducts } from "@/hooks/api/useProducts";
import { getLucideIcon } from "@/lib/iconUtils";
import { LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import BrandLogo from "../BrandLogo";

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { name: "Orders", path: "/orders", icon: "ShoppingCart" },
  { name: "Products", path: "/products", icon: "Package" },
  { name: "Category", path: "/category", icon: "Folder" },
  { name: "Customers", path: "/accounts", icon: "Users" },
  { name: "Store Management", path: "/store", icon: "Store" },
  { name: "Staff Management", path: "/staff", icon: "UserRoundCog" },
  { name: "Reports", path: "/reports", icon: "ChartLine" },
  { name: "Settings", path: "/settings", icon: "Settings" },
];

const Sidebar = ({ isMobileOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const {data: placedOrders = []} = useOrders();
  const {data: products = []} = useProducts();

  const pendingCount = placedOrders.filter(order => order.status === 'pending').length;
  const lowProductStock = products.filter(order => order.stock <= 10).length;


  return (
    <>
      {/** Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 w-64 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/** Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
          <BrandLogo />

          {/** Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="py-6 px-3 overflow-y-auto h-[calc(100vh-80px)]">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = getLucideIcon(item.icon);
              return (
                <li key={item.path} className="relative">
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duratin-200 group ${isActive ? "bg-brand-color-500/80 text-white" : "text-gray-600 hover:bg-slate-100 hover:text-brand-color-500"}`}
                  >
                    <Icon size={18} />
                    <span className="font-semibold text-sm">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white" />
                    )}
                    {item.name === "Orders" && pendingCount > 0 && (
                       <div className="absolute -top-1 right-0 flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                      {pendingCount}
                    </div>
                    )}

                    {item.name === "Products" && lowProductStock > 0 && (
                       <div className="absolute -top-1 right-0 flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                      {lowProductStock}
                    </div>
                    )}
                   
                  </Link>
                </li>
              );
            })}
          </ul>

          {/** Logout */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-semibold text-sm cursor-pointer">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
