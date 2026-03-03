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
import { Ban, Plus, Search } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";

const initialBranches = [
  {
    _id: "1",
    name: "Century Branch",
    code: "BR-001",
    address: { street: "123 Poblacion Ave", city: "Makati", zipCode: "1226" },
    contactNumber: "09171234567",
    operatingHours: {
      open: "08:00",
      close: "22:00",
      daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    isActive: true,
  },
  {
    _id: "2",
    name: "King's Court Branch",
    code: "BR-002",
    address: { street: "45 Quezon Blvd", city: "Makati City", zipCode: "1100" },
    contactNumber: "09281234567",
    operatingHours: {
      open: "09:00",
      close: "21:00",
      daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    isActive: true,
  },
  {
    _id: "3",
    name: "Manila Branch",
    code: "BR-003",
    address: { street: "78 Alabang Rd", city: "Muntinlupa", zipCode: "1780" },
    contactNumber: "09391234567",
    operatingHours: {
      open: "10:00",
      close: "20:00",
      daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    isActive: false,
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm = {
  name: "",
  code: "",
  street: "",
  city: "",
  zipCode: "",
  contactNumber: "",
  open: "08:00",
  close: "22:00",
  daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

type formType = {
  name?: string;
  code?: string;
  street?: string;
  city?: string;
  daysOpen?: string;
};

export default function BranchManagement() {
  const [branches, setBranches] = useState(initialBranches);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<formType>({});
  const [search, setSearch] = useState("");

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.address.city.toLowerCase().includes(search.toLowerCase()),
  );

  const validate = () => {
    const e: formType = {};
    if (!form.name.trim()) e.name = "Branch name is required.";
    if (!form.code.trim()) e.code = "Branch code is required.";
    if (!form.street.trim()) e.street = "Street is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (form.daysOpen.length === 0) e.daysOpen = "Select at least one day.";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const newBranch = {
      _id: String(Date.now()),
      name: form.name,
      code: form.code.toUpperCase(),
      address: { street: form.street, city: form.city, zipCode: form.zipCode },
      contactNumber: form.contactNumber,
      operatingHours: {
        open: form.open,
        close: form.close,
        daysOpen: form.daysOpen,
      },
      isActive: true,
    };

    setBranches((prev) => [...prev, newBranch]);
    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
    toast.success(`Branch "${newBranch.name}" added successfully!`);
  };

  const toggleStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) => (b._id === id ? { ...b, isActive: !b.isActive } : b)),
    );
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      daysOpen: prev.daysOpen.includes(day)
        ? prev.daysOpen.filter((d) => d !== day)
        : [...prev.daysOpen, day],
    }));
  };

  const handleChangeForm = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <SectionHeader
        title={"Store Management"}
        subTitle="Manage your store's branches"
        onClick={() => {
          setShowModal(true);
          setErrors({});
          setForm(emptyForm);
        }}
        btnTxt="+ Add New Branches"
      />

      {/* Stats row */}
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
              ].map((head) => (
                <TableHead key={head} className="text-center">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center text-gray-500 gap-2 p-8">
                    <Ban size={24} />
                    No branches found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((branch, i) => (
                <TableRow
                  key={branch._id}
                  className="bg-transparent hover:bg-gray-100 border-gray-100"
                >
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                      }}
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
                          style={{
                            fontFamily: "'DM Mono', monospace",
                          }}
                          className={`text-xs py-0.5 px-1.5 rounded-lg ${branch.operatingHours.daysOpen.includes(d) ? "bg-brand-color-500 text-white" : "bg-gray-100 text-gray-900"}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg text-white ${branch.isActive ? "bg-dark-green-500 " : "bg-red-600"}`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleStatus(branch._id)}
                      className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-500 bg-white text-gray-900 transition-color duration-0.5 hover:bg-brand-color-500 hover:text-white hover:border-brand-color-600"
                      aria-label={`${branch.isActive ? "Deactivate" : "Activate"} button `}
                    >
                      {branch.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title="Add New Branch" onClose={() => setShowModal(false)}>
          {/* Modal Body */}
          <div>
            {/* Basic Info */}
            <p className="text-sm font-bold text-gray-900 tracking-widest uppercase mb-3">
              Basic Info
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <InputField
                label="Branch Name"
                value={form.name}
                onChange={handleChangeForm}
                name="name"
                placeholder="e.g., Century Mall"
                error={errors.name}
                required
              />

              <InputField
                label="Branch Code"
                value={form.code}
                onChange={handleChangeForm}
                name="code"
                placeholder="e.g., BR-004"
                error={errors.code}
                required
              />
            </div>

            {/* Address */}
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
                  required
                />

                <InputField
                  label="ZIP Code"
                  value={form.zipCode}
                  onChange={handleChangeForm}
                  name="zipCode"
                  placeholder="e.g., Century Mall"
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

            {/* Operating Hours */}
            <p className="block text-sm font-semibold text-gray-700">
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

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="py-1.5 px-3 rounded-lg border border-gray-500 text-gray-600 text-sm font-medium hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="py-1.5 px-3 rounded-lg border-0 bg-brand-color-500 hover:bg-brand-color-600 text-sm text-white cursor-pointer"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Add Branch
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
