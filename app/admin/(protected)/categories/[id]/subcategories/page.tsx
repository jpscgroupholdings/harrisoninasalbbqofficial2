"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categories_api, subcategories_api } from "../../hooks/api";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { useStaffContext } from "@/contexts/StaffContext";
import { DynamicIcon } from "@/lib/DynamicIcon";
import PermissionGuard from "@/lib/PermissionGuard";
import { SubCategory } from "@/types/category";
import SectionHeader from "@/app/admin/components/SectionHeader";

// ── Inline edit row ───────────────────────────────────────────────────────────
const SubEditRow = ({
  sub,
  onSave,
  onCancel,
  isSaving,
}: {
  sub: SubCategory;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [value, setValue] = useState(sub.name);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-color-50 border border-brand-color-200">
      <DynamicIcon
        name="GripVertical"
        className="text-gray-300 shrink-0"
        size={18}
      />
      <span className="text-xs font-mono text-gray-500 w-6">
        {sub.position}
      </span>

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value);
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 bg-white border border-brand-color-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-color-500"
      />
      <button
        onClick={() => onSave(value)}
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

// ── SubCategory row ───────────────────────────────────────────────────────────
const SubCategoryRow = ({
  sub,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  isDeleting,
  hasPermissionUpdate,
}: {
  sub: SubCategory;
  onEdit: () => void;
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
      {sub.position}
    </span>

    <span className="flex-2 text-sm font-medium text-gray-800">{sub.name}</span>
    <div className="flex-2 flex justify-center items-center gap-1">
      <PermissionGuard
        permission="categories.update"
        fallback={<span className="text-xs text-gray-400">No access</span>}
      >
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="p-1.5 text-dark-green-500 hover:text-dark-green-600 hover:bg-dark-green-50 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DynamicIcon name="Pencil" size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <DynamicIcon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <DynamicIcon name="Trash2" size={14} />
          )}
        </button>
      </PermissionGuard>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const SubcategoriesPage = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const admin = useStaffContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch parent category for breadcrumb
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categories_api.getAll,
  });
  const parentCategory = categories.find((c: any) => c._id === categoryId);

  const {
    data: subcategories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => subcategories_api.getByCategory(categoryId),
    select: (data) => [...data].sort((a, b) => a.position - b.position),
    enabled: !!categoryId,
  });

  const createMutation = useMutation({
    mutationFn: subcategories_api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] }); // refresh count
      setIsAdding(false);
      setNewName("");
      toast.success("Subcategory created!");
    },
    onError: () => toast.error("Failed to create subcategory"),
  });

  const updateMutation = useMutation({
    mutationFn: subcategories_api.update,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      setEditingId(null);
      toast.success("Subcategory updated!");
    },
    onError: () => toast.error("Failed to update subcategory"),
  });

  const deleteMutation = useMutation({
    mutationFn: subcategories_api.delete,
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] }); // refresh count
      toast.success("Subcategory deleted!");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete subcategory"),
  });

  const reorderMutation = useMutation({
    mutationFn: subcategories_api.reorder,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      }),
  });

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const sorted = [...subcategories];
    const fromIdx = sorted.findIndex((s) => s._id === dragId);
    const toIdx = sorted.findIndex((s) => s._id === targetId);
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    queryClient.setQueryData(["subcategories", categoryId], () =>
      reordered.map((s, i) => ({ ...s, position: i + 1 })),
    );
    reorderMutation.mutate(
      reordered.map((s, i) => ({ id: s._id, position: i + 1 })),
    );
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb + header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <DynamicIcon name="ChevronLeft" size={14} />
          Back to Categories
        </button>

        <SectionHeader
          title={`${parentCategory?.name ?? "..."} — Subcategories`}
          subTitle="Drag rows to reorder. Changes save automatically."
          btnTxt={
            canAccess(admin?.role, "categories.create") && !isAdding
              ? "+ Add Subcategory"
              : ""
          }
          onClick={() => setIsAdding(true)}
        />
      </div>

      {/* Table */}
      <div className="flex items-center justify-center w-full">
        <div className="bg-white border border-gray-200 shadow-sm w-full max-w-400">
          <div className="grid grid-cols-[24px_1fr_2fr_2fr] items-center gap-6 px-6 py-3 border-b border-gray-200 bg-gray-50">
            <span />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              #
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">
              Name
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Actions
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <DynamicIcon name="Loader2" size={18} className="animate-spin" />
              <span className="text-sm">Loading subcategories...</span>
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-red-500 mb-1">
                Failed to load
              </p>
              <p className="text-xs text-gray-500">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
          {!isLoading &&
            !isError &&
            subcategories.length === 0 &&
            !isAdding && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DynamicIcon
                  name="Layers"
                  size={32}
                  className="text-gray-200 mb-3"
                />
                <p className="text-sm text-gray-500">No subcategories yet.</p>
                <p className="text-xs text-gray-300 mt-1">
                  Click "+ Add Subcategory" to get started.
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
                {subcategories.length + 1}
              </span>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (newName.trim())
                      createMutation.mutate({
                        name: newName.trim(),
                        categoryId,
                      });
                  }
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewName("");
                  }
                }}
                placeholder="Subcategory name..."
                className="flex-1 bg-white border border-brand-color-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-brand-color-500"
              />
              <button
                onClick={() => {
                  if (newName.trim())
                    createMutation.mutate({ name: newName.trim(), categoryId });
                }}
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
                }}
                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <DynamicIcon name="X" size={14} />
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            subcategories.map((sub) =>
              editingId === sub._id ? (
                <SubEditRow
                  key={sub._id}
                  sub={sub}
                  onSave={(name) =>
                    updateMutation.mutate({ id: sub._id, data: { name } })
                  }
                  onCancel={() => setEditingId(null)}
                  isSaving={updateMutation.isPending}
                />
              ) : (
                <SubCategoryRow
                  key={sub._id}
                  sub={sub}
                  onEdit={() => setEditingId(sub._id)}
                  onDelete={() => deleteMutation.mutate(sub._id)}
                  onDragStart={() => setDragId(sub._id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(sub._id);
                  }}
                  onDrop={() => handleDrop(sub._id)}
                  isDragging={dragId === sub._id}
                  isDragOver={dragOverId === sub._id}
                  isDeleting={deletingId === sub._id}
                  hasPermissionUpdate={
                    canAccess(admin?.role, "categories.update") ?? false
                  }
                />
              ),
            )}
        </div>
      </div>

      {subcategories.length > 1 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          {reorderMutation.isPending ? "Saving order..." : "Drag ⠿ to reorder"}
        </p>
      )}
    </div>
  );
};

export default SubcategoriesPage;
