import { useStaffContext } from "@/contexts/StaffContext";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import React from "react";

/**
 * Renders children only if the current admin has the required permission.
 * @see adminPermission in `@/lib/roleBasedAccessCtrl`
 */
const PermissionGuard = ({
  children,
  permission,
  fallback = null,
}: {
  children: React.ReactNode;
  /** Permission key in `resource.action` format.
   *
   * **Resources:** `dashboard` | `orders` | `products` | `categories` |
   * `customers` | `stores` | `staff` | `reports` | `settings` | `inventories`
   *
   * **Actions:** `read` | `create` | `update` | `delete`
   *
   * @example
   * "products.update"
   * "staff.create"
   * "orders.read"
   */
  permission: string;
  /**
   * Optional UI to render when permission is denied.
   * Defaults to `null` (renders nothing).
   *
   * @example
   * fallback={<p>No permission</p>}
   * fallback={<NotAuthorized />}
   * fallback="You don't have access to this."
   */
  fallback?: React.ReactNode;
}) => {
  const admin = useStaffContext();
  if (!admin || !canAccess(admin.role, permission)) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGuard;