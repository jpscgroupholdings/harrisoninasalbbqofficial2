import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useLogout = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      router.push("/auth/login");
    },
    onError: () => {
      toast.error("Failed to logout. Try again.");
    },
  });
};
