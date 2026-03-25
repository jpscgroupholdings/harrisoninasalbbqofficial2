// BranchManagement.tsx  — cleaned up
"use client";

import SectionHeader from "@/app/admin/components/SectionHeader";
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
import BranchModal from "./BranchModal";

export const emptyForm: BranchFormData = {
  name: "",
  address: "",
  contactNumber: "",
  open: "08:00",
  close: "22:00",
};

export default function BranchManagement() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [errors, setErrors] = useState<BranchFormErrors>({});
  const [search, setSearch] = useState("");

  const { data: branches = [], isLoading } = useBranches();

  const toggleStatus = useToggleBranchStatus();

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEditClick = (branch: Branch) => {
    setBranchToEdit(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      contactNumber: branch.contactNumber,
      open: branch.operatingHours.open,
      close: branch.operatingHours.close,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setBranchToEdit(null);
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
                    <div>{branch.address}</div>
                  </TableCell>
                  <TableCell>{branch.contactNumber || "—"}</TableCell>
                  <TableCell>
                    {branch.operatingHours.open} – {branch.operatingHours.close}
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
          <BranchModal
            branchToEdit={branchToEdit}
            setBranchToEdit={setBranchToEdit}
            setShowModal={setShowModal}
            form={form}
            setForm={setForm}
            errors={errors}
            setErrors={setErrors}
          />
        </Modal>
      )}
    </div>
  );
}
