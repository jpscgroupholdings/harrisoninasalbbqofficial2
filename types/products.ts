import { Category, SubCategory } from "./category";
import type { PromotionDiscountType } from "./promotions/promotion-constant";

export interface ActiveProductDiscountPreview {
  promotionId: string;
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  label: string;
}

export interface ModifierItem {
  product: string | Product; // string when sending, populated Product when receiving
  label: string | null;
  price?: number | null; // override price for this item in the combo context
  snapshotName?: string | null;
  snapshotPrice?: number | null;
  position?: number;
}

// UI-only type — lives inside the admin form, never sent to API
export interface ModifierItemUI {
  product: string; // always ObjectId string in the form
  label: string | null;
  price: number | null; // override price (defaults to solo price, admin can edit)
  snapshotName?: string | null;
  snapshotPrice?: number | null;
  position?: number;
  _name: string; // display only
  _price: number | null; // original solo price — display only
  _imageUrl?: string | null; // product image URL — display only
}

export interface ModifierGroup {
  _id?: string;
  templateId?: string | null;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  position?: number;
  items: ModifierItem[];
}

// UI-only type — lives inside the admin form, never sent to API
export interface ModifierGroupUI {
  _id?: string;
  templateId?: string | null;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  position?: number;
  items: ModifierItemUI[];
}

// ─── Modifier Group Template (reusable) ──────────────────────────────────────

export interface ModifierGroupTemplateItem {
  product: string | Product; // string when sending, populated Product when receiving from API
  label: string | null;
  price: number | null;
  snapshotName?: string | null;
  snapshotPrice?: number | null;
  position?: number;
}

export interface ModifierGroupTemplate {
  _id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  items: ModifierGroupTemplateItem[];
  /** Number of products that reference this template via modifierGroups.templateId */
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModifierGroupTemplatePayload {
  name: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  items: ModifierGroupTemplateItem[];
}

export const ITEM_TYPES = {
  SOLO: "solo",
  COMBO: "combo",
  SET: "set",
};

export type ProductType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES];

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
  productType: ProductType;
  modifierGroups: ModifierGroup[];
  paxCount?: number | null;
  isPopular?: boolean;
  isSignature?: boolean;
  activeProductDiscount?: ActiveProductDiscountPreview | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductPayload {
  name: string;
  price: number | null;
  category: string; // ObjectId
  subcategory?: string | null; // ObjectId

  info?: string;
  description?: string;
  image?: string;
  imageFile?: string;
  isSignature?: boolean;
  isPopular?: boolean;
  productType: ProductType;
  paxCount?: number | null;
  modifierGroups?: ModifierGroup[];
}
