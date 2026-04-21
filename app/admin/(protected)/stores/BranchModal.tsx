import { InputField } from "@/components/ui/InputField";
import { useCreateBranch, useUpdateBranch } from "@/hooks/api/useBranch";
import { Branch, BranchFormData, BranchFormErrors } from "@/types/branch";
import { Loader2, MapPin, Copy, Check } from "lucide-react";
import React, { ChangeEvent, useState } from "react";
import { emptyForm } from "./page";
import Modal from "@/components/ui/Modal";
import MapParent from "./MapComponent/MapParent";

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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<"lat" | "lng" | null>(null);

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const validate = (): BranchFormErrors => {
    const e: BranchFormErrors = {};
    if (!form.name.trim()) e.name = "Branch name is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.location?.latitude || !form.location?.longitude) {
      e.location = "Coordinates (latitude & longitude) are required.";
    }
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
      await createBranch.mutateAsync(form);
    }

    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
    setBranchToEdit(null);
  };

  const handleChangeForm = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCoordinateChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "latitude" | "longitude",
  ) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      location: {
        latitude: prev.location?.latitude || "",
        longitude: prev.location?.longitude || "",
        [type]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  // Called when user selects coordinates from the map
  const handleMapCoordinates = (latitude: number, longitude: number) => {
    setForm((prev) => ({
      ...prev,
      location: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    }));
    setErrors((prev) => ({ ...prev, location: undefined }));
    setIsMapOpen(false);
  };

  const copyToClipboard = (value: string, field: "lat" | "lng") => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasCoordinates = form.location?.latitude && form.location?.longitude;

  return (
    <div>
      {/* Basic Info */}
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
      </div>


      {/* Coordinates Section */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-brand-color-600" />
          <p className="text-sm font-semibold text-slate-700">
            Location Coordinates
          </p>
        </div>

        {/* Manual Coordinate Input */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Latitude
            </label>
            <div className="relative">
              <InputField
                type="text"
                name="latitude"
                value={form.location?.latitude || ""}
                onChange={(e) => handleCoordinateChange(e, "latitude")}
                placeholder="e.g., 14.5995"
                className="pr-9"
              />
              {form.location?.latitude && (
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(form.location!.latitude, "lat")
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded"
                  title="Copy latitude"
                >
                  {copiedField === "lat" ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} className="text-slate-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Longitude
            </label>
            <div className="relative">
              <InputField
                type="text"
                name="longitude"
                value={form.location?.longitude || ""}
                onChange={(e) => handleCoordinateChange(e, "longitude")}
                placeholder="e.g., 120.9842"
                className="pr-9"
              />
              {form.location?.longitude && (
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(form.location!.longitude, "lng")
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded"
                  title="Copy longitude"
                >
                  {copiedField === "lng" ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} className="text-slate-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map Selection Button */}
        <button
          type="button"
          onClick={() => setIsMapOpen(true)}
          className="w-full py-2.5 px-3 rounded-lg border border-brand-color-400 bg-brand-color-500 hover:bg-brand-color-600 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MapPin size={16} />
          {hasCoordinates ? "Update Location on Map" : "Set Location on Map"}
        </button>

        {/* Coordinate Display */}
        {hasCoordinates && (
          <div className="mt-3 p-2.5 bg-white rounded border border-brand-color-200">
            <p className="text-xs text-slate-600">
              <span className="font-medium">Coordinates:</span>{" "}
              {form.location?.latitude}, {form.location?.longitude}
            </p>
          </div>
        )}

        {/* Error Message */}
        {errors.location && (
          <p className="mt-2 text-sm text-red-600 font-medium">
            {errors.location}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowModal(false)}
          className="py-1.5 px-3 rounded-lg border border-slate-500 text-slate-600 font-medium hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={createBranch.isPending || updateBranch.isPending}
          className="py-1.5 px-3 rounded-lg bg-brand-color-500 hover:bg-brand-color-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
        >
          {(createBranch.isPending || updateBranch.isPending) && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {createBranch.isPending || updateBranch.isPending
            ? "Saving..."
            : branchToEdit
              ? "Update Branch"
              : "Create Branch"}
        </button>
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <Modal
          onClose={() => setIsMapOpen(false)}
          title={`${branchToEdit ? "Update" : "Select"} Branch Location ${branchToEdit ? `for ${branchToEdit.name}` : ""}`}
        >
          <MapParent onSelectCoordinates={handleMapCoordinates} />
        </Modal>
      )}
    </div>
  );
};

export default BranchModal;
