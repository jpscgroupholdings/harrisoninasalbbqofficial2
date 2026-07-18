"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  InputField,
  SelectField,
  ToggleButton,
} from "@/components/ui/FormComponents";
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
import { ProductSectionCard } from "./ProductSectionCard";
import { apiClient } from "@/lib/apiClient";
import { IconButton } from "@/components/ui/buttons";
import {
  ActionItem,
  ExpandableActions,
} from "@/components/ui/buttons/ExpandableActions";
import { useToggleSet } from "@/hooks/useToggleSet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModifierGroupsState {
  modifierGroups: ModifierGroupUI[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModifierGroupsSectionProps {
  /** Pre-populated groups when editing an existing product */
  initialModifierGroups?: ModifierGroupUI[];
  /** Callback fired whenever the modifier groups state changes */
  onModifierGroupsChange: (groups: ModifierGroupUI[]) => void;
  /** External group order from the reorder panel — array of original indices in desired display order */
  groupOrder?: number[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Self-contained section for managing modifier groups on combo/set products.
 * Handles its own state for groups, product selection modal, and product fetching.
 * Supports applying reusable modifier group templates with local overrides.
 * Reports group changes back to parent via `onModifierGroupsChange`.
 */
const ModifierGroupsSection = ({
  initialModifierGroups = [],
  onModifierGroupsChange,
  groupOrder,
}: ModifierGroupsSectionProps) => {
  // Tracks which modifier group rows have their action menu (sync/detach/delete) expanded,
  // keyed by groupIndex — supports multiple rows independently since state is a Set, not a single boolean.
  const { isOpen, toggle, close } = useToggleSet<number>();

  // Tracks which groups have their full item list expanded (show more / show less).
  // Groups with many items are collapsed by default; toggling adds them to this set.
  const { isOpen: isExpanded, toggle: toggleExpanded } = useToggleSet<number>();

  // ── Modifier groups internal state ──────────────────────────────────────────
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupUI[]>(
    initialModifierGroups,
  );

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

  // ── Sync external group order from the reorder panel ─────────────────────────
  // Tracks the last applied order to avoid re-applying the same reorder and causing loops.
  const lastAppliedOrderRef = useRef<string>("");

  // ── Report state changes to parent ──────────────────────────────────────────

  useEffect(() => {
    onModifierGroupsChange(modifierGroups);
    // Reset the applied order tracker when group count changes (add/remove),
    // so the next reorder from the right panel applies cleanly.
    lastAppliedOrderRef.current = "";
  }, [modifierGroups, onModifierGroupsChange]);

  useEffect(() => {
    if (!groupOrder || groupOrder.length === 0) return;

    // Serialize to compare — skip if same order was already applied
    const orderKey = groupOrder.join(",");
    if (orderKey === lastAppliedOrderRef.current) return;
    lastAppliedOrderRef.current = orderKey;

    // Reorder internal state: groupOrder[i] = original index that should now be at position i
    setModifierGroups((prev) => {
      if (groupOrder.length !== prev.length) return prev; // length mismatch — skip
      const reordered = groupOrder
        .map((originalIdx) => prev[originalIdx])
        .filter(Boolean);
      if (reordered.length !== prev.length) return prev; // safety check
      return reordered.map((g, i) => ({ ...g, position: i + 1 }));
    });
  }, [groupOrder]);

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
        isMain: false,
        linkedToGroupId: null,
        required: true,
        minSelect: 1,
        maxSelect: 1,
        maxQty: 1,
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
        isMain: false,
        linkedToGroupId: null,
        required: template.required,
        minSelect: template.minSelect,
        maxSelect: template.maxSelect,
        maxQty:
          template.maxQty ?? Math.max(template.minSelect, template.maxSelect),
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
        const syncedMaxQty =
          template.maxQty ?? Math.max(template.minSelect, template.maxSelect);
        groups[groupIndex] = {
          ...groups[groupIndex],
          name: template.name,
          required: template.required,
          minSelect: template.minSelect,
          maxSelect: template.maxSelect,
          maxQty: syncedMaxQty,
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
      prev
        .filter((_, i) => i !== groupIndex)
        .map((g, i) => ({ ...g, position: i + 1 })),
    );
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

  /** Update a group-level field (name, required, minSelect, maxSelect, maxQty) */
  const updateModifierGroup = (
    groupIndex: number,
    field: keyof ModifierGroupUI,
    value: string | boolean | number | null,
  ) => {
    setModifierGroups((prev) => {
      const groups = [...prev];
      const updated = { ...groups[groupIndex], [field]: value };

      // Auto-bump maxQty so it never falls below minSelect / maxSelect
      // (avoids conflicting constraints). Only applies when value is a number —
      // empty string means the admin is mid-edit and will fill it later.
      if (field === "minSelect" && typeof value === "number") {
        const currentMaxQty =
          typeof updated.maxQty === "number" ? updated.maxQty : 0;
        if (currentMaxQty < value) updated.maxQty = value;
      }
      if (field === "maxSelect" && typeof value === "number") {
        const currentMaxQty =
          typeof updated.maxQty === "number" ? updated.maxQty : 0;
        if (currentMaxQty < value) updated.maxQty = value;
      }

      groups[groupIndex] = updated;
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

  // ── Main / Linked group helpers ─────────────────────────────────────────────

  /** Mark a group as the main source group — unsets any previous main */
  const setAsMain = (groupIndex: number, value: boolean) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => ({
        ...g,
        // Only one group can be main; clear linkedToGroupId on the new main
        isMain: i === groupIndex ? value : false,
        linkedToGroupId: i === groupIndex && value ? null : g.linkedToGroupId,
      })),
    );
  };

  /** Link a group to the main group (or unlink with null) */
  const linkToGroup = (groupIndex: number, targetGroupId: string | null) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => ({
        ...g,
        // A linked group cannot also be main
        isMain: i === groupIndex && targetGroupId ? false : g.isMain,
        linkedToGroupId: i === groupIndex ? targetGroupId : g.linkedToGroupId,
      })),
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProductSectionCard title="Modifier Groups" iconName="ListChecks">
      {/* Empty state */}
      {modifierGroups.length === 0 && (
        <p className="text-xs text-gray-400">
          No groups yet. Add a group or apply a template so customers can choose
          their items.
        </p>
      )}

      {/* Group list */}
      {modifierGroups.map((group, groupIndex) => (
        <div key={group._id ?? groupIndex}>
          <ProductSectionCard
            title={modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`}
            iconName="Utensils"
            className="space-y-3"
          >
            {/* Group header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-xs font-mono text-gray-500 shrink-0">
                  {group.position ?? groupIndex + 1}
                </span>

                {/* Main toggle — exactly one group per product can be "main" */}
                <ToggleButton
                  label="Main"
                  checked={group.isMain}
                  onCheckedChange={(value) => setAsMain(groupIndex, value)}
                />
                <ToggleButton
                  label="Required"
                  checked={group.required}
                  onCheckedChange={(value) =>
                    updateModifierGroup(groupIndex, "required", value)
                  }
                />
              </div>

              <ExpandableActions
                isOpen={isOpen(groupIndex)}
                onClose={() => close(groupIndex)}
                onToggle={() => toggle(groupIndex)}
                actions={
                  [
                    group.templateId && {
                      key: "sync",
                      icon: { name: "RefreshCw", size: 15 },
                      title:
                        "Sync from template (re-apply latest template data)",
                      text: "Sync from template",
                      className: "text-blue-500",
                      variant: "ghost",
                      onClick: () => syncFromTemplate(groupIndex),
                    },
                    group.templateId && {
                      key: "detach",
                      icon: { name: "Unlink2" },
                      title: "Detach from template (keep data as standalone)",
                      text: "Detach from template",
                      className: "text-brand-color-500",
                      variant: "ghost",
                      onClick: () => detachTemplate(groupIndex),
                    },
                    {
                      key: "delete",
                      icon: { name: "Trash2", size: 15 },
                      title: "Delete this group",
                      text: "Delete",
                      className: "text-red-500",
                      variant: "ghost",
                      onClick: () => removeModifierGroup(groupIndex),
                    },
                  ].filter(Boolean) as ActionItem[]
                }
              />
            </div>

            {/* Template reference badge + group header */}

            <InputField
              type="text"
              label="Modifier Group Name"
              subLabel="Choose a descriptive name customers will see, such as 'Drinks', 'Add-ons', or 'Upgrade Your Main Dish'."
              placeholder="e.g. Drinks, Add-ons, Upgrade Your Main Dish"
              value={group.name}
              onChange={(e) =>
                updateModifierGroup(groupIndex, "name", e.target.value)
              }
              required
            />

            {/* Template badge */}
            {group.templateId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <DynamicIcon
                  name="Layers"
                  size={14}
                  className="text-blue-500"
                />
                <span className="text-blue-600 font-semibold">
                  From template
                </span>
                <span className="text-blue-400">
                  — edits are local overrides, won't change the template
                </span>
              </div>
            )}

            {/* ── Main / Linked group controls ──────────────────────────────── */}

            {/* Link-to-group dropdown — each linked group follows ONE main */}
            {modifierGroups.length > 1 && !group.isMain && (
              <div>
                <SelectField
                  label="Link to group"
                  value={group.linkedToGroupId ?? "No Linked"}
                  onChange={(e) =>
                    linkToGroup(groupIndex, e.target.value || null)
                  }
                  disabled={group.isMain}
                  options={[
                    { label: "No linked", value: "" },
                    ...modifierGroups
                      .filter((g, i) => i !== groupIndex && g._id && g.isMain)
                      .map((g) => ({
                        value: g._id!,
                        label: g.name || "Unnamed group",
                      })),
                  ]}
                />
                {modifierGroups.length > 1 &&
                  !modifierGroups.some((g) => g.isMain) && (
                    <p className="text-[10px] text-amber-500 mt-0.5">
                      Mark a group as Main first to enable linking
                    </p>
                  )}
              </div>
            )}

            {/* ── Group settings (hidden for linked groups — derived from main) ── */}
            {group.linkedToGroupId ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                <DynamicIcon
                  name="Link"
                  size={14}
                  className="text-purple-500"
                />
                <span className="text-purple-600 font-semibold">
                  Linked group
                </span>
                <span className="text-purple-400">
                  — settings derived from main group at runtime
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Min select — minimum distinct items */}
                <InputField
                  type="number"
                  placeholder="Required"
                  label="Min items to select"
                  min={1}
                  max={group.items.length || 1}
                  required
                  value={group.minSelect}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateModifierGroup(
                      groupIndex,
                      "minSelect",
                      raw === "" ? "" : parseInt(raw, 10),
                    );
                  }}
                />
                {/* Max select — maximum distinct items */}
                <InputField
                  label="Max items to select"
                  type="number"
                  placeholder="Required"
                  required
                  min={typeof group.minSelect === "number" ? group.minSelect : 1}
                  max={group.items.length || 1}
                  value={group.maxSelect}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateModifierGroup(
                      groupIndex,
                      "maxSelect",
                      raw === "" ? "" : parseInt(raw, 10),
                    );
                  }}
                />

                {/* Max qty — total quantity across the whole group */}
                <InputField
                  label="Max quantity"
                  type="number"
                  placeholder="Required"
                  required
                  min={
                    Math.max(
                      typeof group.minSelect === "number" ? group.minSelect : 1,
                      typeof group.maxSelect === "number" ? group.maxSelect : 1,
                    )
                  }
                  max={99}
                  value={group.maxQty}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateModifierGroup(
                      groupIndex,
                      "maxQty",
                      raw === "" ? "" : parseInt(raw, 10),
                    );
                  }}
                />
              </div>
            )}

            {/* Select products button */}
            <IconButton
              onClick={() => openProductSelection(groupIndex)}
              variant="underline"
              text={`Select Products for ${modifierGroups[groupIndex].name || `Group ${groupIndex + 1}`}`}
              title="Choose which products customers can upgrade to"
              className="text-lg"
            />

            {/* Items in this group */}
            {group.items.length > 0 &&
              (() => {
                const COLLAPSE_THRESHOLD = 3;
                const hasManyItems = group.items.length > COLLAPSE_THRESHOLD;
                const expanded = isExpanded(groupIndex);
                const visibleItems =
                  hasManyItems && !expanded
                    ? group.items.slice(0, COLLAPSE_THRESHOLD)
                    : group.items;

                return (
                  <>
                    <div className="space-y-2">
                      {visibleItems.map((item, itemIndex) => {
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
                            onDragOver={(e) => {
                              // Only respond to item-level drag within same group
                              if (
                                dragItemKey !== null &&
                                dragItemKey.startsWith(`${groupIndex}-`)
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverItemKey(itemKey);
                              }
                            }}
                            onDragLeave={() => {
                              setDragOverItemKey(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // prevent group-level drop
                              if (
                                dragItemKey !== null &&
                                dragItemKey.startsWith(`${groupIndex}-`)
                              ) {
                                handleItemDrop(groupIndex, itemIndex);
                              }
                              setDragItemKey(null);
                              setDragOverItemKey(null);
                            }}
                            className={`flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg relative transition-all duration-150 select-none
                             ${isDraggingItem ? "opacity-40" : ""}
                             ${isDragOverItem ? "border-brand-color-500 bg-brand-color-50 ring-1 ring-brand-color-500" : ""}`}
                          >
                            {/* Drag handle */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation(); // prevent group-level drag
                                setDragItemKey(itemKey);
                                setDragOverItemKey(null);
                              }}
                              className="flex flex-col items-center justify-center shrink-0 gap-1"
                            >
                              <DynamicIcon
                                name="GripVertical"
                                className="text-gray-400 cursor-grab active:cursor-grabbing"
                                size={16}
                              />
                            </div>
                            <IconButton
                              type="button"
                              onClick={() =>
                                removeItemFromGroup(groupIndex, itemIndex)
                              }
                              title="Delete this product"
                              icon={{ name: "Trash2" }}
                              className="absolute right-2 top-2 rounded-full opacity-80"
                              variant="danger"
                            />
                            {/* Image — left, full height */}
                            <div className="flex flex-col items-center justify-center bg-gray-100 p-3 gap-2 flex-1 max-w-52">
                              <div className="w-11 h-11 rounded-md shrink-0 border border-gray-200 overflow-hidden">
                                <AppImage
                                  src={item._imageUrl ?? ""}
                                  alt={item._name}
                                />
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
                                    <span className="line-through">
                                      ₱{soloPrice}
                                    </span>
                                  </span>
                                )}
                                {isDiscountedUpgrade && (
                                  <span className="text-xs text-green-600 font-semibold shrink-0">
                                    ↓ saves ₱
                                    {(soloPrice - upgradePrice).toFixed(0)}
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

                    {/* Show more / show less toggle for groups with many items */}
                    {hasManyItems && (
                      <IconButton
                        onClick={() => toggleExpanded(groupIndex)}
                        text={
                          expanded
                            ? `Show less (${group.items.length - COLLAPSE_THRESHOLD} hidden)`
                            : `Show ${group.items.length - COLLAPSE_THRESHOLD} more items`
                        }
                        variant="underline"
                        className="text-center w-full"
                      />
                    )}
                  </>
                );
              })()}
            {group.items.length === 0 && (
              <p className="text-xs text-gray-400">
                No items in this group. Click the button above to select
                products.
              </p>
            )}
          </ProductSectionCard>
        </div>
      ))}

      {/* Reorder hint */}
      {modifierGroups.some((g) => g.items.length > 1) && (
        <p className="text-xs text-gray-500 text-center">
          Drag ⠿ to reorder items within a group
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
