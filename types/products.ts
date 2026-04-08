import { Category, SubCategory } from "./category";

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