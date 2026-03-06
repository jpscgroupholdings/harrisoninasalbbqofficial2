import { Customer, CustomerCreateInput } from "@/types/CustomerAccountType";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const createUser = async (
  customerData: CustomerCreateInput,
): Promise<Customer> => {
  const response = await fetch("/api/auth/customer/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customerData),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
};

export const useCustomerSignup = () => {
  const queryClient = useQueryClient();

  return useMutation<Customer, { error: string }, CustomerCreateInput>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Account created successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create an account!",
      );
    },
  });
};
