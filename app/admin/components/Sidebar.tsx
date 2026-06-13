import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "../../../components/BrandLogo";
import { useLogoutAdmin } from "@/hooks/api/useLogout";
import LogoutModal from "../../../components/ui/LogoutModal";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { useStaffContext } from "@/contexts/StaffContext";
import { useAdminOrders } from "@/hooks/api/admin/useAdminOrders";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ORDER_STATUSES } from "@/types/orderConstants";
import AdminBranchSelector from "./AdminBranchSelector";

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  name: string;
  path: string | null;
  icon: string;
  permission: string;
  children?: {
    name: string;
    path: string;
  }[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const PromotionBaseUrl = "/promotions";

// Define navigation items with required permissions
const navSections: NavSection[] = [
  // Overview
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: "LayoutDashboard",
        permission: "dashboard.read",
      },
      {
        name: "Order History",
        path: "/orders",
        icon: "ShoppingCart",
        permission: "orders.read",
      },
      {
        name: "Reports",
        path: "/reports",
        icon: "ChartLine",
        permission: "reports.read",
      },
      { name: "Reviews", path: null, icon: "Star", permission: "reviews.read",
        children: [
          { name: "Order Reviews", path: "/reviews/orders" },
          { name: "Product Reviews", path: "/reviews/products" },
        ],
      },
    ],
  },

  // Operations
  {
    title: "Operations",
    items: [
      {
        name: "Products",
        path: "/products",
        icon: "Package",
        permission: "products.read",
      },
      {
        name: "Promotions",
        path: null,
        icon: "TicketPercent",
        permission: "promotions.read",
        children: [
          {
            name: "Product Discount",
            path: `${PromotionBaseUrl}/product-discounts`,
          },
          {
            name: "Order Discounts",
            path: `${PromotionBaseUrl}/order-discounts`,
          },
          {
            name: "Bundle Discounts",
            path: `${PromotionBaseUrl}/bundle-discounts`,
          },
          {
            name: "Purchased Cards",
            path: `${PromotionBaseUrl}/purchased-cards`,
          },
          {
            name: "Card Settings",
            path: `${PromotionBaseUrl}/promo-card-settings`,
          },
        ],
      },
      {
        name: "Inventory",
        path: "/inventories",
        icon: "Archive",
        permission: "inventories.read",
      },
      {
        name: "Categories",
        path: null,
        icon: "Folder",
        permission: "categories.read",
        children: [
          {
            name: "Categories",
            path: "/categories",
          },
          {
            name: "SubCategories",
            path: "/subcategories",
          },
        ],
      },
    ],
  },
  // Administration
  {
    title: "Administration",
    items: [
      {
        name: "Customers",
        path: "/customers",
        icon: "Users",
        permission: "customers.read",
      },
      {
        name: "Store Management",
        path: "/stores",
        icon: "Store",
        permission: "stores.read",
      },
      {
        name: "Staff Management",
        path: "/staff",
        icon: "UserRoundCog",
        permission: "staff.read",
      },
      {
        name: "Settings",
        path: "/settings",
        icon: "Settings",
        permission: "settings.read",
      },
    ],
  },
];

const getAllNavItems = () => navSections.flatMap((section) => section.items);

const getNavItemKey = (item: NavItem) => item.path ?? item.name;

const isRouteActive = (basePath: string, currentPath: string) =>
  currentPath === basePath || currentPath.startsWith(`${basePath}/`);

const getActiveParentKey = (currentPath: string) => {
  const activeParent = getAllNavItems().find(
    (item) =>
      item.children?.length &&
      item.children.some((child) => isRouteActive(child.path, currentPath)),
  );

  return activeParent ? getNavItemKey(activeParent) : null;
};

