"use client";

import { InputField } from "@/components/ui/InputField";
import { Branch } from "@/types/branch";
import { ModalType } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { ShippingErrors } from "./useFormErrors";
import { OrderFormState } from "./FormSchema";

type ShippingAddressProps = {
  shippingAddress: OrderFormState["shippingAddress"];
  errors: ShippingErrors;
  onChange: (type: keyof OrderFormState, field: string, value: string) => void;
  openModal: (value: ModalType) => void;
};

const ShippingAddress = ({
  shippingAddress,
  errors,
  onChange,
}: ShippingAddressProps) => {
  return (
    <div className="space-y-5 py-6">
      {/* Line 1 & Line 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Line 1"
          placeholder="House no. / Street"
          type="text"
          name="line1"
          value={shippingAddress.line1}
          onChange={(e) => onChange("shippingAddress","line1", e.target.value)}
          required
          leftIcon={<DynamicIcon name="MapPin" size={15} />}
          error={errors.line1}
        />
        <InputField
          label="Line 2"
          placeholder="Barangay / Subdivision"
          type="text"
          name="line2"
          value={shippingAddress.line2 ?? ""}
          onChange={(e) => onChange("shippingAddress","line2", e.target.value)}
          leftIcon={<DynamicIcon name="MapPin" size={15} />}
          error={errors.line2}
        />
      </div>

      {/* City & Province */}

      <InputField
        label="City"
        placeholder="e.g. Quezon City"
        type="text"
        name="city"
        value={shippingAddress.city}
        onChange={(e) => onChange("shippingAddress","city", e.target.value)}
        required
        leftIcon={<DynamicIcon name="Building2" size={15} />}
        error={errors.city}
      />
      <InputField
        label="Province"
        placeholder="e.g. Metro Manila"
        type="text"
        name="province"
        value={shippingAddress.province}
        onChange={(e) => onChange("shippingAddress","province", e.target.value)}
        required
        leftIcon={<DynamicIcon name="Map" size={15} />}
        error={errors.province}
      />

      {/* Postal Code & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Postal Code"
          placeholder="e.g. 1100"
          type="text"
          name="zipCode"
          value={shippingAddress.zipCode}
          onChange={(e) => onChange("shippingAddress","zipCode", e.target.value)}
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
        onChange={(e) => onChange("shippingAddress","landmark", e.target.value)}
        leftIcon={<DynamicIcon name="Flag" size={15} />}
        error={errors.landmark}
      />
    </div>
  );
};

export default ShippingAddress;
