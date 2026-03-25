import { InputField } from "@/components/ui/InputField";
import { useCreateBranch, useUpdateBranch } from "@/hooks/api/useBranch";
import { Branch, BranchFormData, BranchFormErrors } from "@/types/branch";
import { Loader2 } from "lucide-react";
import React, { ChangeEvent, useState } from "react";
import { emptyForm } from "./page";

type BranchModalProps = {
  form: BranchFormData;
  setForm: React.Dispatch<React.SetStateAction<BranchFormData>>;
  errors: BranchFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<BranchFormErrors>>;
  branchToEdit: Branch | null;
  setBranchToEdit: React.Dispatch<React.SetStateAction<Branch | null>>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const BranchModal = ({
  branchToEdit,
  setBranchToEdit,
  setShowModal,
  form,
  setForm,
  errors,
  setErrors,
}: BranchModalProps) => {
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const validate = (): BranchFormErrors => {
    const e: BranchFormErrors = {};
    if (!form.name.trim()) e.name = "Branch name is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    return e;
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
  return (
    <div>
      <div className="flex flex-col gap-2.5 mb-4">
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

        <InputField
          label="Address"
          value={form.address}
          onChange={handleChangeForm}
          name="address"
          placeholder="e.g., 123 Rizal Ave"
          error={errors.address}
          className="capitalize"
          required
        />
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
  );
};

export default BranchModal;
