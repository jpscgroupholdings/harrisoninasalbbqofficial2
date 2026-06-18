"use client";

// ─── Tab: Address ─────────────────────────────────────────────────────────────

import { InputField } from "@/components/ui/InputField";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  PsgcAddressFields,
} from "@/components/customer/PsgcAddressFields";
import type { ShippingAddressForm } from "@/types/address";
import { SectionCard } from "../component/SectionCard";
import { toast } from "sonner";
import { useMyAddress, useUpdateAddress } from "../../hooks/useMyAddress";
import { useEffect, useState } from "react";
import { NCR_REGION, type PsgcAddressSelection } from "@/lib/psgcAddress";

const DEFAULT_ADDRESS_FORM: ShippingAddressForm = {
  line1: "",
  line2: "",
  city: "",
  cityCode: "",
  province: NCR_REGION.displayName,
  region: NCR_REGION.name,
  regionCode: NCR_REGION.code,
  barangayCode: "",
  subMunicipality: "",
  subMunicipalityCode: "",
  zipCode: "",
  country: "Philippines",
  landmark: "",
};

const AddressTab = () => {
  const updateAddress = useUpdateAddress();
  const { data: myAddress, isPending } = useMyAddress();

  const [form, setForm] = useState<ShippingAddressForm>(DEFAULT_ADDRESS_FORM);
  const [saving, setSaving] = useState(false);

  // Load existing address on mount
  useEffect(() => {
    if (myAddress?.shippingAddress) {
      setForm({
        ...DEFAULT_ADDRESS_FORM,
        ...myAddress.shippingAddress,
        province:
          myAddress.shippingAddress.province || NCR_REGION.displayName,
        region: myAddress.shippingAddress.region || NCR_REGION.name,
        regionCode: myAddress.shippingAddress.regionCode || NCR_REGION.code,
        country: "Philippines",
      });
    }
  }, [myAddress]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressFieldChange = (
    field: keyof PsgcAddressSelection,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAddress.mutateAsync({ address: form });
    } catch (error) {
      console.error("Address save error:", error); // ← see full error in console
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (isPending) {
    return (
      <SectionCard
        title="Shipping Address"
        subtitle="Default address for deliveries and orders"
        icon="MapPin"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {/* Line 1 */}
          <div className="sm:col-span-2 h-10 bg-gray-100 rounded-xl" />
          {/* Region + City */}
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          {/* Barangay + Province */}
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          {/* ZIP + Country */}
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          {/* Landmark */}
          <div className="sm:col-span-2 h-10 bg-gray-100 rounded-xl" />
        </div>

        {/* Save button skeleton */}
        <div className="mt-6 flex justify-end">
          <div className="h-10 w-36 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Shipping Address"
      subtitle="Default address for deliveries and orders"
      icon="MapPin"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Address Line 1"
            name="line1"
            value={form.line1}
            onChange={handleChange}
            placeholder="House/Unit No., Street Name, Barangay"
            leftIcon={<DynamicIcon name="Home" />}
            required
          />
        </div>
        <PsgcAddressFields
          value={form}
          onFieldChange={handleAddressFieldChange}
        />
        <InputField
          label="ZIP Code"
          name="zipCode"
          value={form.zipCode}
          onChange={handleChange}
          placeholder="1100"
          leftIcon={<DynamicIcon name="Hash" />}
          required
        />
        <InputField
          label="Country"
          name="country"
          value={form.country}
          onChange={handleChange}
          leftIcon={<DynamicIcon name="Globe" />}
          disabled
        />
        <div className="sm:col-span-2">
          <InputField
            label="Landmark"
            name="landmark"
            value={form.landmark}
            onChange={handleChange}
            placeholder="Near SM, beside the church, etc."
            leftIcon={<DynamicIcon name="Navigation" />}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer`}
        >
          {saving ? (
            <DynamicIcon name="Loader2" size={15} className="animate-spin" />
          ) : (
            <DynamicIcon name="Save" size={15} />
          )}
          {saving ? "Saving..." : "Save Address"}
        </button>
      </div>
    </SectionCard>
  );
};

export default AddressTab;
