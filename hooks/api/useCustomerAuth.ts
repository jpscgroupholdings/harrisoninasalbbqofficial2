import { apiClient } from "@/lib/apiClient";
import { Customer, CustomerCreateInput } from "@/types/CustomerAccountType";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCustomerSignup = () => {
  const queryClient = useQueryClient();

  return useMutation<Customer, { error: string }, CustomerCreateInput>({
    mutationFn: (data) => apiClient.post("/auth/customer/signup", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Account created successfully!");
    },
    onError: (error) => {
      toast.error(
        error.error ?? "Failed to create an account!",
      );
    },
  });
};

export const useCustomerLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<CustomerCreateInput, "phone" | "fullname">) => apiClient.post("/auth/customer/login", data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["customers"]});
            toast.success("Login Successfully!")
        },
        onError: (error: any) =>{
            toast.error(error.error ?? "Failed to login!")
        }
    }) 
}
