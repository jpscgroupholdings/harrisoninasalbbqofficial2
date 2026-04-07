"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import PermissionGuard from "@/lib/PermissionGuard";
import { canAccess } from "@/lib/roleBasedAccessCtrl";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  name: string;
  position: number;
  image?: {
    url: string;
    public_id: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── API helpers ───────────────────────────────────────────────────────────────
const api = {
  getAll: async (): Promise<Category[]> => {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },
  create: async (data: {
    name: string;
    position: number;
    imageFile?: string;
  }) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
  },
  update: async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<Category> & { imageFile?: string };
  }) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res.json();
  },
  reorder: async (categories: { id: string; position: number }[]) => {
    const res = await fetch("/api/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    if (!res.ok) throw new Error("Failed to reorder categories");
    return res.json();
  },
};

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
    const base64 = await toBase64(file);
    onChange(base64);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const dim = size === "sm" ? "w-9 h-9" : "w-12 h-12";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${dim} border-2 border-dashed border-gray-200 hover:border-brand-color-500 flex items-center justify-center overflow-hidden transition-colors group`}
        title="Upload category image"
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImagePlus
            size={size === "sm" ? 14 : 18}
            className="text-gray-300 group-hover:text-brand-color-500 transition-colors"
          />
        )}
      </button>

      {/* Remove image button */}
      {preview && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full hover:bg-red-600 transition-colors"
          title="Remove image"
        >
          <X size={9} />
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
  // preview: existing URL (string) or new base64 (string) or null
  const [imagePreview, setImagePreview] = useState<string | null>(
    category.image?.url ?? null,
  );
  // track whether user picked a NEW file (to send as base64) vs kept old URL
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);

  const handleImageChange = (base64: string | null) => {
    setNewImageBase64(base64);
    setImagePreview(base64);
  };

  const handleSave = () => {
    // If user cleared the image, pass empty string to signal removal
    // If user picked new image, send base64
    // If user didn't touch image, pass undefined (no change)
    onSave(value, newImageBase64);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-color-50 border border-brand-color-200">
      <GripVertical className="text-gray-300 shrink-0" size={18} />
      <span className="text-xs font-mono text-gray-500 w-6">
        {category.position}
      </span>

      {/* Image upload */}
      <ImageUploadButton preview={imagePreview} onChange={handleImageChange} />

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 bg-white border border-brand-color-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-color-500"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || !value.trim()}
        className="p-1.5 bg-brand-color-500 text-white hover:bg-brand-color-600 disabled:opacity-50 transition-colors"
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Check size={14} />
        )}
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ── Category row ──────────────────────────────────────────────────────────────
const CategoryRow = ({
  category,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  isDeleting,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  isDeleting: boolean;
}) => (
  <div
    draggable={!isDeleting}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    className={`flex items-center gap-6 px-6 py-3 border-b border-gray-100 bg-white group transition-all duration-150
    ${isDragging ? "opacity-40" : "opacity-100"}
    ${isDragOver ? "border-t-2 border-t-brand-color-500" : ""}
  `}
  >
    {/* Drag spacer (matches header w-6) */}
    <div className="w-6 flex">
      <GripVertical
        className={`text-gray-500 group-hover:text-gray-500 transition-colors ${!isDeleting ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"}`}
        size={18}
      />
    </div>

    {/* Position (matches header w-12) */}
    <span className="flex-1 text-center text-xs font-mono text-gray-500">
      {category.position}
    </span>

    {/* Image (matches header flex-1) */}
    <div className="flex-1 flex justify-start">
      <div className="w-14 h-14 overflow-hidden">
        {category.image?.url ? (
          <img
            src={category.image.url}
            alt={category.name}
            className="w-full h-full object-content"
          />
        ) : (
          <ImagePlus size={13} className="text-gray-300" />
        )}
      </div>
    </div>

    {/* Name (matches header flex-1) */}
    <span className="flex-2 text-sm font-medium text-gray-800 text-start">
      {category.name}
    </span>

    {/* Actions (matches header flex-1) */}
    <div className="flex-2 flex justify-center items-center gap-1">
      <PermissionGuard permission="categories.update" fallback={<span className="text-xs text-gray-400">No access</span>}>
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="p-1.5 text-dark-green-500 hover:text-dark-green-600 hover:bg-dark-green-50 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Edit"
        >
          <Pencil size={14} />
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

// ── Main page ─────────────────────────────────────────────────────────────────
const Page = () => {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Queries ──
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getAll,
    select: (data) => [...data].sort((a, b) => a.position - b.position),
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: api.create,
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
    mutationFn: api.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      toast.success("Category updated!");
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: api.delete,
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
    mutationFn: api.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Reordered successfully!");
    },
  });

  // ── Drag & drop ──
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;

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

  // ── Handlers ──
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
      data: {
        name: name.trim(),
        // Only include imageFile if a new one was chosen
        ...(imageFile !== null ? { imageFile } : {}),
      },
    });
  };

  // ── Render ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Product Categories
        </h1>
        <p className="text-gray-500">
          Drag rows to reorder. Changes save automatically.
        </p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center w-full">
        <div className="bg-white border border-gray-200 shadow-sm w-full max-w-7xl">
          {/* Table header */}
          <div className="grid grid-cols-[24px_1fr_1fr_2fr_2fr] items-center gap-6 px-6 py-3 border-b border-gray-200 bg-gray-50">
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
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Actions
            </span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading categories...</span>
            </div>
          )}
          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-red-500 mb-1">
                Failed to load categories
              </p>
              <p className="text-xs text-gray-500">
                Something went wrong while fetching the data. Please try again.
              </p>
            </div>
          )}
          {/* Empty */}
          {!isLoading && !isError && categories.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-500">No categories yet.</p>
              <p className="text-xs text-gray-300 mt-1">
                Click "Add Category" to get started.
              </p>
            </div>
          )}
          {/* Rows */}
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
                  onDragStart={() => setDragId(category._id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(category._id);
                  }}
                  onDrop={() => handleDrop(category._id)}
                  isDragging={dragId === category._id}
                  isDragOver={dragOverId === category._id}
                  isDeleting={deletingId === category._id}
                />
              ),
            )}
          {/* Add new row */}
          {isAdding && (
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-color-50 border-t border-brand-color-200">
              <GripVertical className="text-gray-200 shrink-0" size={18} />
              <span className="text-xs font-mono text-gray-300 w-6">
                {categories.length + 1}
              </span>
              {/* Image upload for new category */}
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
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
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
                <X size={14} />
              </button>
            </div>
          )}
          {/* Footer / Add button */}
          {!isAdding && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 text-sm font-bold text-brand-color-500 hover:text-brand-color-600 transition-colors"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reorder hint */}
      {categories.length > 1 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          {reorderMutation.isPending ? "Saving order..." : "Drag ⠿ to reorder"}
        </p>
      )}
    </div>
  );
};

export default Page;
