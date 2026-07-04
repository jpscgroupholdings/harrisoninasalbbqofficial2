import { StaffRole } from "@/types/staff";
export function canAccess(role: StaffRole, permission: string) {
  return adminPermission[role]?.has(permission) ?? false;
}

// role: [resource.action] -> admin: [products.create]
export const adminPermission: Record<StaffRole, Set<string>> = {
  superadmin: new Set([
    "dashboard.read",

    "orders.read",
    "orders.update",

    "products.read",
    "products.create",
    "products.update",
    "products.delete",

    "categories.read",
    "categories.create",
    "categories.update",
    "categories.delete",

    "subcategories.read",
    "subcategories.create",
    "subcategories.update",
    "subcategories.delete",

    "customers.read",

    "promotions.read",
    "promotions.create",
    "promotions.update",
    "promotions.delete",

    "inventories.read",
    "inventories.create",
    "inventories.update",

    "stores.read",
    "stores.create",
    "stores.update",
    "stores.delete",

    "staff.read",
    "staff.create",
    "staff.update",
    "staff.delete",

    "reports.read",

    "settings.read",
    "settings.update",

    "legal.read",
    "legal.update",

    "reviews.read",

    "activity-logs.read"
  ]),

  admin: new Set([
    "dashboard.read",

    "orders.read",
    "orders.update",

    "products.read",

    "promotions.read",

    "inventories.read",
    "inventories.create",
    "inventories.update",

    "categories.read",
    "subcategories.read",

    "customers.read",

    "promotions.read",

    "reports.read",

    "settings.read",

    "legal.read",

    "reviews.read",
    "reviews.update",
  ]),

  cashier: new Set(["orders.read", "orders.update"]),
};
