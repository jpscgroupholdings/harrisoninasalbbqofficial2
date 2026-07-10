// ─── Constants ────────────────────────────────────────────────────────────────

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ITEM_TYPES, ProductType } from "@/types/products";

export const PRODUCT_TYPE_OPTIONS: {
  value: ProductType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: ITEM_TYPES.SOLO,
    label: "Solo",
    description: "Single ala-carte item",
    icon: <DynamicIcon name="Utensils" size={16} />,
  },
  {
    value: ITEM_TYPES.COMBO,
    label: "Combo",
    description: "Bundled meal with drink",
    icon: <DynamicIcon name="Package" size={16} />,
  },
  {
    value: "set",
    label: "Set",
    description: "Group / sharing platter",
    icon: <DynamicIcon name="Star" size={16} />,
  },
];