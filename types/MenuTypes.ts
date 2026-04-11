// types.ts - TypeScript interfaces for Harrison House Menu

import { Category } from "./category";

/**
 * Base menu item interface
 */
export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: {
    _id: string,
    name: string
  };
  note?: string;
  isBestSeller?: boolean;
  image: string;
}

/**
 * Cart item extends MenuItem with quantity
 */
export interface CartItem extends MenuItem {
  quantity: number;
}



/**
 * Menu data structure - maps category IDs to their menu items
 */
export interface MenuData {
  [categoryId: string]: MenuItem[];
}

/**
 * Props for MenuItemCard component
 */
export interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (itemId: number) => void;
}

/**
 * Props for CartItem component
 */
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, change: number) => void;
  onRemove: (itemId: number) => void;
}

/**
 * Props for MenuSection component (if needed)
 */
export interface MenuSectionProps {
  category: Category;
  items: MenuItem[];
  onAddToCart: (itemId: number) => void;
}

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}