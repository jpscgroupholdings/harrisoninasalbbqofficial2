// ─── types/staff.ts ───────────────────────────────────────────────────────────

export type StaffRole = "branch_manager" | "stock_manager" | "cashier";

export const ROLE_LABELS: Record<StaffRole, string> = {
  branch_manager: "Branch Manager",
  stock_manager: "Stock Manager",
  cashier: "Cashier",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  branch_manager: "bg-purple-100 text-purple-700",
  stock_manager: "bg-blue-100 text-blue-700",
  cashier: "bg-amber-100 text-amber-700",
};

export type Staff = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  branch: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  createdAt?: string;
};

export type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: StaffRole | "";
  branch: string;
};

export type StaffFormErrors = Partial<Record<keyof StaffFormData, string>>;


// ─── hooks/api/useStaff.ts ────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// fetch all staff
const fetchStaff = async (): Promise<Staff[]> => {
  const res = await fetch("/api/staff");
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const useStaff = () =>
  useQuery<Staff[], Error>({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });

// create staff
const createStaff = async (staffData: StaffFormData): Promise<Staff> => {
  const res = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation<Staff, { error: string }, StaffFormData>({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff created successfully!");
    },
    onError: (error) => {
      toast.error(error?.error ?? "Something went wrong.");
    },
  });
};

// update staff
const updateStaff = async ({
  id,
  staffData,
}: {
  id: string;
  staffData: Partial<StaffFormData>;
}): Promise<Staff> => {
  const res = await fetch(`/api/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Staff,
    { error: string },
    { id: string; staffData: Partial<StaffFormData> }
  >({
    mutationFn: updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.error ?? "Something went wrong.");
    },
  });
};

// toggle staff status
const toggleStaffStatus = async (id: string): Promise<Staff> => {
  const res = await fetch(`/api/staff/${id}`, { method: "PATCH" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update status.");
  return data;
};

export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Staff, Error, string>({
    mutationFn: toggleStaffStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status.");
    },
  });
};