"use client";

import { InputField } from "@/components/ui/InputField";
import { TextareaField } from "@/components/ui/TextAreaField";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { CustomerErrors } from "./useFormErrors";
import { OrderFormState } from "./FormSchema";

type customerDataProps = {
  customerData: OrderFormState["customer"];
  errors: CustomerErrors;
  onChange: (type: keyof OrderFormState, field: string, value: string) => void;
};

const CustomerDetails = ({
  customerData,
  errors,
  onChange,
}: customerDataProps) => {
  
  return (
    <div className="space-y-5 py-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First name"
          placeholder="Juan"
          type="text"
          name="firstName"
          value={customerData.firstName}
          onChange={(e) => onChange("customer", "firstName", e.target.value)}
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
        leftIcon={<DynamicIcon name="Phone" size={15} />}
        error={errors.customerPhone}
      />
      <TextareaField
        label="Note (Optional)"
        placeholder="Enter any special instructions for your order"
        name="note"
        value={customerData.notes}
        onChange={(e) => onChange("customer", "note", e.target.value)}
      />
    </div>
  );
};

export default CustomerDetails;
