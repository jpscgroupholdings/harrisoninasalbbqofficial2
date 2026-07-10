"use client";

import React, { useEffect, useState } from "react";
import {
  InputField,
  ToggleButton,
} from "@/components/ui/FormComponents";
import { toast } from "sonner";
import {
  ModifierGroupUI,
  ModifierItemUI,
  Product,
} from "@/types/products";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { AppImage } from "@/components/AppImage";
import ProductSelectionModal from "../ProductSelectionModal";
import ComboPricePreview from "./ComboPricePreview";
import { ProductSectionCard } from "./ProductSectionCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModifierGroupsState {
  modifierGroups: ModifierGroupUI[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModifierGroupsSectionProps {
  /** Base product price — used by ComboPricePreview */
  price: string;
  /** Categories for ProductSelectionModal grouping */
  categories: { _id: string; name: string }[];
  /** Pre-populated groups when editing an existing product */
  initialModifierGroups?: ModifierGroupUI[];
  /** Callback fired whenever the modifier groups state changes */
  onModifierGroupsChange: (groups: ModifierGroupUI[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Self-contained section for managing modifier groups on combo/set products.
 * Handles its own state for groups, product selection modal, and product fetching.
 * Reports group changes back to parent via `onModifierGroupsChange`.
 */
const ModifierGroupsSection = ({
  price,
  categories,
  initialModifierGroups = [],
  onModifierGroupsChange,
}: ModifierGroupsSectionProps) => {
  // ── Modifier groups internal state ──────────────────────────────────────────

  const [modifierGroups, setModifierGroups] = useState<ModifierGroupUI[]>(
    initialModifierGroups,
  );

  // ── Product selection modal state ───────────────────────────────────────────

  const [showProductSelectionModal, setShowProductSelectionModal] =
    useState(false);
  const [activeSelectionGroupIndex, setActiveSelectionGroupIndex] = useState<
    number | null
  >(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ── Report state changes to parent ──────────────────────────────────────────

  useEffect(() => {
    onModifierGroupsChange(modifierGroups);
  }, [modifierGroups, onModifierGroupsChange]);

  // ── Fetch all products on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (allProducts.length === 0) {
      fetchAllProducts();
    }
  }, []);

  /** Fetch all solo products for the product selection modal */
  const fetchAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products`);
      const data = await res.json();
      setAllProducts(
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
      );
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // ── Modifier group handlers ─────────────────────────────────────────────────

  /** Open product selection modal for a specific modifier group */
  const openProductSelection = (groupIndex: number) => {
    setActiveSelectionGroupIndex(groupIndex);
    setShowProductSelectionModal(true);
  };

  /** Handle products selected from ProductSelectionModal — add new ones to the group */
  const handleProductSelectionConfirm = (selectedProducts: Product[]) => {
    const groupIndex = activeSelectionGroupIndex;
    if (groupIndex === null) return;

    setModifierGroups((prev) => {
      const groups = [...prev];
      const existingItems = groups[groupIndex].items;

      // Only add products that aren't already in this group
      const newItems: ModifierItemUI[] = selectedProducts
        .filter((p) => !existingItems.some((i) => i.product === p._id))
        .map((p) => ({
          product: p._id,
          quantity: 1,
          label: null,
          price: p.price ?? null,
          snapshotName: p.name,
          _name: p.name,
          _price: p.price ?? null,
        }));

      groups[groupIndex] = {
        ...groups[groupIndex],
        items: [...existingItems, ...newItems],
      };

      return groups;
    });

    setShowProductSelectionModal(false);
    setActiveSelectionGroupIndex(null);
  };

  /** Add a new modifier group (opens product selection modal immediately) */
  const addModifierGroup = () => {
    const newGroupIndex = modifierGroups.length;
    setModifierGroups((prev) => [
      ...prev,
      {
        _id: undefined,
        name: "",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        items: [],
      },
    ]);
    setActiveSelectionGroupIndex(newGroupIndex);
    setShowProductSelectionModal(true);
  };

  /** Remove a modifier group by index */
  const removeModifierGroup = (groupIndex: number) => {
    setModifierGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  };

  /** Update a group-level field (name, required, minSelect, maxSelect) */
  const updateModifierGroup = (
    groupIndex: number,
    field: keyof ModifierGroupUI,
    value: string | boolean | number,
  ) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      groups[groupIndex] = { ...groups[groupIndex], [field]: value };
      return groups;
    });
  };

  /** Remove an item from a specific group */
  const removeItemFromGroup = (groupIndex: number, itemIndex: number) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      groups[groupIndex] = {
        ...groups[groupIndex],
        items: groups[groupIndex].items.filter((_, i) => i !== itemIndex),
      };
      return groups;
    });
  };

  /** Update an item-level field within a specific group */
  const updateItemInGroup = (
    groupIndex: number,
    itemIndex: number,
    field: keyof ModifierItemUI,
    value: string | number | null,
  ) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      const items = [...groups[groupIndex].items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      groups[groupIndex] = { ...groups[groupIndex], items };
      return groups;
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProductSectionCard title="Modifier Groups" iconName="ListChecks">
      {/* Price preview calculator */}
      {modifierGroups.length > 0 && price && (
        <ComboPricePreview price={price} modifierGroups={modifierGroups} />
      )}

      {/* Empty state */}
      {modifierGroups.length === 0 && (
        <p className="text-xs text-gray-400">
          No groups yet. Add a group so customers can choose their items.
        </p>
      )}

      {/* Group list */}
      {modifierGroups.map((group, groupIndex) => (
        <ProductSectionCard
          key={group._id ?? groupIndex}
          title={
            modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`
          }
          iconName="Utensils"
          className="space-y-3"
        >
          {/* Group header — name + delete */}
          <div className="flex items-stretch gap-3">
            <InputField
              type="text"
              placeholder="Group name (e.g., Grilled, Drinks)"
              value={group.name}
              onChange={(e) =>
                updateModifierGroup(groupIndex, "name", e.target.value)
              }
              required
            />
            <button
              type="button"
              onClick={() => removeModifierGroup(groupIndex)}
              className="bg-red-400 text-white hover:bg-red-500 transition p-4 rounded-lg cursor-pointer"
              data-tooltip-id="app-tooltip"
              data-tooltip-content={"Delete this group"}
            >
              <DynamicIcon name="Trash2" size={15} />
            </button>
          </div>

          {/* Group settings row */}
          <div className="grid grid-cols-[2fr_5fr_5fr] gap-3">
            <div className="self-center">
              <ToggleButton
                label="Required"
                checked={group.required}
                onCheckedChange={(value) =>
                  updateModifierGroup(groupIndex, "required", value)
                }
              />
            </div>
            {/* Min select */}
            <InputField
              type="number"
              placeholder="Min"
              label="Minimum to add"
              min={1}
              max={group.items.length || 1}
              value={group.minSelect}
              onChange={(e) =>
                updateModifierGroup(
                  groupIndex,
                  "minSelect",
                  parseInt(e.target.value) || 1,
                )
              }
            />
            {/* Max select */}
            <InputField
              label="Maximum to add"
              type="number"
              min={group.minSelect}
              max={group.items.length || 1}
              value={group.maxSelect}
              onChange={(e) =>
                updateModifierGroup(
                  groupIndex,
                  "maxSelect",
                  parseInt(e.target.value) || 1,
                )
              }
            />
          </div>

          {/* Select products button */}
          <button
            type="button"
            onClick={() => openProductSelection(groupIndex)}
            disabled={loadingProducts}
            className="flex items-center gap-2 underline text-brand-color-500 hover:text-brand-color-600 hover:gap-4 transition-transform cursor-pointer"
            data-tooltip-id="app-tooltip"
            data-tooltip-content={
              "Choose which products customers can upgrade to"
            }
          >
            {loadingProducts
              ? "Loading..."
              : `Select Products for ${modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`}`}
          </button>

          {/* Items in this group */}
          {group.items.length > 0 && (
            <div className="space-y-2">
              {group.items.map((item, itemIndex) => {
                const upgradePrice = item.price ?? item._price ?? 0;
                const soloPrice = item._price ?? 0;
                const isDiscountedUpgrade =
                  upgradePrice < soloPrice && soloPrice > 0;

                const matchedProduct = allProducts.find(
                  (p) => p._id === item.product,
                );
                const itemImageUrl = matchedProduct?.image?.url || null;

                return (
                  <div
                    key={itemIndex}
                    className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        removeItemFromGroup(groupIndex, itemIndex)
                      }
                      className="absolute -right-1 -top-1 bg-red-400 text-white p-1 hover:bg-red-500 transition shrink-0 cursor-pointer rounded-full"
                      data-tooltip-id="app-tooltip"
                      data-tooltip-content={"Delete this product"}
                    >
                      <DynamicIcon name="Trash2" size={14} />
                    </button>

                    {/* Image — left, full height */}
                    <div className="flex flex-col items-center justify-center bg-gray-100 p-3 gap-2 flex-1 max-w-52">
                      <div className="w-11 h-11 rounded-md shrink-0 border border-gray-200 overflow-hidden">
                        <AppImage
                          src={itemImageUrl ?? ""}
                          alt={item._name}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item._name || item.product}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          Qty
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateItemInGroup(
                              groupIndex,
                              itemIndex,
                              "quantity",
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateItemInGroup(
                              groupIndex,
                              itemIndex,
                              "quantity",
                              item.quantity + 1,
                            )
                          }
                          className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition"
                        >
                          ＋
                        </button>
                      </div>
                    </div>

                    {/* Right column — everything else, compact */}
                    <div className="flex-1 min-w-0 gap-4 flex flex-col">
                      {/* Price info */}
                      <div>
                        {soloPrice > 0 && (
                          <span className="text-xs text-gray-400 shrink-0">
                            Solo:{" "}
                            <span className="line-through">
                              ₱{soloPrice}
                            </span>
                          </span>
                        )}
                        {isDiscountedUpgrade && (
                          <span className="text-xs text-green-600 font-semibold shrink-0">
                            ↓ saves
                            ₱{(soloPrice - upgradePrice).toFixed(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <InputField
                          label="Label"
                          type="text"
                          placeholder="Display name"
                          value={item.label || ""}
                          onChange={(e) =>
                            updateItemInGroup(
                              groupIndex,
                              itemIndex,
                              "label",
                              e.target.value || null,
                            )
                          }
                        />
                        <InputField
                          label="Upgrade ₱"
                          type="number"
                          min={0}
                          step="1"
                          placeholder={item._price?.toString() ?? "0"}
                          value={item.price ?? ""}
                          onChange={(e) =>
                            updateItemInGroup(
                              groupIndex,
                              itemIndex,
                              "price",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {group.items.length === 0 && (
            <p className="text-xs text-gray-400">
              No items in this group. Click the button above to select products.
            </p>
          )}
        </ProductSectionCard>
      ))}

      {/* Add group button */}
      <button
        type="button"
        onClick={addModifierGroup}
        className="flex items-center gap-2 mx-4 underline text-brand-color-500 hover:text-brand-color-600 hover:gap-4 transition-transform cursor-pointer"
        data-tooltip-id="app-tooltip"
        data-tooltip-content={"e.g Grilled, Drinks, Appetizer"}
      >
        Add Group
        <DynamicIcon name="ChevronRight" />
      </button>

      {/* Product selection modal */}
      {showProductSelectionModal && activeSelectionGroupIndex !== null && (
        <ProductSelectionModal
          onClose={() => {
            setShowProductSelectionModal(false);
            setActiveSelectionGroupIndex(null);
          }}
          onConfirm={handleProductSelectionConfirm}
          allProducts={allProducts}
          categories={categories}
          alreadySelectedIds={
            modifierGroups[activeSelectionGroupIndex]?.items.map(
              (i) => i.product,
            ) ?? []
          }
          loading={loadingProducts}
        />
      )}
    </ProductSectionCard>
  );
};

export default ModifierGroupsSection;
