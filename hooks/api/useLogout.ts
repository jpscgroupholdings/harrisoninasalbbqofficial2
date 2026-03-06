import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useLogoutAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to logout");
    },
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
    mutationFn: async () => {
      const response = await fetch("/api/auth/customer/logout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to logout");
    },
    onSuccess: () => {
      queryClient.clear(); // ← clears customer-me and other cached data
      window.location.href = "/";
    },
    onError: () => {
      toast.error("Failed to logout. Try again.");
    },
  });
};
