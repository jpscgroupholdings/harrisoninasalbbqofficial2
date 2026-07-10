"use client";

import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Product } from "@/types/products";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryOption {
  _id: string;
  name: string;
}

interface GroupedProducts {
  categoryId: string;
  categoryName: string;
  products: Product[];
}

interface ProductSelectionModalProps {
  onClose: () => void;
  onConfirm: (selectedProducts: Product[]) => void;
  allProducts: Product[];
  categories: CategoryOption[];
  /** IDs already selected in the current group (pre-checked and disabled) */
  alreadySelectedIds: string[];
  loading: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal for selecting solo products to include in a modifier group.
 * Products are grouped by category with category-level and individual checkboxes.
 */
const ProductSelectionModal = ({
  onClose,
  onConfirm,
  allProducts,
  categories,
  alreadySelectedIds,
  loading,
}: ProductSelectionModalProps) => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(alreadySelectedIds),
  );

  // Only solo products are selectable (combo/set items shouldn't be nested)
  const soloProducts = useMemo(
    () => allProducts.filter((p) => p.productType === "solo"),
    [allProducts],
  );

  // Group products by category
  const groupedProducts = useMemo(() => {
    const categoryMap = new Map<string, GroupedProducts>();

    // Seed categories in order
    for (const cat of categories) {
      categoryMap.set(cat._id, {
        categoryId: cat._id,
        categoryName: cat.name
          .replace(/-/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        products: [],
      });
    }

    // Add "Uncategorized" bucket
    categoryMap.set("__uncategorized__", {
      categoryId: "__uncategorized__",
      categoryName: "Uncategorized",
      products: [],
    });

    // Distribute products into their category buckets
    for (const product of soloProducts) {
      const catId =
        product.category && typeof product.category === "object"
          ? product.category._id
          : String(product.category || "");

      const bucket = categoryMap.get(catId);
      if (bucket) {
        bucket.products.push(product);
      } else {
        // Product's category not in the ordered list — fall into uncategorized
        categoryMap.get("__uncategorized__")!.products.push(product);
      }
    }

    // Remove empty categories (no products to show)
    const result: GroupedProducts[] = [];
    for (const [, group] of categoryMap) {
      if (group.products.length > 0) {
        result.push(group);
      }
    }

    return result;
  }, [soloProducts, categories]);

  // Filter groups by search term
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedProducts;

    return groupedProducts.filter((group) => {
      const hasMatch = group.products.some((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
      // Also match category name
      const catMatch = group.categoryName
        .toLowerCase()
        .includes(search.toLowerCase());
      return hasMatch || catMatch;
    }).map((group) => ({
      ...group,
      products: search.trim()
        ? group.products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            group.categoryName.toLowerCase().includes(search.toLowerCase())
          )
        : group.products,
    }));
  }, [groupedProducts, search]);

  // Toggle a single product
  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Toggle entire category (select/deselect all visible products in that category)
  const toggleCategory = (categoryId: string) => {
    const group = filteredGroups.find((g) => g.categoryId === categoryId);
    if (!group) return;

    const ids = group.products.map((p) => p._id);
    const allSelected = ids.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  };

  // Count of newly-added selections (excluding already-selected pre-checks)
  const newlyAddedCount = useMemo(
    () =>
      soloProducts.filter(
        (p) => selectedIds.has(p._id) && !alreadySelectedIds.includes(p._id),
      ).length,
    [soloProducts, selectedIds, alreadySelectedIds],
  );

  const totalSelected = selectedIds.size;

  const handleConfirm = () => {
    const result = soloProducts.filter((p) => selectedIds.has(p._id));
    onConfirm(result);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Select Products"
      subTitle="Choose solo products to add to this modifier group"
      contentClassName="!p-0"
    >
      {/* Search bar */}
      <div className="sticky top-[72px] bg-white px-6 py-3 border-b border-slate-100 z-30">
        <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-brand-color-500">
          <DynamicIcon name="Search" size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by product or category name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <DynamicIcon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
          <DynamicIcon name="LoaderCircle" size={24} className="animate-spin" />
          <p className="text-sm">Loading products...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
          <DynamicIcon name="PackageOpen" size={28} />
          <p className="text-sm">
            {search ? "No products match your search" : "No solo products available"}
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
          {filteredGroups.map((group) => {
            const catIds = group.products.map((p) => p._id);
            const allCatSelected = catIds.every((id) => selectedIds.has(id));
            const someCatSelected = catIds.some((id) => selectedIds.has(id));
            const selectedInCat = catIds.filter((id) => selectedIds.has(id)).length;

            return (
              <div key={group.categoryId} className="space-y-2">
                {/* Category header with group checkbox */}
                <label className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={allCatSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someCatSelected && !allCatSelected;
                    }}
                    onChange={() => toggleCategory(group.categoryId)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-color-500 focus:ring-brand-color-500/30 cursor-pointer accent-[#e13500]"
                  />
                  <DynamicIcon name="FolderOpen" size={16} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    {group.categoryName}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {selectedInCat}/{group.products.length}
                  </span>
                </label>

                {/* Individual product checkboxes */}
                <div className="space-y-1 pl-2">
                  {group.products.map((product) => {
                    const isSelected = selectedIds.has(product._id);
                    const isPreSelected = alreadySelectedIds.includes(product._id);

                    return (
                      <label
                        key={product._id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition cursor-pointer
                          ${isSelected
                            ? "bg-brand-color-500/5 border border-brand-color-500/20"
                            : "hover:bg-gray-50 border border-transparent"
                          }
                          ${isPreSelected ? "opacity-60" : ""}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product._id)}
                          disabled={isPreSelected}
                          className="w-4 h-4 rounded border-gray-300 text-brand-color-500 focus:ring-brand-color-500/30 cursor-pointer accent-[#e13500]"
                        />
                        {product.image?.url && (
                          <img
                            src={product.image.url}
                            alt={product.name}
                            className="w-8 h-8 rounded-md object-cover shrink-0"
                          />
                        )}
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {product.name}
                          {isPreSelected && (
                            <span className="text-xs text-brand-color-500 ml-1">(already added)</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 font-medium">
                          ₱{product.price ?? "—"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-brand-color-500">{totalSelected}</span> selected
          {newlyAddedCount > 0 && (
            <span className="text-xs text-green-600 ml-1.5">
              (+{newlyAddedCount} new)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-color-500 rounded-lg hover:bg-[#c13500] transition cursor-pointer shadow-md"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductSelectionModal;
