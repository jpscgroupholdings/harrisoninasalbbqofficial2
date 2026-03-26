export type StaffRole = "superadmin" | "admin" | "cashier";

export const ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  cashier: "Cashier",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  superadmin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  cashier: "bg-amber-100 text-amber-700",
};

export type Staff = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  branch?: {
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
  branch: string | "";
};

export type StaffFormErrors = Partial<Record<keyof StaffFormData, string>>;