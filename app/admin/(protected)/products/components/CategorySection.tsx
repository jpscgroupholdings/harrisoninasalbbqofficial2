"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { SelectField, InputField } from "@/components/ui/FormComponents";
import { Category, SubCategory } from "@/types/category";
import { ProductSectionCard } from "./ProductSectionCard";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategorySelectionState {
  categoryId: string;
  subcategoryId: string;
  showCustomCategory: boolean;
  customCategory: string;
  showCustomSubcategory: boolean;
  customSubcategory: string;
  categories: Category[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategorySectionProps {
  /** Pre-selected category ID when editing a product */
  initialCategoryId?: string;
  /** Pre-selected subcategory ID when editing a product */
  initialSubcategoryId?: string;
  /** Callback fired whenever the category selection state changes */
  onCategoryStateChange: (state: CategorySelectionState) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const CategorySection = ({
  initialCategoryId,
  initialSubcategoryId,
  onCategoryStateChange,
}: CategorySectionProps) => {
  // ── Category / Subcategory state ─────────────────────────────────────────────

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    SubCategory[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState("");

  // ── Report state back to parent whenever it changes ──────────────────────────

  useEffect(() => {
    onCategoryStateChange({
      categoryId,
      subcategoryId,
      showCustomCategory,
      customCategory,
      showCustomSubcategory,
      customSubcategory,
      categories,
    });
  }, [
    categoryId,
    subcategoryId,
    showCustomCategory,
    customCategory,
    showCustomSubcategory,
    customSubcategory,
    categories,
  ]);

  // ── Init edit mode ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialCategoryId) {
      setCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  // After categories load and we have an initial subcategory, set it
  useEffect(() => {
    if (initialSubcategoryId && filteredSubcategories.length > 0) {
      setSubcategoryId(initialSubcategoryId);
    }
  }, [filteredSubcategories, initialSubcategoryId]);

  // ── Fetch categories on mount ────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get<Category[]>("/categories");
      setCategories(data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  // ── Fetch subcategories when category changes ────────────────────────────────

  useEffect(() => {
    if (!categoryId && !showCustomCategory) {
      setFilteredSubcategories([]);
      return;
    }
    if (showCustomCategory) {
      // No subcategories to fetch for a new (unsaved) category
      setFilteredSubcategories([]);
      return;
    }
    fetchSubcategories(categoryId);
  }, [categoryId, showCustomCategory]);

  const fetchSubcategories = async (catId: string) => {
    setLoadingSubcategories(true);
    try {
      const data = await apiClient.get<SubCategory[]>(
        `/subcategories?category=${catId}`,
      );
      setFilteredSubcategories(data || []);
    } catch {
      toast.error("Failed to load subcategories");
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__add_new__") {
      setShowCustomCategory(true);
      setCategoryId("");
      setSubcategoryId("");
    } else {
      setShowCustomCategory(false);
      setCategoryId(value);
      setSubcategoryId("");
      setShowCustomSubcategory(false);
      setCustomSubcategory("");
    }
  };

  const handleSubcategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__add_new__") {
      setShowCustomSubcategory(true);
      setSubcategoryId("");
    } else {
      setShowCustomSubcategory(false);
      setSubcategoryId(value);
    }
  };

  const handleCustomCategoryInput = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(e.target.value);
    setCategoryId(e.target.value); // allow subcategory to be enabled while typing
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProductSectionCard title="Category & Subcategory" iconName="FolderTree">
      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <SelectField
            label="Category"
            subLabel="Select category of this product"
            id="categorySelect"
            onChange={handleCategoryChange}
            value={showCustomCategory ? "__add_new__" : categoryId}
            required={!showCustomCategory}
            options={
              loadingCategories
                ? [
                    {
                      label: "Loading categories",
                      value: "",
                      disabled: true,
                    },
                  ]
                : [
                    {
                      label: "Select Category",
                      value: "",
                      disabled: true,
                    },
                    ...categories.map((cat) => ({
                      label: cat.name
                        .replace(/-/g, " ")
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" "),
                      value: cat._id,
                    })),
                    {
                      label: " ＋ Add New Category",
                      value: "__add_new__",
                    },
                  ]
            }
            disabled={loadingCategories}
          />
          {showCustomCategory && (
            <div className="mt-2">
              <InputField
                label="New Category Name"
                type="text"
                value={customCategory}
                onChange={handleCustomCategoryInput}
                required
                placeholder='e.g., "Desserts"'
              />
            </div>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <SelectField
            label="SubCategory"
            subLabel="Select subcategory of this product"
            onChange={handleSubcategoryChange}
            value={showCustomSubcategory ? "__add_new__" : subcategoryId}
            disabled={!categoryId && !showCustomCategory}
            options={
              loadingSubcategories
                ? [
                    {
                      label: "Loading categories",
                      value: "",
                      disabled: true,
                    },
                  ]
                : [
                    {
                      label: "No subcategory",
                      value: "",
                      disabled: true,
                    },
                    ...filteredSubcategories.map((sub) => ({
                      label: sub.name,
                      value: sub._id,
                    })),
                    {
                      label: " ＋ Add New Subcategory",
                      value: "__add_new__",
                    },
                  ]
            }
          />
          {showCustomSubcategory && (
            <div className="mt-2">
              <InputField
                label="New Subcategory Name"
                type="text"
                value={customSubcategory}
                onChange={(e) => setCustomSubcategory(e.target.value)}
                required
                placeholder='e.g., "Ala-Carte"'
              />
            </div>
          )}
        </div>
      </div>
    </ProductSectionCard>
  );
};

export default CategorySection;
