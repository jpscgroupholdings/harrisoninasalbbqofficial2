export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'cash' | 'card' | 'gcash' | 'paymaya';
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productType: "solo" | "combo" | "set";

  quantity: number;
  price: number;

  // snapshot at time of purchase
  includedItems?: {
    name: string;
    quantity: number;
    label: string | null;
  }[];
}

export interface IncludedItem {
  product: string | Product;  // string when sending, populated Product when receiving
  quantity: number;
  label: string | null;
}

// UI-only type — lives inside the modal, never sent to API
export interface IncludedItemUI {
  product: string;       // always ObjectId string in the form
  quantity: number;
  label: string | null;
  _name: string;         // display only
  _price: number | null; // display only
}

export interface Product {
  _id: string;
  name: string;
  info: string;
  description: string;
  category: Category;
  subcategory?: SubCategory | null;
  price: number | null;
  image: {
    url: string;
    public_id?: string;
  };
  productType: "solo" | "combo" | "set";
  includedItems: IncludedItem[];
  paxCount?: number | null;
  isPopular?: boolean;
  isSignature?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductPayload {
  name: string;
  price: number | null;
  category: string;                  // ObjectId
  subcategory?: string | null;       // ObjectId

  info?: string;
  description?: string;
  image?: string;
  imageFile?: string;
  isSignature?: boolean;
  isPopular?: boolean;
  productType: "solo" | "combo" | "set";
  paxCount?: number | null;
  includedItems?: {
    product: string;                 // ObjectId — always a string when sending
    quantity: number;
    label: string | null;
  }[];
}

export interface SubCategory {
  _id: string;
  name: string;
  category: string | Category;       // string when stored, populated when fetched
  position: number;
  createdAt?: Date;
}

export interface Category {
  _id: string;
  name: string;
  position: number,
  image: {
    url: string,
    public_id: string
  }
  createdAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  bestSellingProduct: string;
  bestSellingCount: number
}

export interface SalesData {
  date: string;
  sales: number;
}

export interface TopProduct {
  name: string;
  sales: number;
}

export interface Settings {
  storeName: string;
  address: string;
  contactNumber: string;
  businessHours: {
    open: string;
    close: string;
  };
  taxRate: number;
  serviceCharge: number;
}