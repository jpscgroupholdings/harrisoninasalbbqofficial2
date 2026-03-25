// types/branch.ts

export type OperatingHours = {
  open: string;
  close: string;
};

export type Branch = {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactNumber?: string;
  operatingHours: OperatingHours;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BranchFormData = {
  name: string;
  address: string;
  contactNumber?: string;
  open: string;
  close: string;
};

export type BranchFormErrors = Partial<Record<keyof BranchFormData, string>>;