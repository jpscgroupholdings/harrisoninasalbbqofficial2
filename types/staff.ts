export const STAFF_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  CASHIER: "cashier",
} as const;

export const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Admin",
  cashier: "Cashier",
} as const;

export type StaffRole = (typeof STAFF_ROLES)[keyof typeof STAFF_ROLES];

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

  image?: {
    url: string;
    public_id?: string;
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
