"use client";

import { InputField } from "@/components/ui/FormComponents/InputField";
import { PsgcAddressFields } from "@/components/customer/PsgcAddressFields";
import type { PsgcAddressSelection } from "@/lib/psgcAddress";
import { ModalType, useModalQuery } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ShippingErrors } from "../useFormErrors";
import { OrderFormState } from "../FormSchema";
import dynamic from "next/dynamic";
import type { ResolvedDeliveryAddress } from "./DeliveryLocationPicker";
import Modal from "@/components/ui/Modal";
import { useState } from "react";

const DeliveryLocationPicker = dynamic(
  () => import("./DeliveryLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading delivery map...
      </div>
    ),
  },
);

type ShippingAddressProps = {
  shippingAddress: OrderFormState["shippingAddress"];
  errors: ShippingErrors;
  isAuthenticated: boolean;
  shouldShowSyncProfileDetails: boolean;
  onSyncProfileDetails: () => void;
  onChange: (type: keyof Omit<OrderFormState, "fulfillmentType">, field: string, value: string) => void;
  onBlur: (field: keyof ShippingErrors, value: string) => void;
  onCoordinatesChange: (
    coordinates: OrderFormState["shippingAddress"]["coordinates"],
  ) => void;
  openModal: (value: ModalType) => void;
};

