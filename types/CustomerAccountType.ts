export type Customer = {
  _id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  isActive: boolean;
  banned?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  image: string;
};

export type CustomerCreateInput = {
  firsName: string;
  lastName: string;
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
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalCustomers: number;
    newCustomers: number;
    vipCustomers: number;
  };
};

/** Sorting options for the customer list */
export type CustomerSortBy = "newest" | "oldest" | "highest_spent" | "most_orders" | "name_asc" | "name_desc";

/** Filter tabs for the customer list */
export type CustomerFilter = "all" | "active" | "banned" | "new" | "vip";