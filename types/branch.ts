// types/branch.ts

export type OperatingHours = {
  open: string;
  close: string;
};

export type Location = {
  type: "Point";
  coordinates: [number, number] // [longitude, latitude] - GeoJSON format
}

export type Branch = {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactNumber?: string;
  operatingHours: OperatingHours;
  location: Location,
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
  location?: {
    latitude: string;
    longitude: string
  }
};

export type BranchFormErrors = Partial<Record<keyof BranchFormData | "location", string>>;