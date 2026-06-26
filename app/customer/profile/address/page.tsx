"use client";

// ─── Tab: Address ─────────────────────────────────────────────────────────────

import { InputField } from "@/components/ui/FormComponents/InputField";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { PsgcAddressFields } from "@/components/customer/PsgcAddressFields";
import type { ShippingAddressForm } from "@/types/address";
import { SectionCard } from "../component/SectionCard";
import { toast } from "sonner";
import { useMyAddress, useUpdateAddress } from "../../hooks/useMyAddress";
import { useEffect, useState } from "react";
import { NCR_REGION, type PsgcAddressSelection } from "@/lib/psgcAddress";
import { useModalQuery } from "@/hooks/utils/useModalQuery";
import Modal from "@/components/ui/Modal";
import dynamic from "next/dynamic";
import type { ResolvedDeliveryAddress } from "../../checkout/shipping/DeliveryLocationPicker";

const DeliveryLocationPicker = dynamic(
  () => import("../../checkout/shipping/DeliveryLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading delivery map...
      </div>
    ),
  },
);

const DEFAULT_ADDRESS_FORM: ShippingAddressForm = {
  placeName: "",
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

  const { modal, openModal, closeModal } = useModalQuery();

  const hasPinnedLocation = Boolean(form.coordinates);

  // Keep the form aligned with the saved profile address returned by the API.
  useEffect(() => {
    if (myAddress?.shippingAddress) {
      setForm({
        ...DEFAULT_ADDRESS_FORM,
        ...myAddress.shippingAddress,
        province: myAddress.shippingAddress.province || NCR_REGION.displayName,
        region: myAddress.shippingAddress.region || NCR_REGION.name,
        regionCode: myAddress.shippingAddress.regionCode || NCR_REGION.code,
        country: "Philippines",
      });
    }
  }, [myAddress]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAddressFieldChange = (
    field: keyof PsgcAddressSelection,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // The map pin itself only owns coordinates. These coordinates are saved on
  // the profile and later used by checkout as the default delivery pin.
  const handleCoordinatesChange = (
    coordinates: ShippingAddressForm["coordinates"],
  ) => {
    setForm((prev) => ({ ...prev, coordinates }));
  };

  // Reverse geocoding gives us address names, not PSGC codes. We update the
  // visible fields from those names, then clear old codes that may belong to a
  // previous city/barangay. PsgcAddressFields will match the new names against
  // the loaded PSGC options and write the correct codes back into this form.
  const handleAddressResolved = (address: ResolvedDeliveryAddress) => {
    setForm((prev) => ({
      ...prev,
      ...(address.line2
        ? {
            // line2 is the barangay display value used by profile and checkout.
            line2: address.line2,
            barangayCode: "",
          }
        : {}),
      ...(address.subMunicipality
        ? {
            // Manila addresses need an extra area level before barangay.
            subMunicipality: address.subMunicipality,
            subMunicipalityCode: "",
          }
        : {}),
      ...(address.city
        ? {
            // Keep the service region locked to NCR even when the map returns
            // only a city name.
            city: address.city,
            cityCode: "",
            province: NCR_REGION.displayName,
            region: NCR_REGION.name,
            regionCode: NCR_REGION.code,
          }
        : {}),
      ...(address.zipCode ? { zipCode: address.zipCode } : {}),
      ...(address.placeName
        ? {
            placeName: address.placeName,
          }
        : {}),
    }));
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
      <div className="mb-5">
        <button
          type="button"
          onClick={() => openModal("shipping-address-coordinates")}
          className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors ${
            hasPinnedLocation
              ? "border-green-200 bg-green-50 hover:bg-green-100"
              : "border-brand-color-200 bg-brand-color-50 hover:bg-brand-color-100"
          }`}
        >
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              hasPinnedLocation
                ? "bg-green-100 text-green-700"
                : "bg-white text-brand-color-600"
            }`}
          >
            <DynamicIcon
              name={hasPinnedLocation ? "MapPinned" : "MapPinPlus"}
              size={18}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              {hasPinnedLocation
                ? "Default delivery pin saved"
                : "Pin your default delivery location"}
            </span>

            <span className="mt-1 block text-xs leading-5 text-slate-600">
              {form.placeName ||
                "The pin saves coordinates for checkout prefill. Your selected city, barangay, and address line stay as the official address."}
            </span>

            {hasPinnedLocation && (
              <span className="mt-2 block text-[11px] font-medium text-slate-500">
                {form.coordinates?.lat.toFixed(6)},{" "}
                {form.coordinates?.lng.toFixed(6)}
              </span>
            )}
          </span>
          <DynamicIcon
            name="ChevronRight"
            size={18}
            className="mt-2 shrink-0 text-slate-400"
          />
        </button>
      </div>

      {modal === "shipping-address-coordinates" && (
        <Modal
          title="Pin your default delivery location"
          subTitle="Search, use current location, or click the map to save checkout prefill coordinates."
          onClose={closeModal}
        >
          <DeliveryLocationPicker
            value={form.coordinates}
            addressQuery={form.placeName ?? ""}
            onChange={handleCoordinatesChange}
            onAddressResolved={handleAddressResolved}
          />
          {form.coordinates && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-color-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-color-600"
              >
                <DynamicIcon name="MapPinned" size={15} />
                {form.placeName || "Use this pin location"}
              </button>
            </div>
          )}
        </Modal>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Address Line 1"
            name="line1"
            value={form.line1}
            onChange={handleInputChange}
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
          onChange={handleInputChange}
          placeholder="1100"
          leftIcon={<DynamicIcon name="Hash" />}
          required
        />
        <InputField
          label="Country"
          name="country"
          value={form.country}
          onChange={handleInputChange}
          leftIcon={<DynamicIcon name="Globe" />}
          disabled
        />
        <div className="sm:col-span-2">
          <InputField
            label="Landmark"
            name="landmark"
            value={form.landmark}
            onChange={handleInputChange}
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
