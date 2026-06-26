"use client";

import { InputField } from "@/components/ui/FormComponents/InputField";
import { TextareaField } from "@/components/ui/FormComponents/TextAreaField";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { CustomerErrors } from "../useFormErrors";
import { OrderFormState } from "../FormSchema";
import { useState } from "react";

type customerDataProps = {
  customerData: OrderFormState["customer"];
  errors: CustomerErrors;
  isAuthenticated: boolean;
  isDelivery: boolean;
  shouldShowSyncProfileDetails: boolean;
  onSyncProfileDetails: () => void;
  onChange: (type: keyof Omit<OrderFormState, "fulfillmentType">, field: string, value: string) => void;
  onBlur: (field: keyof CustomerErrors, value: string) => void
};

const CustomerDetails = ({
  customerData,
  errors,
  isAuthenticated,
  isDelivery,
  shouldShowSyncProfileDetails,
  onSyncProfileDetails,
  onChange,
  onBlur
}: customerDataProps) => {
  const [showProfileHint, setShowProfileHint] = useState(false);

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
            Why are these details prefilled?
          </button>
          {showProfileHint && (
            <p className="text-xs leading-5 text-slate-500">
              We prefill checkout from your saved profile when available.
              {isDelivery
                ? " Delivery fee is estimated from your saved or pinned delivery location and updates when the delivery pin changes."
                : " For pickup, we use these details to contact you when the order is ready."}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First name"
          placeholder="Juan"
          type="text"
          name="firstName"
          value={customerData.firstName}
          onChange={(e) => onChange("customer", "firstName", e.target.value)}
          onBlur={(e) => onBlur("firstName", e.target.value)}
          required
          leftIcon={<DynamicIcon name="User" size={15} />}
          error={errors.firstName}
        />
        
        <InputField
          label="Last Name"
          placeholder="Dela Cruz"
          type="text"
          name="lastName"
          value={customerData.lastName}
          onChange={(e) => onChange("customer", "lastName", e.target.value)}
          onBlur={(e) => onBlur("lastName", e.target.value)}
          required
          leftIcon={<DynamicIcon name="User" size={15} />}
          error={errors.lastName}
        />
      </div>
      <InputField
        label="Email"
        placeholder="juan@example.com"
        type="email"
        name="email"
        value={customerData.customerEmail}
        onChange={(e) => onChange("customer", "customerEmail", e.target.value)}
        onBlur={(e) => onBlur("customerEmail", e.target.value)}
        leftIcon={<DynamicIcon name="Mail" size={15} />}
        error={errors.customerEmail}
        required
      />
      <InputField
        label="Phone number"
        placeholder="09171234567"
        type="tel"
        name="customerPhone"
        value={customerData.customerPhone}
        onChange={(e) => onChange("customer", "customerPhone", e.target.value)}
        onBlur={(e) => onBlur("customerPhone", e.target.value)}
        leftIcon={<DynamicIcon name="Phone" size={15} />}
        error={errors.customerPhone}
        required
      />
      <TextareaField
        label="Note (Optional)"
        placeholder="Enter any special instructions for your order"
        name="note"
        value={customerData.notes}
        onChange={(e) => onChange("customer", "notes", e.target.value)}
      />
    </div>
  );
};

export default CustomerDetails;
