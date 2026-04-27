"use client";

// ─── Tab: Address ─────────────────────────────────────────────────────────────

import { InputField } from "@/components/ui/InputField";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { SectionCard } from "../component/SectionCard";
import { toast } from "sonner";
import { useMyAddress, useUpdateAddress } from "../../hooks/useMyAddress";
import { useEffect, useState } from "react";

export interface AddressForm {
  line1: string;
  line2: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  landmark: string;
}

const PROVINCES = [
  "Metro Manila",
  "Cebu",
  "Davao del Sur",
  "Rizal",
  "Bulacan",
  "Cavite",
  "Laguna",
  "Pampanga",
  "Batangas",
  "Iloilo",
];

const AddressTab = () => {
  const updateAddress = useUpdateAddress();
  const { data: myAddress } = useMyAddress();

  const [form, setForm] = useState<AddressForm>({
    line1: "",
    line2: "",
    city: "",
    province: "",
    zipCode: "",
    country: "Philippines",
    landmark: "",
  });
  const [saving, setSaving] = useState(false);

  // Load existing address on mount
  useEffect(() => {
    if (myAddress?.shippingAddress) {
      setForm(myAddress.shippingAddress);
    }
  }, [myAddress]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        <div className="sm:col-span-2">
          <InputField
            label="Address Line 2"
            name="line2"
            value={form.line2}
            onChange={handleChange}
            placeholder="Building, Floor, Suite (optional)"
            leftIcon={<DynamicIcon name="Building" />}
          />
        </div>
        <InputField
          label="City / Municipality"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="Quezon City"
          leftIcon={<DynamicIcon name="MapPin" />}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Province <span className="text-brand-color-500">*</span>
          </label>
          <select
            name="province"
            value={form.province}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-color-400 focus:border-transparent transition-all"
          >
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
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
