import { Customer } from "@/types/CustomerAccountType";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Staff } from "@/types/staff";

const hasToken = (cookieName: string): boolean => {
  if (typeof document === "undefined") return false; // SSR safe
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${cookieName}=`));
};

export const useCustomerMe = () => {
  return useQuery<Customer>({
    queryKey: ["customers"],
    queryFn: () => apiClient.get("/auth/customer/me"),
    enabled: hasToken("customer_token"),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdminMe = () => {
  return useQuery<Staff>({
    queryKey: ["admins"],
    queryFn: () => apiClient.get("/auth/admin/me"),
    enabled: hasToken("admin_token"),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};