const Sidebar = ({ isMobileOpen, onClose }: SidebarProps) => {
  const currentUser = useStaffContext();
  const pathname = usePathname();
  const { data: placedOrders } = useAdminOrders({
    status: ORDER_STATUSES.PENDING,
    limit: 1,
  });

  const logout = useLogoutAdmin();
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(() =>
    getActiveParentKey(pathname),
  );

  const pendingCount = placedOrders?.pagination?.total ?? 0;
  // const lowProductStock = products.filter((order) => order.stock <= 10).length;

  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    setExpandedItemKey(getActiveParentKey(pathname));
  }, [pathname]);

  const toggleExpandedItem = (key: string) => {
    setExpandedItemKey((currentKey) => {
      return currentKey === key ? null : key;
    });
  };

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
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 w-64 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/** Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
          <BrandLogo />
          {/** Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <DynamicIcon name="X" size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto min-h-0">
          <div className="pb-2">
            <AdminBranchSelector />
          </div>
          {navSections.map((section) => {
            const accessedItems = section.items.filter((item) =>
              currentUser?.role
                ? canAccess(currentUser.role, item.permission)
                : false,
            );
            if (accessedItems.length === 0) return null;
            return (
              <div key={section.title} className="space-y-2">
                <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <ul className="space-y-2">
                  {accessedItems.map((item) => {
                    const hasChildren = Boolean(item.children?.length); // Check if current path matches item or any of its children
                    const hasActiveChild = item.children?.some((child) =>
                      isRouteActive(child.path, pathname),
                    ); // Determine if item is active based on current path
                    const itemKey = getNavItemKey(item);
                    const isActive =
                      (item.path !== null &&
                        isRouteActive(item.path, pathname)) ||
                      Boolean(hasActiveChild);
                    const isExpanded = expandedItemKey === itemKey;
                    return (
                      <li key={itemKey} className="relative">
                        <div
                          className={`flex items-center rounded-xl transition-all duration-200 group ${isActive ? "bg-brand-color-500/80 text-white" : "text-gray-600 hover:bg-slate-100 hover:text-brand-color-500"}`}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpandedItem(itemKey)}
                              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                            >
                              <DynamicIcon name={item.icon} size={18} />
                              <span className="truncate text-sm font-semibold">
                                {item.name}
                              </span>
                            </button>
                          ) : (
                            item.path && (
                              <Link
                                href={item.path}
                                onClick={() => {
                                  setExpandedItemKey(null);
                                  onClose();
                                }}
                                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
                              >
                                <DynamicIcon name={item.icon} size={18} />
                                <span className="truncate text-sm font-semibold">
                                  {item.name}
                                </span>
                                {/** Dot active indicator for non-children items */}
                                {isActive && (
                                  <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                                )}
                              </Link>
                            )
                          )}
                          {hasChildren && (
                            <button
                              type="button"
                              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.name}`}
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpandedItem(itemKey)}
                              className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                            >
                              <DynamicIcon
                                name="ChevronDown"
                                size={16}
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                          {/** Pending order indicator */}
                          {item.name === "Orders" && pendingCount > 0 && (
                            <div className="absolute -top-1 right-0 flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                              {pendingCount}
                            </div>
                          )}
                        </div>
                        {/**  */}
                        {hasChildren && isExpanded && (
                          <ul className="mt-1 space-y-1 pl-6">
                            {item.children?.map((child) => (
                              <li key={child.path}>
                                <Link
                                  href={child.path}
                                  onClick={onClose}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    isRouteActive(child.path, pathname)
                                      ? "bg-brand-color-500/10 text-brand-color-500"
                                      : "text-gray-500 hover:bg-slate-100 hover:text-brand-color-500"
                                  }`}
                                >
                                  <span>{child.name}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/** Logout */}
        <div className="shrink-0 border-t border-stone-200">
          <button
            onClick={() => setLogoutModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-semibold text-sm cursor-pointer"
          >
            <DynamicIcon name="LogOut" size={16} />
            <span>Exit Portal</span>
          </button>
        </div>
      </aside>

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

export default Sidebar;
