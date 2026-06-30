import { apiClient, ApiError } from "@/lib/apiClient";
import { Staff, StaffFormData } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// fetch all staff
export const useStaff = () =>
  useQuery<Staff[], Error>({
    queryKey: ["staff"],
    queryFn: () => apiClient.get("/staff"),
  });

// create staff
export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation<Staff, ApiError, StaffFormData>({
    mutationFn: (staffData) => apiClient.post("/staff", staffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message ?? "Something went wrong.");
    },
  });
};

// update staff
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Staff,
    ApiError,
    { id: string; staffData: Partial<StaffFormData> }
  >({
    mutationFn: ({ id, staffData }) => apiClient.put(`/staff/${id}`, staffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message ?? "Something went wrong.");
    },
  });
};

// toggle staff status
export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Staff, ApiError, string>({
    mutationFn: (id) => apiClient.patch(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error) => {
      toast.error(error?.message ?? "Failed to update status.");
    },
  });
};
