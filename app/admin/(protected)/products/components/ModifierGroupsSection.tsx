"use client";

import React, { useEffect, useState } from "react";
import { InputField, ToggleButton } from "@/components/ui/FormComponents";
import { toast } from "sonner";
import {
  ModifierGroupUI,
  ModifierItemUI,
  ModifierGroupTemplate,
  Product,
} from "@/types/products";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { AppImage } from "@/components/AppImage";
import ProductSelectionModal from "../ProductSelectionModal";
import ModifierTemplateSelector from "./ModifierTemplateSelector";
import ComboPricePreview from "./ComboPricePreview";
import { ProductSectionCard } from "./ProductSectionCard";
import { apiClient } from "@/lib/apiClient";
import { IconButton } from "@/components/ui/buttons";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModifierGroupsState {
  modifierGroups: ModifierGroupUI[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModifierGroupsSectionProps {
  /** Base product price — used by ComboPricePreview */
  price: string;
  /** Pre-populated groups when editing an existing product */
  initialModifierGroups?: ModifierGroupUI[];
  /** Callback fired whenever the modifier groups state changes */
  onModifierGroupsChange: (groups: ModifierGroupUI[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Self-contained section for managing modifier groups on combo/set products.
 * Handles its own state for groups, product selection modal, and product fetching.
 * Supports applying reusable modifier group templates with local overrides.
 * Reports group changes back to parent via `onModifierGroupsChange`.
 */
const ModifierGroupsSection = ({
  price,
  initialModifierGroups = [],
  onModifierGroupsChange,
}: ModifierGroupsSectionProps) => {
  // ── Modifier groups internal state ──────────────────────────────────────────

  const [modifierGroups, setModifierGroups] = useState<ModifierGroupUI[]>(
    initialModifierGroups,
  );

  // ── Drag-and-drop state (group-level) ───────────────────────────────────────

  const [dragGroupIndex, setDragGroupIndex] = useState<number | null>(null);
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState<number | null>(null);

  // ── Drag-and-drop state (item-level, scoped within a single group) ──────────

  const [dragItemKey, setDragItemKey] = useState<string | null>(null); // "groupIdx-itemIdx"
  const [dragOverItemKey, setDragOverItemKey] = useState<string | null>(null);

  // ── Product selection modal state ───────────────────────────────────────────

  const [showProductSelectionModal, setShowProductSelectionModal] =
    useState(false);
  const [activeSelectionGroupIndex, setActiveSelectionGroupIndex] = useState<
    number | null
  >(null);

  // ── Template selector modal state ───────────────────────────────────────────

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<ModifierGroupTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ── Report state changes to parent ──────────────────────────────────────────

  useEffect(() => {
    onModifierGroupsChange(modifierGroups);
  }, [modifierGroups, onModifierGroupsChange]);

  /** Fetch all modifier group templates for the template selector */
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/modifier-group-templates`);
      const data = await res.json();
      setTemplates(data?.data ?? []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
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
        .map((p, idx) => ({
          product: p._id,
          label: null,
          price: p.price ?? null,
          snapshotName: p.name,
          position: existingItems.length + idx + 1,
          _name: p.name,
          _price: p.price ?? null,
          _imageUrl: p.image?.url ?? null,
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
        templateId: null,
        name: "",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        position: prev.length + 1,
        items: [],
      },
    ]);
    setActiveSelectionGroupIndex(newGroupIndex);
    setShowProductSelectionModal(true);
  };

  /** Apply a modifier group template — copies template data into the product with templateId reference */
  const applyTemplate = (template: ModifierGroupTemplate) => {
    const templateItems: ModifierItemUI[] = template.items.map((item, idx) => {
      // The template API already populates product objects with name, price, image
      const populatedProduct =
        typeof item.product === "object" ? item.product : null;

      return {
        product:
          typeof item.product === "string"
            ? item.product
            : (item.product?._id ?? ""),
        label: item.label ?? null,
        price: item.price ?? populatedProduct?.price ?? null,
        snapshotName: item.snapshotName ?? populatedProduct?.name ?? null,
        position: idx + 1,
        _name:
          populatedProduct?.name ||
          item.snapshotName ||
          item.label ||
          "Unknown",
        _price: populatedProduct?.price ?? item.snapshotPrice ?? null,
        _imageUrl: populatedProduct?.image?.url ?? null,
      };
    });

    setModifierGroups((prev) => [
      ...prev,
      {
        _id: undefined,
        templateId: template._id,
        name: template.name,
        required: template.required,
        minSelect: template.minSelect,
        maxSelect: template.maxSelect,
        position: prev.length + 1,
        items: templateItems,
      },
    ]);

    setShowTemplateSelector(false);
    toast.success(`Applied "${template.name}" template`);
  };

  /** Open the template selector modal */
  const openTemplateSelector = () => {
    fetchTemplates();
    setShowTemplateSelector(true);
  };

  /** Sync a modifier group from its linked template — re-fetches and re-applies template data */
  const syncFromTemplate = async (groupIndex: number) => {
    const group = modifierGroups[groupIndex];
    if (!group.templateId) return;

    try {
      const response = await apiClient.get<{ data: ModifierGroupTemplate }>(
        `/modifier-group-templates/${group.templateId}`,
      );

      const template: ModifierGroupTemplate = response?.data;

      if (!template) {
        toast.error("Template no longer exists. Detaching reference.");
        detachTemplate(groupIndex);
        return;
      }

      const syncedItems: ModifierItemUI[] = template.items.map((item, idx) => {
        // The template API already populates product objects with name, price, image
        const populatedProduct =
          typeof item.product === "object" ? item.product : null;

        return {
          product:
            typeof item.product === "string"
              ? item.product
              : (item.product?._id ?? ""),
          label: item.label ?? null,
          price: item.price ?? populatedProduct?.price ?? null,
          snapshotName: item.snapshotName ?? populatedProduct?.name ?? null,
          position: idx + 1,
          _name:
            populatedProduct?.name ||
            item.snapshotName ||
            item.label ||
            "Unknown",
          _price: populatedProduct?.price ?? item.snapshotPrice ?? null,
          _imageUrl: populatedProduct?.image?.url ?? null,
        };
      });

      setModifierGroups((prev) => {
        const groups = [...prev];
        groups[groupIndex] = {
          ...groups[groupIndex],
          name: template.name,
          required: template.required,
          minSelect: template.minSelect,
          maxSelect: template.maxSelect,
          items: syncedItems,
        };
        return groups;
      });

      toast.success(`Synced "${template.name}" from template`);
    } catch (error: any) {
      toast.error(error.message);
      toast.error("Failed to sync from template");
    }
  };

  /** Detach a modifier group from its template — removes templateId, keeps embedded data */
  const detachTemplate = (groupIndex: number) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      groups[groupIndex] = {
        ...groups[groupIndex],
        templateId: null,
      };
      return groups;
    });
    toast.success("Detached from template — group is now standalone");
  };

  /** Remove a modifier group by index and recalculate positions */
  const removeModifierGroup = (groupIndex: number) => {
    setModifierGroups((prev) =>
      prev.filter((_, i) => i !== groupIndex).map((g, i) => ({ ...g, position: i + 1 })),
    );
  };

  /** Reorder modifier groups via drag-and-drop */
  const handleGroupDrop = (targetGroupIndex: number) => {
    if (dragGroupIndex === null || dragGroupIndex === targetGroupIndex) return;
    setModifierGroups((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(dragGroupIndex, 1);
      reordered.splice(targetGroupIndex, 0, moved);
      return reordered.map((g, i) => ({ ...g, position: i + 1 }));
    });
    setDragGroupIndex(null);
    setDragOverGroupIndex(null);
  };

  /** Reorder items within a group via drag-and-drop */
  const handleItemDrop = (groupIndex: number, targetItemIndex: number) => {
    const key = `${groupIndex}-${targetItemIndex}`;
    if (!dragItemKey || dragItemKey === key) return;
    const [fromGroupIdx, fromItemIdx] = dragItemKey.split("-").map(Number);
    // Only reorder within the same group
    if (fromGroupIdx !== groupIndex) return;
    setModifierGroups((prev) => {
      const groups = [...prev];
      const items = [...groups[groupIndex].items];
      const [moved] = items.splice(fromItemIdx, 1);
      items.splice(targetItemIndex, 0, moved);
      groups[groupIndex] = {
        ...groups[groupIndex],
        items: items.map((item, i) => ({ ...item, position: i + 1 })),
      };
      return groups;
    });
    setDragItemKey(null);
    setDragOverItemKey(null);
  };

  /** Update a group-level field (name, required, minSelect, maxSelect) */
  const updateModifierGroup = (
    groupIndex: number,
    field: keyof ModifierGroupUI,
    value: string | boolean | number | null,
  ) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      groups[groupIndex] = { ...groups[groupIndex], [field]: value };
      return groups;
    });
  };

  /** Remove an item from a specific group and recalculate positions */
  const removeItemFromGroup = (groupIndex: number, itemIndex: number) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      groups[groupIndex] = {
        ...groups[groupIndex],
        items: groups[groupIndex].items
          .filter((_, i) => i !== itemIndex)
          .map((item, i) => ({ ...item, position: i + 1 })),
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
          No groups yet. Add a group or apply a template so customers can choose
          their items.
        </p>
      )}

      {/* Group list */}
      {modifierGroups.map((group, groupIndex) => (
        <div
          key={group._id ?? groupIndex}
          draggable
          onDragStart={(e) => {
            setDragGroupIndex(groupIndex);
            setDragOverGroupIndex(null);
          }}
          onDragOver={(e) => {
            // Only respond to group-level drag (not item drag)
            if (dragGroupIndex !== null) {
              e.preventDefault();
              setDragOverGroupIndex(groupIndex);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            // Only handle group-level drops
            if (dragGroupIndex !== null) {
              handleGroupDrop(groupIndex);
            }
          }}
          className={`transition-all duration-150 select-none
            ${dragGroupIndex === groupIndex ? "opacity-40" : ""}
            ${dragOverGroupIndex === groupIndex ? "ring-2 ring-brand-color-500" : ""}`}
        >
        <ProductSectionCard
          title={modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`}
          iconName="Utensils"
          className="space-y-3"
        >
          {/* Drag handle + group header */}
          <div className="flex items-center gap-2">
            <DynamicIcon
              name="GripVertical"
              className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
              size={18}
            />
            <span className="text-xs font-mono text-gray-500 shrink-0">
              {group.position ?? groupIndex + 1}
            </span>
          </div>

          {/* Template reference badge + group header */}
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
            {/* Template actions */}
            {group.templateId && (
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  type="button"
                  onClick={() => syncFromTemplate(groupIndex)}
                  icon={{ name: "RefreshCw", size: 15 }}
                  className="p-4 rounded-lg"
                  title="Sync from template (re-apply latest template data)"
                />
                <IconButton
                  type="button"
                  onClick={() => detachTemplate(groupIndex)}
                  variant="secondary"
                  icon={{ name: "Unlink2" }}
                  className="p-4 rounded-lg"
                  title="Detach from template (keep data as standalone)"
                />
                <IconButton
                  type="button"
                  variant="danger"
                  onClick={() => removeModifierGroup(groupIndex)}
                  icon={{ name: "Trash2", size: 15 }}
                  title="Delete this group"
                  className="p-4 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Template badge */}
          {group.templateId && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <DynamicIcon name="Layers" size={14} className="text-blue-500" />
              <span className="text-blue-600 font-semibold">From template</span>
              <span className="text-blue-400">
                — edits are local overrides, won't change the template
              </span>
            </div>
          )}

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
          <IconButton
            onClick={() => openProductSelection(groupIndex)}
            variant="underline"
            text={`Select Products for ${modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`}`}
            title="Choose which products customers can upgrade to"
            className="text-lg"
          />

          {/* Items in this group */}
          {group.items.length > 0 && (
            <div className="space-y-2">
              {group.items.map((item, itemIndex) => {
                const upgradePrice = item.price ?? item._price ?? 0;
                const soloPrice = item._price ?? 0;
                const isDiscountedUpgrade =
                  upgradePrice < soloPrice && soloPrice > 0;
                const itemKey = `${groupIndex}-${itemIndex}`;
                const isDraggingItem = dragItemKey === itemKey;
                const isDragOverItem = dragOverItemKey === itemKey;

                return (
                  <div
                    key={itemIndex}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation(); // prevent group-level drag
                      setDragItemKey(itemKey);
                      setDragOverItemKey(null);
                    }}
                    onDragOver={(e) => {
                      // Only respond to item-level drag within same group
                      if (dragItemKey !== null && dragItemKey.startsWith(`${groupIndex}-`)) {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverItemKey(itemKey);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // prevent group-level drop
                      if (dragItemKey !== null && dragItemKey.startsWith(`${groupIndex}-`)) {
                        handleItemDrop(groupIndex, itemIndex);
                      }
                    }}
                    className={`flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg relative transition-all duration-150 select-none
                      ${isDraggingItem ? "opacity-40" : ""}
                      ${isDragOverItem ? "border-t-2 border-t-brand-color-500" : ""}`}
                  >
                    {/* Drag handle */}
                    <div className="flex flex-col items-center justify-center shrink-0 gap-1">
                      <DynamicIcon
                        name="GripVertical"
                        className="text-gray-400 cursor-grab active:cursor-grabbing"
                        size={16}
                      />
                    </div>
                    <IconButton
                      type="button"
                      onClick={() => removeItemFromGroup(groupIndex, itemIndex)}
                      title="Delete this product"
                      icon={{ name: "Trash2" }}
                      className="absolute right-2 top-2 rounded-full opacity-80"
                      variant="danger"
                    />
                    {/* Image — left, full height */}
                    <div className="flex flex-col items-center justify-center bg-gray-100 p-3 gap-2 flex-1 max-w-52">
                      <div className="w-11 h-11 rounded-md shrink-0 border border-gray-200 overflow-hidden">
                        <AppImage src={item._imageUrl ?? ""} alt={item._name} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item._name || item.product}
                      </p>
                    </div>

                    {/* Right column — everything else, compact */}
                    <div className="flex-1 min-w-0 gap-4 flex flex-col">
                      {/* Price info */}
                      <div>
                        {soloPrice > 0 && (
                          <span className="text-xs text-gray-400 shrink-0">
                            Solo:{" "}
                            <span className="line-through">₱{soloPrice}</span>
                          </span>
                        )}
                        {isDiscountedUpgrade && (
                          <span className="text-xs text-green-600 font-semibold shrink-0">
                            ↓ saves ₱{(soloPrice - upgradePrice).toFixed(0)}
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
        </div>
      ))}

      {/* Reorder hint */}
      {modifierGroups.length > 1 && (
        <p className="text-xs text-gray-500 text-center">
          Drag ⠿ to reorder groups and items
        </p>
      )}

      {/* Add group buttons */}
      <div className="flex items-center gap-2">
        <IconButton
          type="button"
          onClick={addModifierGroup}
          variant="primary"
          icon={{ name: "Plus", position: "right" }}
          text="Add Group"
          title="Create a new group manually (e.g Grilled, Drinks, Appetizer)"
          className="px-4 rounded-lg"
        />
        <IconButton
          type="button"
          onClick={openTemplateSelector}
          variant="secondary"
          icon={{ name: "Layers", position: "right" }}
          text="Apply Template"
          title="Apply a reusable modifier group template"
          className="px-4 rounded-lg"
        />
      </div>

      {/* Product selection modal */}
      {showProductSelectionModal && activeSelectionGroupIndex !== null && (
        <ProductSelectionModal
          onClose={() => {
            setShowProductSelectionModal(false);
            setActiveSelectionGroupIndex(null);
          }}
          onConfirm={handleProductSelectionConfirm}
          alreadySelectedIds={
            modifierGroups[activeSelectionGroupIndex]?.items.map(
              (i) => i.product,
            ) ?? []
          }
        />
      )}

      {/* Template selector modal */}
      {showTemplateSelector && (
        <ModifierTemplateSelector
          onClose={() => setShowTemplateSelector(false)}
          onSelect={applyTemplate}
          templates={templates}
          loading={loadingTemplates}
        />
      )}
    </ProductSectionCard>
  );
};

export default ModifierGroupsSection;
