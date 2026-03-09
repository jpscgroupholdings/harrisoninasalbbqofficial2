import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useLogoutAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post("/auth/admin/logout"),
    onSuccess: () => {
      queryClient.clear(); // ← clears all cached queries (admin-me, branches, staff, etc.)
      window.location.href = "/auth/login"; // ← full reload, cleaner for auth transitions
    },
    onError: () => {
      toast.error("Failed to logout. Try again.");
    },
  });
};

export const useLogoutCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post("/auth/customer/logout"),
    onSuccess: () => {
      queryClient.clear(); // ← clears customer-me and other cached data
      window.location.href = "/";
    },
    onError: () => {
      toast.error("Failed to logout. Try again.");
    },
  });
};
