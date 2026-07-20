"use client";
import { InputField } from "@/components/ui/FormComponents/InputField";
import Modal from "@/components/ui/Modal";
import { StatCard, StatCardProps } from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranches } from "@/hooks/api/useBranch";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useToggleStaffStatus,
} from "@/hooks/api/useStaff";
import {
  StaffFormData,
  StaffFormErrors,
  StaffRole,
  Staff,
  STAFF_ROLES,
  ROLE_COLORS,
  ROLE_LABELS,
} from "@/types/staff";
import { ChangeEvent, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import { SelectField } from "@/components/ui/FormComponents/SelectField";
import { PasswordRequirementHint } from "@/components/ui/PasswordRequirementHint";
import {
  ADMIN_EMAIL_DOMAINS,
  isAllowedAdminDomain,
} from "@/lib/isAllowedEmails";
import { isPasswordSecure } from "@/lib/validations";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { IconButton } from "@/components/ui/buttons";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: STAFF_ROLES.SUPERADMIN, label: "Super Admin" },
  { value: STAFF_ROLES.ADMIN, label: "Admin" },
  { value: STAFF_ROLES.CASHIER, label: "Cashier/CSR" },
];

const emptyForm: StaffFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: "",
  branch: "",
};

// Superadmin and cashier are cross-branch roles — no branch assignment needed
const roleRequiresBranch = (role: StaffRole | "") => role === STAFF_ROLES.ADMIN;

