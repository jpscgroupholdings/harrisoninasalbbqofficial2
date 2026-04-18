import { useState } from "react";
import { CustomerSchema, OrderFormSchema, OrderFormState, ShippingSchema } from "./FormSchema";
import z from "zod";

export type CustomerErrors = Partial<Record<keyof z.infer<typeof CustomerSchema>, string>>;
export type ShippingErrors = Partial<Record<keyof z.infer<typeof ShippingSchema>, string>>;

const useFormErrors = (orderDetails: OrderFormState) => {
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});

  const validateAll = (): boolean => {
    const result = OrderFormSchema.safeParse(orderDetails);

    if (result.success) {
      setCustomerErrors({});
      setShippingErrors({});
      return true;
    }

    const formattedCustomerErrors: CustomerErrors = {};
    const formattedShippingErrors: ShippingErrors = {};

    result.error.issues.forEach((err) => {
      const path = err.path.join(".");

      switch (path) {
        case "customer.firstName":
          formattedCustomerErrors.firstName = err.message;
          break;
        case "customer.lastName":
          formattedCustomerErrors.lastName = err.message;
          break;
        case "customer.customerPhone":
          formattedCustomerErrors.customerPhone = err.message;
          break;
        case "customer.customerEmail":
          formattedCustomerErrors.customerEmail = err.message;
          break;
        case "shippingAddress.line1":
          formattedShippingErrors.line1 = err.message;
          break;
        case "shippingAddress.city":
          formattedShippingErrors.city = err.message;
          break;
        case "shippingAddress.province":
          formattedShippingErrors.province = err.message;
          break;
        case "shippingAddress.zipCode":
          formattedShippingErrors.zipCode = err.message;
          break;
      }
    });

    setCustomerErrors(formattedCustomerErrors);
    setShippingErrors(formattedShippingErrors);
    return false;
  };

  return { validateAll, customerErrors, shippingErrors, setCustomerErrors, setShippingErrors };
};

export default useFormErrors;