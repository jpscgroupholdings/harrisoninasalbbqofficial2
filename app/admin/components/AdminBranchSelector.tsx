import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { SelectField } from "@/components/ui/SelectField";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useStaffContext } from "@/contexts/StaffContext";
import { STAFF_ROLES } from "@/types/staff";

const AdminBranchSelector = () => {
  const {
    branches = [],
    isLoadingBranches,
    selectedBranch,
    selectedBranchId,
    setSelectedBranchId,
  } = useAdminBranchContext();

  const admin = useStaffContext();

  if (admin.role !== STAFF_ROLES.SUPERADMIN) return null;


  return (
    <div className="space-y-2">
      <SelectField
        value={selectedBranchId}
        onChange={(e) => setSelectedBranchId(e.target.value)}
        disabled={isLoadingBranches}
        options={[
          {
            value: "all",
            label: isLoadingBranches ? "Loading Branches..." : "All Branches",
          },
          ...branches.map((branch) => ({
            value: branch._id,
            label: branch.name,
          })),
        ]}
        className="text-sm font-semibold "
        leftIcon={<DynamicIcon name="Store" size={18} />}
      />
      {selectedBranch && (
        <div className="py-2 px-2 text-xs bg-brand-color-50 rounded-lg  ">
          {selectedBranch?.address}
        </div>
      )}
    </div>
  );
};

export default AdminBranchSelector;
