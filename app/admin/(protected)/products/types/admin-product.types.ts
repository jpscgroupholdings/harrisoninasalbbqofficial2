// ─── Types ────────────────────────────────────────────────────────────────────

import { Product, ProductType } from "@/types/products";
import { Category } from "@/types/category";



export interface ProductSearchResponse {
  data: Product[];
}

/** State reported by CategorySection back to parent for form submission & other consumers */
export interface CategorySelectionState {
  categoryId: string;
  subcategoryId: string;
  showCustomCategory: boolean;
  customCategory: string;
  showCustomSubcategory: boolean;
  customSubcategory: string;
  categories: Category[];
}

export interface ProductFormData {
  name: string;
  price: string;
  info: string;
  description: string;
  isSignature: boolean;
  isPopular: boolean;
  productType: ProductType;
  paxCount: string;
}

export interface ProductFormPageProps {
  editProduct?: Product | null;
}