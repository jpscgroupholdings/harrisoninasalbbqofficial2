import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useStaffContext } from "@/contexts/StaffContext";
import { STAFF_ROLES } from "@/types/staff";

export const useBranchName = () => {
  const { selectedBranch, isLoadingBranches } = useAdminBranchContext();
  const staffData = useStaffContext();
  const isSuperAdmin = staffData?.role !== STAFF_ROLES.ADMIN ;

  const branchName = isLoadingBranches
    ? "Loading..."
    : isSuperAdmin
      ? (selectedBranch?.name ?? "All Branches")
      : (staffData?.branch?.name ?? "Assigned Branch");

  return { branchName };
};
