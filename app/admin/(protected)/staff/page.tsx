"use client";
import { InputField } from "@/components/ui/InputField";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLucideIcon } from "@/lib/iconUtils";
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
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/types/staff"
import { Ban, Loader2, Search } from "lucide-react";
import { ChangeEvent, useState } from "react";
import SectionHeader from "../../components/SectionHeader";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "cashier", label: "Cashier" },
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

    // ✅ Add phone validation to match backend
    if (form.phone?.trim() && !/^(\+63|0)[0-9]{10}$/.test(form.phone.trim())) {
      e.phone = "Invalid phone number. Use 09XXXXXXXXX or +639XXXXXXXXX.";
    }

    if (!staffToEdit && !form.password.trim())
      e.password = "Password is required.";
    else if (!staffToEdit && form.password.length < 8)
      e.password = "Password must be at least 8 characters.";

    if (!form.role) e.role = "Role is required.";
    if (!form.branch) e.branch = "Branch is required.";
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
    setForm((prev) => ({ ...prev, [name]: value }));
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
        {[
          { label: "Total Staff", value: staffList.length, icon: "Users" },
          {
            label: "Active",
            value: staffList.filter((s) => s.isActive).length,
            icon: "ShieldCheck",
          },
          {
            label: "Inactive",
            value: staffList.filter((s) => !s.isActive).length,
            icon: "ShieldOff",
          },
          { label: "Branches", value: branches.length, icon: "Store" },
        ].map((s) => {
          const Icon = getLucideIcon(s.icon);
          return (
            <div
              key={s.label}
              className="relative bg-white rounded-xl py-5 px-6 border border-gray-200 overflow-hidden"
            >
              <Icon
                size={80}
                className="absolute right-4 bottom-2 text-gray-100"
              />
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-4 relative z-10">
                {s.label}
              </p>
              <div className="text-3xl font-bold text-gray-700 relative z-10">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <InputField
          placeholder="Search by name, email, role, or branch..."
          leftIcon={<Search size={18} />}
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
                    <Loader2 size={20} className="animate-spin" /> Loading
                    staff...
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center text-gray-500 gap-2 p-8">
                    <Ban size={24} /> No staff found.
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
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ fontFamily: "'DM Mono', monospace" }}
                        className="text-xs bg-gray-500 py-0.5 px-2 rounded-md text-white"
                      >
                        {staff.branch?.code}
                      </span>
                      <span className="text-sm text-gray-600">
                        {staff.branch?.name}
                      </span>
                    </div>
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
                      <button
                        onClick={() => handleEditClick(staff)}
                        className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-brand-color-500 hover:text-white hover:border-brand-color-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus.mutate(staff._id)}
                        disabled={toggleStatus.isPending}
                        className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-brand-color-500 hover:text-white hover:border-brand-color-600 transition-colors disabled:opacity-50"
                      >
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </button>
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
                placeholder="e.g., juan@example.com"
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
              <div className="relative">
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
                  placeholder="Min. 8 characters"
                  error={errors.password}
                  required={!staffToEdit}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Assignment */}
            <p className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-3">
              Assignment
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Role dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChangeForm}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-brand-color-400 transition ${
                    errors.role ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-500">{errors.role}</p>
                )}
              </div>

              {/* Branch dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChangeForm}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-brand-color-400 transition ${
                    errors.branch
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="" disabled>
                    Select a branch
                  </option>
                  {branches
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                </select>
                {errors.branch && (
                  <p className="mt-1 text-xs text-red-500">{errors.branch}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setStaffToEdit(null);
                }}
                className="py-1.5 px-4 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="py-1.5 px-4 rounded-lg bg-brand-color-500 hover:bg-brand-color-600 text-sm text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending
                  ? staffToEdit
                    ? "Saving..."
                    : "Creating..."
                  : staffToEdit
                    ? "Save Changes"
                    : "Add Staff"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
