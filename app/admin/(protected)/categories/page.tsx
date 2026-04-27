"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PermissionGuard from "@/lib/PermissionGuard";
import { categories_api, subcategories_api } from "./hooks/api";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { useStaffContext } from "@/contexts/StaffContext";
import { Category } from "@/types/category";
import { DynamicIcon } from "@/lib/DynamicIcon";
import SectionHeader from "../../components/SectionHeader";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { Loader2, Trash2 } from "lucide-react";
import { fileToBase64 } from "@/lib/fileUtils";

// ── Image Upload Button ───────────────────────────────────────────────────────
const ImageUploadButton = ({
  preview,
  onChange,
  size = "sm",
}: {
  preview: string | null;
  onChange: (base64: string | null) => void;
  size?: "sm" | "md";
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 27 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const base64 = await fileToBase64(file);
    onChange(base64);
    e.target.value = "";
  };
  const dim = size === "sm" ? "w-9 h-9" : "w-12 h-12";
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${dim} border-2 border-dashed border-gray-200 hover:border-brand-color-500 flex items-center justify-center overflow-hidden transition-colors group`}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <DynamicIcon
            name="ImagePlus"
            size={size === "sm" ? 14 : 18}
            className="text-gray-300 group-hover:text-brand-color-500 transition-colors"
          />
        )}
      </button>
      {preview && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full hover:bg-red-600 transition-colors"
        >
          <DynamicIcon name="X" size={9} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

// ── Inline edit row ───────────────────────────────────────────────────────────
const EditRow = ({
  category,
  onSave,
  onCancel,
  isSaving,
}: {
  category: Category;
  onSave: (name: string, imageFile: string | null) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [value, setValue] = useState(category.name);
  const [imagePreview, setImagePreview] = useState<string | null>(
    category.image?.url ?? null,
  );
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const handleImageChange = (base64: string | null) => {
    setNewImageBase64(base64);
    setImagePreview(base64);
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-color-50 border border-brand-color-200">
      <DynamicIcon
        name="GripVertical"
        className="text-gray-300 shrink-0"
        size={18}
      />
      <span className="text-xs font-mono text-gray-500 w-6">
        {category.position}
      </span>
      <ImageUploadButton preview={imagePreview} onChange={handleImageChange} />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value, newImageBase64);
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 bg-white border border-brand-color-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-color-500"
      />
      <button
        onClick={() => onSave(value, newImageBase64)}
        disabled={isSaving || !value.trim()}
        className="p-1.5 bg-brand-color-500 text-white hover:bg-brand-color-600 disabled:opacity-50 transition-colors"
      >
        {isSaving ? (
          <DynamicIcon name="Loader2" size={14} className="animate-spin" />
        ) : (
          <DynamicIcon name="Check" size={14} />
        )}
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <DynamicIcon name="X" size={14} />
      </button>
    </div>
  );
};

// ── Category row ──────────────────────────────────────────────────────────────
const CategoryRow = ({
  category,
  onEdit,
  onView,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  isDeleting,
  hasPermissionUpdate,
}: {
  category: Category & { subCategoryCount?: number };
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  isDeleting: boolean;
  hasPermissionUpdate: boolean;
}) => (
  <div
    draggable={!isDeleting && hasPermissionUpdate}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    className={`flex items-center gap-6 px-6 py-3 border-b border-gray-100 bg-white group transition-all duration-150 select-none
      ${isDragging ? "opacity-40" : "opacity-100"}
      ${isDragOver ? "border-t-2 border-t-brand-color-500" : ""}`}
  >
    <div className="w-6 flex">
      <DynamicIcon
        name="GripVertical"
        className={`text-gray-500 transition-colors ${!isDeleting && hasPermissionUpdate ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"}`}
        size={18}
      />
    </div>
    <span className="flex-1 text-center text-xs font-mono text-gray-500">
      {category.position}
    </span>
    <div className="flex-1 flex justify-start">
      <div className="w-14 h-14 overflow-hidden">
        {category.image?.url ? (
          <img
            src={category.image.url}
            alt={category.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <DynamicIcon name="ImagePlus" size={13} className="text-gray-300" />
        )}
      </div>
    </div>
    <span className="flex-2 text-sm font-medium text-gray-800 text-start">
      {category.name}
    </span>
    {/* Subcategory count badge */}
    <div className="flex-2 flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-color-50 text-brand-color-600 text-xs font-semibold rounded-full border border-brand-color-100">
        <DynamicIcon name="Layers" size={11} />
        {category.subCategoryCount ?? 0}
      </span>
    </div>
    <div className="flex-2 flex justify-center items-center gap-1">
      {/* View drawer button */}
      <button
        onClick={onView}
        className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
        aria-label="View subcategories"
      >
        <DynamicIcon name="Eye" size={14} />
      </button>
      <PermissionGuard
        permission="categories.update"
        fallback={<span className="text-xs text-gray-400">No access</span>}
      >
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="p-1.5 text-dark-green-500 hover:text-dark-green-600 hover:bg-dark-green-50 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Edit"
        >
          <DynamicIcon name="Pencil" size={14} />
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Delete"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </PermissionGuard>
    </div>
  </div>
);

// ── SubCategory Drawer ────────────────────────────────────────────────────────
const SubCategoryDrawer = ({
  category,
  onClose,
}: {
  category: (Category & { subCategoryCount?: number }) | null;
  onClose: () => void;
}) => {
  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ["subcategories", category?._id],
    queryFn: () => subcategories_api.getByCategory(category!._id),
    enabled: !!category,
    select: (data) => [...data].sort((a, b) => a.position - b.position),
  });

  if (!category) return null;

  return (
    <>
      <div className="bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {category.image?.url && (
              <img
                src={category.image.url}
                alt={category.name}
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Category
              </p>
              <h2 className="text-base font-bold text-gray-900">
                {category.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Subcategory count + manage link */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">
              {subcategories.length}
            </span>{" "}
            subcategor{subcategories.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* Subcategory list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <DynamicIcon name="Loader2" size={16} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <DynamicIcon
                name="Layers"
                size={32}
                className="text-gray-200 mb-3"
              />
              <p className="text-sm text-gray-500 font-medium">
                No subcategories yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Manage subcategories" to add some.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {subcategories.map((sub, idx) => (
                <li
                  key={sub._id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-mono text-gray-400 w-5">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-800 font-medium flex-1">
                    {sub.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <Link
            href={`/categories/${category._id}/subcategories`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-brand-color-500 text-white text-sm font-semibold hover:bg-brand-color-600 transition-colors rounded"
          >
            <DynamicIcon name="Settings" size={14} />
            Manage Subcategories
          </Link>
        </div>
      </div>
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Page = () => {
  const queryClient = useQueryClient();
  const admin = useStaffContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCategory, setViewingCategory] = useState<
    (Category & { subCategoryCount?: number }) | null
  >(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: categories_api.getAll,
    select: (data) => [...data].sort((a, b) => a.position - b.position),
  });

  const createMutation = useMutation({
    mutationFn: categories_api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAdding(false);
      setNewName("");
      setNewImageBase64(null);
      toast.success("Category created!");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: categories_api.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      toast.success("Category updated!");
    },
    onError: () => toast.error("Failed to update category"),
  });

   const deleteMutation = useMutation({
    mutationFn: categories_api.delete,
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted!");
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to delete category"),
  });

  const reorderMutation = useMutation({
    mutationFn: categories_api.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Reordered successfully!");
    },
  });

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    if (!canAccess(admin?.role, "categories.update")) {
      toast.error("No permission");
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const sorted = [...categories];
    const fromIdx = sorted.findIndex((c) => c._id === dragId);
    const toIdx = sorted.findIndex((c) => c._id === targetId);
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updates = reordered.map((c, i) => ({ id: c._id, position: i + 1 }));
    queryClient.setQueryData(["categories"], () =>
      reordered.map((c, i) => ({ ...c, position: i + 1 })),
    );
    reorderMutation.mutate(updates);
    setDragId(null);
    setDragOverId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName.trim(),
      position: categories.length + 1,
      ...(newImageBase64 ? { imageFile: newImageBase64 } : {}),
    });
  };

  const handleUpdate = (id: string, name: string, imageFile: string | null) => {
    if (!name.trim()) return;
    updateMutation.mutate({
      id,
      data: { name: name.trim(), ...(imageFile !== null ? { imageFile } : {}) },
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Product Categories"
        subTitle="Drag rows to reorder. Changes save automatically."
        btnTxt={
          !isAdding && canAccess(admin?.role, "categories.create")
            ? "+ Add Category"
            : ""
        }
        onClick={() => setIsAdding(true)}
      />

      <div className="flex items-center justify-center w-full">
        <div className="bg-white border border-gray-200 shadow-sm w-full max-w-400">
          {/* Table header */}
          <div className="grid grid-cols-[24px_1fr_1fr_2fr_2fr_2fr] items-center gap-6 px-6 py-3 border-b border-gray-200 bg-gray-50">
            <span />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              #
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">
              Img
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">
              Name
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">
              Subcategories
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Actions
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <DynamicIcon name="Loader2" size={18} className="animate-spin" />
              <span className="text-sm">Loading categories...</span>
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-red-500 mb-1">
                Failed to load categories
              </p>
              <p className="text-xs text-gray-500">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
          {!isLoading && !isError && categories.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-500">No categories yet.</p>
              <p className="text-xs text-gray-300 mt-1">
                Click "Add Category" to get started.
              </p>
            </div>
          )}
          {isAdding && (
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-color-50 border-t border-brand-color-200">
              <DynamicIcon
                name="GripVertical"
                className="text-gray-200 shrink-0"
                size={18}
              />
              <span className="text-xs font-mono text-gray-300 w-6">
                {categories.length + 1}
              </span>
              <ImageUploadButton
                preview={newImageBase64}
                onChange={setNewImageBase64}
              />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewName("");
                    setNewImageBase64(null);
                  }
                }}
                placeholder="Category name..."
                className="flex-1 bg-white border border-brand-color-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-brand-color-500"
              />
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newName.trim()}
                className="p-1.5 bg-brand-color-500 text-white hover:bg-brand-color-600 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? (
                  <DynamicIcon
                    name="Loader2"
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <DynamicIcon name="Check" size={14} />
                )}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName("");
                  setNewImageBase64(null);
                }}
                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <DynamicIcon name="X" size={14} />
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            categories.map((category) =>
              editingId === category._id ? (
                <EditRow
                  key={category._id}
                  category={category}
                  onSave={(name, imageFile) =>
                    handleUpdate(category._id, name, imageFile)
                  }
                  onCancel={() => setEditingId(null)}
                  isSaving={updateMutation.isPending}
                />
              ) : (
                <CategoryRow
                  key={category._id}
                  category={category}
                  onEdit={() => setEditingId(category._id)}
                  onDelete={() => deleteMutation.mutate(category._id)}
                  onView={() => setViewingCategory(category)}
                  onDragStart={() => setDragId(category._id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(category._id);
                  }}
                  onDrop={() => handleDrop(category._id)}
                  isDragging={dragId === category._id}
                  isDragOver={dragOverId === category._id}
                  isDeleting={deletingId === category._id}
                  hasPermissionUpdate={
                    canAccess(admin?.role, "categories.update") ?? false
                  }
                />
              ),
            )}
        </div>
      </div>

      {categories.length > 1 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          {reorderMutation.isPending ? "Saving order..." : "Drag ⠿ to reorder"}
        </p>
      )}

      {/* Subcategory drawer */}

      {viewingCategory && (
        <Modal
          title="Category Details"
          onClose={() => setViewingCategory(null)}
          contentClassName="p-0"
        >
          <SubCategoryDrawer
            category={viewingCategory}
            onClose={() => setViewingCategory(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Page;
