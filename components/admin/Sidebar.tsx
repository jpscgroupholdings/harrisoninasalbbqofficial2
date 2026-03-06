import { useOrders } from "@/hooks/api/useOrders";
import { useProducts } from "@/hooks/api/useProducts";
import { getLucideIcon } from "@/lib/iconUtils";
import { Loader2, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "../BrandLogo";
import { useState } from "react";
import Modal from "../ui/Modal";
import { useLogoutAdmin } from "@/hooks/api/useLogout";

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
  const { data: placedOrders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const logout = useLogoutAdmin();

  const pendingCount = placedOrders.filter(
    (order) => order.status === "pending",
  ).length;
  const lowProductStock = products.filter((order) => order.stock <= 10).length;

  const [logoutModal, setLogoutModal] = useState(false);

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
            <button
              onClick={() => setLogoutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-semibold text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {logoutModal && (
        <Modal title="Logout?" onClose={() => setLogoutModal(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-xl text-gray-500">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setLogoutModal(false)}
                className="py-1.5 px-4 rounded-lg border border-gray-300 text-gray-600 text-lg font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="py-1.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-lg font-medium disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {logout.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {logout.isPending ? "Logging out... " : "Logout"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Sidebar;
