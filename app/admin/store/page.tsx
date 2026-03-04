// BranchManagement.tsx  — cleaned up
"use client";

import SectionHeader from "@/components/admin/SectionHeader";
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
import { Branch, BranchFormData, BranchFormErrors } from "@/types/branch";
import { Ban, Loader2, Search } from "lucide-react";
import { ChangeEvent, useState } from "react";
import {
  useBranches,
  useCreateBranch,
  useToggleBranchStatus,
  useUpdateBranch,
} from "@/hooks/api/useBranch";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm: BranchFormData = {
  name: "",
  street: "",
  city: "",
  zipCode: "",
  contactNumber: "",
  open: "08:00",
  close: "22:00",
  daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

export default function BranchManagement() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const [errors, setErrors] = useState<BranchFormErrors>({});
  const [search, setSearch] = useState("");
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const toggleStatus = useToggleBranchStatus();

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.address.city.toLowerCase().includes(search.toLowerCase()),
  );

  const validate = (): BranchFormErrors => {
    const e: BranchFormErrors = {};
    if (!form.name.trim()) e.name = "Branch name is required.";
    if (!form.street.trim()) e.street = "Street is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (form.daysOpen.length === 0) e.daysOpen = "Select at least one day.";
    return e;
  };

  const handleEditClick = (branch: Branch) => {
    setBranchToEdit(branch);
    setForm({
      name: branch.name,
      street: branch.address.street,
      city: branch.address.city,
      zipCode: branch.address.zipCode,
      contactNumber: branch.contactNumber,
      open: branch.operatingHours.open,
      close: branch.operatingHours.close,
      daysOpen: branch.operatingHours.daysOpen,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setBranchToEdit(null);
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    if (branchToEdit) {
      await updateBranch.mutateAsync({
        id: branchToEdit._id,
        branchData: form,
      });
    } else {
      await createBranch.mutateAsync(form); // awaited so modal only closes on success
    }

    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
    setBranchToEdit(null);
  };

  const handleChangeForm = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // clear error on change
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      daysOpen: prev.daysOpen.includes(day)
        ? prev.daysOpen.filter((d) => d !== day)
        : [...prev.daysOpen, day],
    }));
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <SectionHeader
        title="Store Management"
        subTitle="Manage your store's branches"
        onClick={() => {
          setShowModal(true);
          setErrors({});
          setForm(emptyForm);
        }}
        btnTxt="+ Add New Branch"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {[
          { label: "Total Branches", value: branches.length, icon: "Store" },
          {
            label: "Active",
            value: branches.filter((b) => b.isActive).length,
            icon: "ShieldCheck",
          },
          {
            label: "Inactive",
            value: branches.filter((b) => !b.isActive).length,
            icon: "ShieldOff",
          },
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
      <div className="mb-8">
        <InputField
          placeholder="Search branches..."
          leftIcon={<Search size={18} />}
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
                "Branch",
                "Code",
                "Address",
                "Contact",
                "Hours",
                "Days Open",
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
                <TableCell colSpan={8}>
                  <div className="flex justify-center items-center gap-2 p-8 text-gray-400">
                    <Loader2 size={20} className="animate-spin" /> Loading
                    branches...
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center text-gray-500 gap-2 p-8">
                    <Ban size={24} /> No branches found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((branch) => (
                <TableRow
                  key={branch._id}
                  className="bg-transparent hover:bg-gray-100 border-gray-100"
                >
                  <TableCell className="capitalize">{branch.name}</TableCell>
                  <TableCell>
                    <span
                      style={{ fontFamily: "'DM Mono', monospace" }}
                      className="text-xs bg-gray-500 py-1 px-2.5 rounded-md text-white text-nowrap"
                    >
                      {branch.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>{branch.address.street}</div>
                    <div className="text-gray-500">
                      {branch.address.city}
                      {branch.address.zipCode
                        ? `, ${branch.address.zipCode}`
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>{branch.contactNumber || "—"}</TableCell>
                  <TableCell>
                    {branch.operatingHours.open} – {branch.operatingHours.close}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-40">
                      {DAYS.map((d) => (
                        <span
                          key={d}
                          style={{ fontFamily: "'DM Mono', monospace" }}
                          className={`text-xs py-0.5 px-1.5 rounded-lg ${branch.operatingHours.daysOpen.includes(d) ? "bg-brand-color-500 text-white" : "bg-gray-100 text-gray-900"}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg text-white ${branch.isActive ? "bg-dark-green-500" : "bg-red-600"}`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(branch)}
                        className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-dark-green-600 bg-dark-green-500 text-white hover:bg-dark-green-600 hover:border-dark-green-600 disabled:opacity-50 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus.mutate(branch._id)}
                        disabled={toggleStatus.isPending}
                        className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-500 bg-white text-gray-900 hover:bg-brand-color-500 hover:text-white hover:border-brand-color-600 disabled:opacity-50 cursor-pointer"
                      >
                        {branch.isActive ? "Deactivate" : "Activate"}
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
        <Modal title="Add New Branch" onClose={handleCloseModal}>
          <div>
            <p className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-3">
              Basic Info
            </p>
            <div className="grid grid-cols-1 gap-3 mb-5">
              <InputField
                label="Branch Name"
                value={form.name}
                onChange={handleChangeForm}
                name="name"
                placeholder="e.g., Century Mall"
                error={errors.name}
                required
                className="capitalize"
              />
            </div>

            <p className="text-sm font-semibold text-gray-900 tracking-widest uppercase mb-3">
              Address
            </p>
            <div className="flex flex-col gap-2.5 mb-4">
              <InputField
                label="Street"
                value={form.street}
                onChange={handleChangeForm}
                name="street"
                placeholder="e.g., 123 Rizal Ave"
                error={errors.street}
                className="capitalize"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="City"
                  value={form.city}
                  onChange={handleChangeForm}
                  name="city"
                  placeholder="e.g., Makati"
                  error={errors.city}
                  className="capitalize"
                  required
                />
                <InputField
                  label="ZIP Code"
                  value={form.zipCode}
                  onChange={handleChangeForm}
                  name="zipCode"
                  placeholder="e.g., 1000"
                />
              </div>
              <InputField
                label="Contact Number"
                value={form.contactNumber}
                onChange={handleChangeForm}
                name="contactNumber"
                placeholder="e.g., 09171234567"
              />
            </div>

            <p className="block text-sm font-semibold text-gray-700 mb-2">
              Operating Hours
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <InputField
                type="time"
                value={form.open}
                name="open"
                onChange={handleChangeForm}
              />
              <InputField
                type="time"
                value={form.close}
                name="close"
                onChange={handleChangeForm}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Days Open *
              </label>
              <div className="flex gap-2 flex-wrap mt-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`py-1.5 px-3 rounded-lg cursor-pointer font-semibold border transition-all duration-75 text-sm ${form.daysOpen.includes(d) ? "bg-brand-color-500 hover:bg-brand-color-600 text-white" : "bg-gray-100 text-brand-color-500"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {errors.daysOpen && (
                <p className="mt-1.5 text-sm text-red-500">{errors.daysOpen}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="py-1.5 px-3 rounded-lg border border-gray-500 text-gray-600 text-sm font-medium hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createBranch.isPending}
                className="py-1.5 px-3 rounded-lg bg-brand-color-500 hover:bg-brand-color-600 text-sm text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {createBranch.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {createBranch.isPending
                  ? "Saving..."
                  : branchToEdit
                    ? "Edit Branch"
                    : "Add Branch"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
