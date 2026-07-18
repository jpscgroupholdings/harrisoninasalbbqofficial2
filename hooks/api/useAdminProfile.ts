import { apiClient, ApiError } from "@/lib/apiClient";
import { CloudinaryImage } from "@/lib/cloudinaryUpload";
import { Staff } from "@/types/staff";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UpdateProfileData = {
  firstName: string;
  lastName: string;
  phone?: string;
  image?: CloudinaryImage;
};

type UploadAvatarData = {
  imageFile: string;
  oldPublicId?: string;
};

/** Update the authenticated admin's own profile details */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<Staff, ApiError, UpdateProfileData>({
    mutationFn: (data) => apiClient.put("/staff/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message ?? "Failed to update profile.");
    },
  });
};

/** Upload an avatar image to Cloudinary for the admin profile */
export const useUploadAdminAvatar = () => {
  return useMutation<CloudinaryImage, ApiError, UploadAvatarData>({
    mutationFn: (data) => apiClient.post("/staff/upload-avatar", data),
    onError: (error) => {
      toast.error(error?.message ?? "Failed to upload avatar.");
    },
  });
};

/** Change the authenticated admin's password */
export const useChangeAdminPassword = () => {
  return useMutation<{ message: string }, ApiError, { newPassword: string }>({
    mutationFn: (data) => apiClient.post("/auth/admin/change-password", data),
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error) => {
      toast.error(error?.message ?? "Failed to change password.");
    },
  });
};