export default function StaffManagement() {
  const [showModal, setShowModal] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: staffList = [], isLoading } = useStaff();
  const { data: branches = [] } = useBranches();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const toggleStatus = useToggleStaffStatus();

  const filtered = staffList.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ROLE_LABELS[s.role]?.toLowerCase().includes(search.toLowerCase()),
  );

  const validate = (): StaffFormErrors => {
    const e: StaffFormErrors = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";

    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email.";
    else if (!isAllowedAdminDomain(form.email))
      e.email = `Only @${ADMIN_EMAIL_DOMAINS.join(" or @")} email addresses are accepted`;

    // ✅ Add phone validation to match backend
    if (form.phone?.trim() && !/^(\+63|0)[0-9]{10}$/.test(form.phone.trim())) {
      e.phone = "Invalid phone number. Use 09XXXXXXXXX or +639XXXXXXXXX.";
    }

    if (!staffToEdit && !form.password.trim())
      e.password = "Password is required.";
    else if (!staffToEdit && !isPasswordSecure(form.password))
      e.password = "Password must meet all the requirements below.";
    else if (
      staffToEdit &&
      form.password.trim() &&
      !isPasswordSecure(form.password)
    )
      e.password = "Password must meet all the requirements below.";

    if (!form.role) e.role = "Role is required.";
    // Branch is only required for admin role — superadmin/cashier are cross-branch
    if (roleRequiresBranch(form.role) && !form.branch)
      e.branch = "Branch is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    if (staffToEdit) {
      const { password, ...rest } = form;
      await updateStaff.mutateAsync({
        id: staffToEdit._id,
        staffData: password ? form : rest,
      });
    } else {
      await createStaff.mutateAsync(form);
    }

    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
    setStaffToEdit(null);
  };

  const handleEditClick = (staff: Staff) => {
    setStaffToEdit(staff);
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      password: "",
      phone: staff.phone ?? "",
      role: staff.role,
      branch: staff.branch?._id || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChangeForm = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear branch when role changes to a cross-branch role
      if (name === "role" && !roleRequiresBranch(value as StaffRole)) {
        updated.branch = "";
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const isPending = createStaff.isPending || updateStaff.isPending;

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="Staff Management"
        subTitle="Manage your store's staff and branch assignments"
        onClick={() => {
          setStaffToEdit(null);
          setForm(emptyForm);
          setErrors({});
          setShowModal(true);
        }}
        btnTxt="+ Add New Staff"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {(
          [
            {
              label: "Total Staff",
              value: staffList.length,
              hasPreviousData: false,
            },
            {
              label: "Active",
              value: staffList.filter((s) => s.isActive).length,
              hasPreviousData: false,
            },
            {
              label: "Inactive",
              value: staffList.filter((s) => !s.isActive).length,
              hasPreviousData: false,
            },
            {
              label: "Branches",
              value: branches.length,
              hasPreviousData: false,
            },
          ] as StatCardProps[]
        ).map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <InputField
          placeholder="Search by name, email, role, or branch..."
          leftIcon={<DynamicIcon name="Search" size={18} />}
          name="search"
          autoComplete="new-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-lg"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Staff",
                "Email",
                "Phone",
                "Role",
                "Branch",
                "Status",
                "Action",
              ].map((h) => (
                <TableHead key={h} className="text-center">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex justify-center items-center gap-2 p-8 text-gray-400">
                    <DynamicIcon
                      name="Loader2"
                      size={20}
                      className="animate-spin"
                    />{" "}
                    Loading staff...
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center text-gray-500 gap-2 p-8">
                    <DynamicIcon name="Ban" size={24} /> No staff found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((staff) => (
                <TableRow
                  key={staff._id}
                  className="bg-transparent hover:bg-gray-50 border-gray-100"
                >
                  {/* Name + Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {staff.firstName[0]}
                        {staff.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {staff.firstName} {staff.lastName}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {staff.email}
                  </TableCell>

                  <TableCell
                    className="text-sm text-gray-500"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {staff.phone || "—"}
                  </TableCell>

                  {/* Role badge */}
                  <TableCell>
                    <span
                      className={`text-xs font-semibold py-1 px-2.5 rounded-lg ${ROLE_COLORS[staff.role]}`}
                    >
                      {ROLE_LABELS[staff.role]}
                    </span>
                  </TableCell>

                  {/* Branch */}
                  <TableCell>
                    {staff.branch ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ fontFamily: "'DM Mono', monospace" }}
                          className="text-xs bg-gray-500 py-0.5 px-2 rounded-md text-white"
                        >
                          {staff.branch.code}
                        </span>
                        <span className="text-sm text-gray-600">
                          {staff.branch.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        All branches ({ROLE_LABELS[staff.role]})
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg text-white ${staff.isActive ? "bg-dark-green-500" : "bg-red-500"}`}
                    >
                      {staff.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconButton
                        onClick={() => handleEditClick(staff)}
                        variant="outline"
                        text="Edit"
                        className="px-4 rounded-lg text-xs py-1.5 hover:bg-brand-color-500 hover:text-white"
                      />
                      <IconButton
                        onClick={() => toggleStatus.mutate(staff._id)}
                        disabled={toggleStatus.isPending}
                        variant="danger"
                        text={staff.isActive ? "Deactivate" : "Activate"}
                        className="px-4 rounded-lg text-xs py-1.5 hover:bg-brand-color-500 hover:text-white"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={staffToEdit ? "Edit Staff" : "Add New Staff"}
          onClose={() => {
            setShowModal(false);
            setStaffToEdit(null);
          }}
        >
          <div>
            {/* Basic Info */}
            <p className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-3">
              Basic Info
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InputField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChangeForm}
                placeholder="e.g., Juan"
                error={errors.firstName}
                className="capitalize"
                required
              />
              <InputField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChangeForm}
                placeholder="e.g., Dela Cruz"
                error={errors.lastName}
                className="capitalize"
                required
              />
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <InputField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChangeForm}
                placeholder="e.g., juan@jpfoodlab.com"
                subLabel={`Only @${ADMIN_EMAIL_DOMAINS.join(" or @")} addresses`}
                error={errors.email}
                className="lowercase"
                required
              />
              <InputField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChangeForm}
                placeholder="e.g., 09171234567 (optional)"
                error={errors.phone}
              />

              {/* Password */}
              <InputField
                label={
                  staffToEdit
                    ? "New Password (leave blank to keep current)"
                    : "Password"
                }
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChangeForm}
                placeholder="Min. 8 characters, 1 uppercase, 1 number, 1 symbol"
                error={errors.password}
                required={!staffToEdit}
                rightElement={
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    text={showPassword ? "Hide" : "Show"}
                    variant="ghost"
                    className="text-xs"
                  />
                }
              />
              {form.password && (
                <PasswordRequirementHint password={form.password} />
              )}
            </div>

            {/* Assignment */}
            <p className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-3">
              Assignment
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Role dropdown */}
              <SelectField
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChangeForm}
                options={[
                  { value: "", label: "Select Role", disabled: true },
                  ...ROLES.map((r) => ({ value: r.value, label: r.label })),
                ]}
                errors={errors.role}
                required
              />
              {/* Branch dropdown — only for admin role; superadmin/cashier are cross-branch */}
              <SelectField
                label="Branch"
                name="branch"
                disabled={!roleRequiresBranch(form.role)}
                options={[
                  {
                    value: "",
                    label: form.role ? `All Branches` : "Select a role first",
                    disabled: roleRequiresBranch(form.role),
                  },
                  ...branches
                    .filter((b) => b.isActive)
                    .map((b) => ({
                      value: b._id,
                      label: `${b.name} (${b.code})`,
                    })),
                ]}
                value={form.branch}
                onChange={handleChangeForm}
                errors={errors.branch}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <IconButton
                onClick={() => {
                  setShowModal(false);
                  setStaffToEdit(null);
                }}
                variant="outline"
                text="Cancel"
                className="px-4 rounded-lg"
              />
              <IconButton
                onClick={handleSubmit}
                disabled={isPending}
                icon={{
                  name: isPending ? "Loader2" : null,
                  className: "animate-spin",
                }}
                text={
                  isPending
                    ? staffToEdit
                      ? "Saving..."
                      : "Creating..."
                    : staffToEdit
                      ? "Save Changes"
                      : "Add Staff"
                }
                className="px-4 rounded-lg"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
