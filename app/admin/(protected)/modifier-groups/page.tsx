"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { useStaffContext } from "@/contexts/StaffContext";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { AppImage } from "@/components/AppImage";
import SectionHeader from "../../components/SectionHeader";
import Modal from "@/components/ui/Modal";
import { InputField, ToggleButton } from "@/components/ui/FormComponents";
import ProductSelectionModal from "../products/ProductSelectionModal";
import {
  ModifierGroupTemplate,
  ModifierGroupTemplateItem,
  Product,
} from "@/types/products";
import { apiClient } from "@/lib/apiClient";
import { IconButton } from "@/components/ui/buttons";

// ─── API helpers ──────────────────────────────────────────────────────────────

const templatesApi = {
  getAll: async (): Promise<ModifierGroupTemplate[]> => {
    const response = await apiClient.get<{ data: ModifierGroupTemplate[] }>(
      "/modifier-group-templates",
    );
    return response?.data ?? [];
  },
  create: async (payload: {
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    items: ModifierGroupTemplateItem[];
  }): Promise<ModifierGroupTemplate> => {
    const response = await apiClient.post<{ data: ModifierGroupTemplate }>(
      "/modifier-group-templates",
      payload,
    );
    return response?.data;
  },
  update: async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<{
      name: string;
      required: boolean;
      minSelect: number;
      maxSelect: number;
      items: ModifierGroupTemplateItem[];
    }>;
  }): Promise<ModifierGroupTemplate> => {
    const response = await apiClient.put<{ data: ModifierGroupTemplate }>(
      `/modifier-group-templates/${id}`,
      data,
    );

    return response?.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/modifier-group-templates/${id}`);
  },
};

// ─── Template Edit/Create Modal ──────────────────────────────────────────────

interface TemplateFormModalProps {
  template?: ModifierGroupTemplate | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    items: ModifierGroupTemplateItem[];
  }) => void;
  isSaving: boolean;
}

const TemplateFormModal = ({
  template,
  onClose,
  onSave,
  isSaving,
}: TemplateFormModalProps) => {
  const isEdit = !!template;
  const productCount = template?.productCount ?? 0;

  const [name, setName] = useState(template?.name ?? "");
  const [required, setRequired] = useState(template?.required ?? true);
  // Stored as string | number so the input can be fully cleared (empty string)
  // without producing NaN. Parsing to number happens on submit.
  const [minSelect, setMinSelect] = useState<number | string>(
    template?.minSelect ?? 1,
  );
  const [maxSelect, setMaxSelect] = useState<number | string>(
    template?.maxSelect ?? 1,
  );
  const [items, setItems] = useState<ModifierGroupTemplateItem[]>(
    (template?.items ?? []).map((item, idx) => ({ ...item, position: idx + 1 })),
  );

  // ── Drag-and-drop state for item reorder ────────────────────────────────────

  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  /** Reorder items within the template via drag-and-drop (local state only) */
  const handleItemDrop = (targetIndex: number) => {
    if (dragItemIndex === null || dragItemIndex === targetIndex) return;
    setItems((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(dragItemIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered.map((item, i) => ({ ...item, position: i + 1 }));
    });
    setDragItemIndex(null);
    setDragOverItemIndex(null);
  };

  // ── Product selection modal ─────────────────────────────────────────────────

  const [showProductModal, setShowProductModal] = useState(false);

  const openProductModal = () => {
    setShowProductModal(true);
  };

  const handleProductConfirm = (selectedProducts: Product[]) => {
    const existingIds = items.map((i) =>
      typeof i.product === "string" ? i.product : (i.product?._id ?? ""),
    );
    const newItems: ModifierGroupTemplateItem[] = selectedProducts
      .filter((p) => !existingIds.includes(p._id))
      .map((p, idx) => ({
        product: p._id,
        label: null,
        price: p.price ?? null,
        snapshotName: p.name,
        snapshotPrice: p.price ?? null,
        position: items.length + idx + 1,
      }));
    setItems([...items, ...newItems]);
    setShowProductModal(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i + 1 })));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (items.length === 0) {
      toast.error("Template must have at least one item");
      return;
    }

    if (minSelect === "" || maxSelect === "") {
      toast.error("Minimum and Maximum to select are required");
      return;
    }

    // Parse string | number → number. Empty fields are caught above.
    const parsedMin = typeof minSelect === "number" && minSelect >= 1 ? minSelect : 1;
    const parsedMax = typeof maxSelect === "number" && maxSelect >= 1 ? maxSelect : parsedMin;

    onSave({
      name: name.trim(),
      required,
      minSelect: parsedMin,
      maxSelect: parsedMax,
      items: items.map((item, idx) => ({
        product:
          typeof item.product === "string"
            ? item.product
            : (item.product?._id ?? ""),
        label: item.label ?? null,
        price: item.price ?? null,
        snapshotName: item.snapshotName ?? null,
        snapshotPrice: item.snapshotPrice ?? null,
        position: item.position ?? idx + 1,
      })),
    });
  };

  const alreadySelectedIds = items.map((i) =>
    typeof i.product === "string" ? i.product : (i.product?._id ?? ""),
  );

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? "Edit Modifier Template" : "Create Modifier Template"}
      subTitle="Define a reusable modifier group that can be applied to multiple products"
    >
      <div className="space-y-5">
        {/* Warning banner when editing a template that products reference */}
        {isEdit && productCount > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <DynamicIcon
              name="AlertTriangle"
              size={18}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <div className="text-xs text-amber-700">
              <p className="font-semibold">
                {productCount} product{productCount !== 1 ? "s" : ""}{" "}
                {productCount !== 1 ? "use" : "uses"} this template
              </p>
              <p className="mt-1 text-amber-600">
                Editing this template will NOT automatically update those
                products. Each product keeps its own embedded copy — admins must
                manually click "Sync from template" on each product to apply
                changes.
              </p>
            </div>
          </div>
        )}

        {/* Name */}
        <InputField
          label="Template Name"
          type="text"
          placeholder="e.g., Grilled Items, Drinks, Appetizer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Settings row */}
        <div className="grid grid-cols-[2fr_5fr_5fr] gap-3">
          <div className="self-center">
            <ToggleButton
              label="Required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
          <InputField
            label="Minimum to select"
            type="number"
            min={1}
            max={items.length || 1}
            placeholder="Required"
            required
            value={minSelect}
            onChange={(e) => {
              const raw = e.target.value;
              setMinSelect(raw === "" ? "" : parseInt(raw, 10));
            }}
          />
          <InputField
            label="Maximum to select"
            type="number"
            min={typeof minSelect === "number" ? minSelect : 1}
            max={items.length || 1}
            placeholder="Required"
            required
            value={maxSelect}
            onChange={(e) => {
              const raw = e.target.value;
              setMaxSelect(raw === "" ? "" : parseInt(raw, 10));
            }}
          />
        </div>

        {/* Select products button */}
        <IconButton
          type="button"
          onClick={openProductModal}
          text="Select Products"
          variant="ghost"
          className="text-brand-color-500 hover:bg-transparent hover:text-brand-color-600 px-0"
          icon={{ name: "Search" }}
        />

        {/* Items list */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => {
              const displayName =
                item.snapshotName ||
                item.label ||
                (typeof item.product === "object"
                  ? item.product?.name
                  : `Item ${i + 1}`);
              const soloPrice = item.snapshotPrice ?? null;
              const itemImageUrl =
                typeof item.product === "object" && item.product?.image?.url
                  ? item.product.image.url
                  : "";
              const isDraggingItem = dragItemIndex === i;
              const isDragOverItem = dragOverItemIndex === i;

              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => {
                    setDragItemIndex(i);
                    setDragOverItemIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverItemIndex(i);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleItemDrop(i);
                  }}
                  className={`flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg relative transition-all duration-150 select-none
                    ${isDraggingItem ? "opacity-40" : ""}
                    ${isDragOverItem ? "border-t-2 border-t-brand-color-500" : ""}`}
                >
                  {/* Drag handle */}
                  <DynamicIcon
                    name="GripVertical"
                    className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
                    size={16}
                  />
                  <span className="text-xs font-mono text-gray-500 shrink-0">
                    {item.position ?? i + 1}
                  </span>

                  <IconButton
                    type="button"
                    onClick={() => removeItem(i)}
                    className="absolute -right-1 -top-1"
                    variant="danger"
                    icon={{ name: "Trash2", size: 12 }}
                  />

                  {/* Product image + name */}
                  <div className="w-10 h-10 rounded-md shrink-0 border border-gray-200 overflow-hidden">
                    <AppImage src={itemImageUrl} alt={displayName} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 min-w-0 truncate flex-1">
                    {displayName}
                  </p>
                  {/* Label + Price overrides */}
                  <div className="flex items-center gap-2 shrink-0">
                    <InputField
                      label="Label"
                      type="text"
                      placeholder="Display name"
                      value={item.label || ""}
                      onChange={(e) =>
                        updateItem(i, "label", e.target.value || null)
                      }
                    />
                    <InputField
                      label="Upgrade ₱"
                      type="number"
                      min={0}
                      step="1"
                      placeholder={soloPrice?.toString() ?? "0"}
                      value={item.price ?? ""}
                      onChange={(e) =>
                        updateItem(
                          i,
                          "price",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No items yet. Click "Select Products" to add items to this template.
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <IconButton onClick={onClose} variant="secondary" text="Cancel" />
          <IconButton
            type="button"
            onClick={handleSubmit}
            disabled={
              isSaving ||
              !name.trim() ||
              items.length === 0 ||
              minSelect === "" ||
              maxSelect === ""
            }
            variant={isSaving ? "disabled" : isEdit ? "success" : "primary"}
            text={
              isSaving
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Template"
                  : "Create Template"
            }
          />
        </div>
      </div>

      {/* Product selection modal */}
      {showProductModal && (
        <ProductSelectionModal
          onClose={() => setShowProductModal(false)}
          onConfirm={handleProductConfirm}
          alreadySelectedIds={alreadySelectedIds}
        />
      )}
    </Modal>
  );
};

// ─── Template List Row ────────────────────────────────────────────────────────

const TemplateRow = ({
  template,
  onEdit,
  onRequestDelete,
  isDeleting,
}: {
  template: ModifierGroupTemplate;
  onEdit: () => void;
  onRequestDelete: () => void;
  isDeleting: boolean;
}) => {
  // Extract display names from items
  const itemNames = template.items.map((item) => {
    if (item.product && typeof item.product === "object") {
      return item.product.name;
    }
    return item.snapshotName || item.label || "Unknown";
  });

  return (
    <div className="flex items-start gap-4 px-6 py-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition">
      <div className="flex items-center justify-center w-10 h-10 bg-brand-color-50 rounded-lg shrink-0">
        <DynamicIcon name="Layers" size={18} className="text-brand-color-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{template.name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>
            {template.items.length} item{template.items.length !== 1 ? "s" : ""}
          </span>
          <span
            className={template.required ? "text-green-600" : "text-gray-400"}
          >
            {template.required ? "Required" : "Optional"}
          </span>
          <span>
            Min {template.minSelect} / Max {template.maxSelect}
          </span>
        </div>
        {itemNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {itemNames.slice(0, 6).map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded"
              >
                {name}
              </span>
            ))}
            {itemNames.length > 6 && (
              <span className="text-[10px] text-gray-400">
                +{itemNames.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <IconButton
          onClick={onEdit}
          disabled={isDeleting}
          aria-label="Edit template"
          variant="ghost"
          icon={{ name: "Pencil", className: "text-green-500" }}
          className="hover:bg-green-50"
        />
        <IconButton
          onClick={onRequestDelete}
          disabled={isDeleting}
          aria-label="Delete template"
          variant="ghost"
          icon={{
            name: isDeleting ? "Loader2" : "Trash2",
            className: isDeleting ? "animate-spin" : "text-red-500",
          }}
          className="hover:bg-red-50"
        />
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Page = () => {
  const queryClient = useQueryClient();
  const admin = useStaffContext();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ModifierGroupTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** Template being considered for deletion (shown in confirmation dialog) */
  const [deleteTarget, setDeleteTarget] =
    useState<ModifierGroupTemplate | null>(null);

  const {
    data: templates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["modifier-group-templates"],
    queryFn: templatesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-group-templates"] });
      setShowFormModal(false);
      toast.success("Template created!");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create template"),
  });

  const updateMutation = useMutation({
    mutationFn: templatesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-group-templates"] });
      setShowFormModal(false);
      setEditingTemplate(null);
      toast.success("Template updated!");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update template"),
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-group-templates"] });
      setDeleteTarget(null);
      toast.success("Template deleted!");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to delete template"),
  });

  const handleSave = (payload: {
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    items: ModifierGroupTemplateItem[];
  }) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (template: ModifierGroupTemplate) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowFormModal(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Modifier Group Templates"
        subTitle="Create reusable modifier groups that can be applied to combo/set products"
        btnTxt={
          !showFormModal && canAccess(admin?.role, "modifier-groups.create")
            ? "+ Create Template"
            : ""
        }
        onClick={handleCreate}
      />

      <div className="flex items-center justify-center w-full">
        <div className="bg-white border border-gray-200 shadow-sm w-full max-w-400">
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <DynamicIcon name="Loader2" size={18} className="animate-spin" />
              <span className="text-sm">Loading templates...</span>
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-red-500 mb-1">
                Failed to load templates
              </p>
              <p className="text-xs text-gray-500">Something went wrong.</p>
            </div>
          )}
          {!isLoading && !isError && templates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DynamicIcon
                name="Layers"
                size={32}
                className="text-gray-200 mb-3"
              />
              <p className="text-sm text-gray-500">No templates yet.</p>
              <p className="text-xs text-gray-300 mt-1">
                Create a template to quickly apply modifier groups to products.
              </p>
            </div>
          )}
          {!isLoading &&
            !isError &&
            templates.map((template) => (
              <TemplateRow
                key={template._id}
                template={template}
                onEdit={() => handleEdit(template)}
                onRequestDelete={() => setDeleteTarget(template)}
                isDeleting={deletingId === template._id}
              />
            ))}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showFormModal && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => {
            setShowFormModal(false);
            setEditingTemplate(null);
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal
          onClose={() => setDeleteTarget(null)}
          title="Delete Template"
          subTitle={`Are you sure you want to delete "${deleteTarget.name}"?`}
        >
          <div className="space-y-4">
            {(deleteTarget.productCount ?? 0) > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <DynamicIcon
                  name="AlertTriangle"
                  size={18}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">
                    {deleteTarget.productCount ?? 0} product
                    {(deleteTarget.productCount ?? 0) !== 1 ? "s" : ""}{" "}
                    {(deleteTarget.productCount ?? 0) !== 1
                      ? "reference"
                      : "references"}{" "}
                    this template
                  </p>
                  <p className="mt-1 text-red-600">
                    Those products will keep their embedded modifier group data,
                    but the template link becomes stale. "Sync from template"
                    will no longer work for those products.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <IconButton
                type="button"
                onClick={() => setDeleteTarget(null)}
                text="Cancel"
                variant="secondary"
              />
              <IconButton
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                variant="primary"
                text={
                  deleteMutation.isPending ? "Deleting..." : "Delete Template"
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Page;
