import { adminPermission } from "./adminPermission";
import { StaffRole } from "@/hooks/api/useStaff";

export function canAccess(role: StaffRole, permission: string){
    return adminPermission[role]?.includes(permission);
}