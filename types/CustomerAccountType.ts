export type Customer = {
  _id?: string;
  fullname: string;
  phone?: string;
  email: string;
  password: string;
  isActive: boolean;
  createdAt?: string;
};

export type CustomerCreateInput = {
  fullname: string;
  phone?: string;
  email: string;
  password: string;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export type CustomerResponse = Omit<Customer, "password"> & {
  totalSpent: number;
  totalOrders: number;
};

export type CustomersListResponse = {
  data: CustomerResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};