// hooks/useBranch.ts
import { Branch, BranchFormData } from "@/types/branch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ---- fetch all branches ----
const fetchBranches = async (): Promise<Branch[]> => {
  const res = await fetch("/api/branch");
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const useBranches = () => {
  return useQuery<Branch[], Error>({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });
};

// ---- create branch ----
const createBranch = async (branchData: BranchFormData): Promise<Branch> => {
  const res = await fetch("/api/branch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(branchData),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, { error: string }, BranchFormData>({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully!");
    },
    onError: (error) => {
      toast.error(error?.error ?? "Something went wrong.");
    },
  });
};

const updateBranch = async ({
  id,
  branchData,
}: {
  id: string;
  branchData: BranchFormData;
}): Promise<Branch> => {
  const response = await fetch(`/api/branch/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "applicaiton/json",
    },
    body: JSON.stringify(branchData),
  });

  const data = await response.json();

  if (!response.ok) throw data;
  return data;
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, {error: string}, {id: string, branchData: BranchFormData}>({
    mutationFn: updateBranch,
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
const toggleBranchStatus = async (id: string): Promise<Branch> => {
  const res = await fetch(`/api/branch/${id}`, { method: "PATCH" });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to update branch status.");
  }

  return data;
};

export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, Error, string>({
    mutationFn: toggleBranchStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update branch status.");
    },
  });
};