const ShippingAddress = ({
  shippingAddress,
  errors,
  isAuthenticated,
  shouldShowSyncProfileDetails,
  onSyncProfileDetails,
  onChange,
  onBlur,
  onCoordinatesChange,
}: ShippingAddressProps) => {
  const addressQuery = [
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.province,
    shippingAddress.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const handleAddressResolved = (address: ResolvedDeliveryAddress) => {
    if (address.placeName) {
      onChange("shippingAddress", "placeName", address.placeName);
    }

    if (address.line2) {
      onChange("shippingAddress", "line2", address.line2);
      onBlur("line2", address.line2);
    }

    if (address.subMunicipality) {
      onChange("shippingAddress", "subMunicipality", address.subMunicipality);
    }

    if (address.city) {
      onChange("shippingAddress", "city", address.city);
      onBlur("city", address.city);
    }

    if (address.province) {
      onChange("shippingAddress", "province", address.province);
      onBlur("province", address.province);
    }

    if (address.zipCode) {
      onChange("shippingAddress", "zipCode", address.zipCode);
      onBlur("zipCode", address.zipCode);
    }
  };

  const handlePsgcFieldChange = (
    field: keyof PsgcAddressSelection,
    value: string,
  ) => {
    onChange("shippingAddress", field, value);

    if (field === "city" || field === "province" || field === "line2") {
      onBlur(field, value);
    }
  };

  const { modal, openModal, closeModal } = useModalQuery();
  const [showProfileHint, setShowProfileHint] = useState(false);
  const [showMapHint, setShowMapHint] = useState(false);
  const hasPinnedLocation = Boolean(shippingAddress.coordinates);
  const pinnedLocationLabel =
    shippingAddress.placeName ||
    [shippingAddress.line2, shippingAddress.city].filter(Boolean).join(", ");
  const pinButtonTitle = hasPinnedLocation
    ? "Delivery location pinned"
    : "Pin your delivery location";
  const pinButtonDescription = hasPinnedLocation
    ? pinnedLocationLabel || "Coordinates saved for delivery"
    : "Open the map to search, use current location, or place the pin manually.";

  return (
    <div className="space-y-5 py-6">
      {shouldShowSyncProfileDetails && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSyncProfileDetails}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <DynamicIcon name="RefreshCw" size={15} />
            Sync from profile
          </button>
        </div>
      )}

      {isAuthenticated && (
        <div className="space-y-2 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => setShowProfileHint((current) => !current)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <DynamicIcon name="CircleHelp" size={14} />
            Why is my address filled?
          </button>
          {showProfileHint && (
            <p className="text-xs leading-5 text-slate-500">
              Your saved profile address may be used as a starting point. Check
              the pinned map location and address fields before placing the
              order.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left shadow-sm transition-colors ${
          errors.coordinates
            ? "border-red-300 bg-red-50 hover:bg-red-100"
            : hasPinnedLocation
              ? "border-green-200 bg-green-50 hover:bg-green-100"
              : "border-brand-color-200 bg-brand-color-50 hover:bg-brand-color-100"
        }`}
        onClick={() => openModal("shipping-address-coordinates")}
      >
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            errors.coordinates
              ? "bg-red-100 text-red-600"
              : hasPinnedLocation
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
          <span
            className={`block text-sm font-semibold ${
              errors.coordinates ? "text-red-700" : "text-slate-900"
            }`}
          >
            {pinButtonTitle}
          </span>
          <span
            className={`mt-1 block text-xs leading-5 ${
              errors.coordinates ? "text-red-600" : "text-slate-600"
            }`}
          >
            {errors.coordinates || pinButtonDescription}
          </span>
          {hasPinnedLocation && (
            <span className="mt-2 block text-[11px] font-medium text-slate-500">
              {shippingAddress.coordinates?.lat.toFixed(6)},{" "}
              {shippingAddress.coordinates?.lng.toFixed(6)}
            </span>
          )}
        </span>
        <DynamicIcon
          name="ChevronRight"
          size={18}
          className="mt-2 shrink-0 text-slate-400"
        />
      </button>

      <div className="space-y-2 text-sm text-slate-600">
        <button
          type="button"
          onClick={() => setShowMapHint((current) => !current)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <DynamicIcon name="CircleHelp" size={14} />
          How is delivery fee calculated?
        </button>
        {showMapHint && (
          <p className="text-xs leading-5 text-slate-500">
            Delivery fee and service coverage follow the pinned map
            coordinates. The city, area, barangay, and address fields add the
            delivery details, so keep them accurate and matched with the pin.
          </p>
        )}
      </div>

      {/* Line 1 */}
      <div className="grid grid-cols-1 gap-4">
        <InputField
          label="Address line 1"
          subLabel="House no., Street name."
          placeholder="House no. / Street"
          type="text"
          name="line1"
          value={shippingAddress.line1}
          onChange={(e) => onChange("shippingAddress", "line1", e.target.value)}
          onBlur={(e) => onBlur("line1", e.target.value)}
          required
          leftIcon={<DynamicIcon name="MapPin" size={15} />}
          error={errors.line1}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PsgcAddressFields
          value={shippingAddress}
          errors={{
            city: errors.city,
            province: errors.province,
            line2: errors.line2,
          }}
          onFieldChange={handlePsgcFieldChange}
          onFieldBlur={onBlur}
        />
      </div>

      {/* Postal Code & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Postal Code"
          placeholder="e.g. 1100"
          type="text"
          name="zipCode"
          value={shippingAddress.zipCode}
          onChange={(e) =>
            onChange("shippingAddress", "zipCode", e.target.value)
          }
          onBlur={(e) => onBlur("zipCode", e.target.value)}
          required
          leftIcon={<DynamicIcon name="Hash" size={15} />}
          error={errors.zipCode}
        />
        <InputField
          label="Country"
          type="text"
          name="country"
          value="Philippines"
          disabled
          className="bg-gray-200 text-gray-400"
          leftIcon={<DynamicIcon name="Globe" size={15} />}
        />
      </div>

      {/* Landmark */}
      <InputField
        label="Landmark (Optional)"
        placeholder="e.g. Near Jollibee on Katipunan"
        type="text"
        name="landmark"
        value={shippingAddress.landmark ?? ""}
        onChange={(e) =>
          onChange("shippingAddress", "landmark", e.target.value)
        }
        leftIcon={<DynamicIcon name="Flag" size={15} />}
        error={errors.landmark}
      />

      {modal === "shipping-address-coordinates" && (
        <Modal
          onClose={closeModal}
          title="Pin delivery location"
          subTitle="  Search your address, allow current location, or click and drag the
                pin for the exact dropoff point."
        >
          <>
            <DeliveryLocationPicker
              value={shippingAddress.coordinates}
              addressQuery={shippingAddress.placeName || addressQuery}
              error={errors.coordinates}
              onChange={onCoordinatesChange}
              onAddressResolved={handleAddressResolved}
              onResolvingAddressChange={setIsResolvingAddress}
            />
            {shippingAddress?.placeName && (
              <div className="w-full flex py-2">
                <button
                  disabled={isResolvingAddress}
                  className="ml-auto flex items-center gap-2 text-white bg-brand-color-500 hover:bg-brand-color-600 py-2 px-4 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  onClick={closeModal}
                >
                  <DynamicIcon name="MapPin" />
                  {isResolvingAddress
                    ? "Searching place..."
                    : shippingAddress?.placeName}
                </button>
              </div>
            )}
          </>
        </Modal>
      )}
    </div>
  );
};

export default ShippingAddress;
