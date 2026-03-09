// hooks/useBranch.ts
import { apiClient } from "@/lib/apiClient";
import { Branch, BranchFormData } from "@/types/branch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// fetch branch
export const useBranches = () => {
  return useQuery<Branch[], Error>({
    queryKey: ["branches"],
    queryFn: () => apiClient.get("/branch")
  });
};

// Create branch
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, { error: string }, BranchFormData>({
    mutationFn: (data) => apiClient.post("/branch", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully!");
    },
    onError: (error) => {
      toast.error(error?.error ?? "Something went wrong.");
    },
  });
};

// Update branch
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, {error: string}, {id: string, branchData: BranchFormData}>({
    mutationFn: ({id, branchData}) => apiClient.put(`/branch/${id}`, branchData),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["branches"]});
      toast.success("Branch Updated successfully!")
    },
    onError: (error) => {
      toast.error(error.error || "Failed to update branch")
    }
    
  })
}

// ---- toggle branch status ----
export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, Error, string>({
    mutationFn: (id) => apiClient.patch(`/branch/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update branch status.");
    },
  });
};
