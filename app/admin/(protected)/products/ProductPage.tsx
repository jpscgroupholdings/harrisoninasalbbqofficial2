"use client";

import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { TextareaField } from "@/components/ui/TextAreaField";
import { useCreateProduct, useUpdateProduct } from "@/hooks/api/useProducts";
import { toast } from "sonner";
import { Category } from "@/types/category";
import {
  IncludedItemUI,
  ITEM_TYPES,
  ProductType,
  Product,
} from "@/types/products";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { useRouter } from "next/navigation";
import { categories_api, subcategories_api } from "../categories/hooks/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageTab = "upload" | "url" | "gallery";

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

interface IncludedItem {
  product: string;
  quantity: number;
  label: string | null;
  _name?: string;
  _price?: number;
}

interface SubCategory {
  _id: string;
  name: string;
  category: string;
}

interface ProductFormData {
  name: string;
  price: string;
  image: string;
  category: string;
  subcategory: string;
  info: string;
  description: string;
  isSignature: boolean;
  isPopular: boolean;
  productType: ProductType;
  paxCount: string;
  includedItems: IncludedItemUI[];
}

interface ProductFormPageProps {
  editProduct?: Product | null;
}

// ─── Tax ──────────────────────────────────────────────────────────────────────

const TAX_RATE = 0.12;

function computeTax(totalPrice: string) {
  const total = parseFloat(totalPrice) || 0;
  if (total <= 0) return { taxable: 0, tax: 0, total: 0 };
  const taxable = total / (1 + TAX_RATE);
  const tax = total - taxable;
  return {
    taxable: parseFloat(taxable.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPE_OPTIONS: {
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

const IMAGE_TABS: { value: ImageTab; label: string; icon: React.ReactNode }[] =
  [
    {
      value: "upload",
      label: "Upload",
      icon: <DynamicIcon name="Upload" size={14} />,
    },
    { value: "url", label: "URL", icon: <DynamicIcon name="Link" size={14} /> },
    {
      value: "gallery",
      label: "Gallery",
      icon: <DynamicIcon name="Images" size={14} />,
    },
  ];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  iconName,
  children,
  className = "",
}: {
  title: string;
  iconName: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}
  >
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/70">
      <span className="text-brand-color-500">
        <DynamicIcon name={iconName} size={15} />
      </span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

// ─── Tax Breakdown UI ─────────────────────────────────────────────────────────

const TaxBreakdown = ({ price }: { price: string }) => {
  const { taxable, tax, total } = computeTax(price);
  const hasValue = total > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        hasValue
          ? "border-brand-color-500/20 bg-brand-color-500/5"
          : "border-gray-100 bg-gray-50/60"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2.5 border-b text-xs font-bold uppercase tracking-widest ${
          hasValue
            ? "border-brand-color-500/10 text-brand-color-500"
            : "border-gray-100 text-gray-400"
        }`}
      >
        <DynamicIcon name="Receipt" size={13} />
        VAT Breakdown (12%)
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Taxable Amount</span>
          <span
            className={`text-sm font-bold  ${hasValue ? "text-gray-700" : "text-gray-300"}`}
          >
            ₱
            {hasValue
              ? taxable.toLocaleString("en-PH", { minimumFractionDigits: 2 })
              : "0"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">VAT (12%)</span>
          <span
            className={`text-sm font-bold ${hasValue ? "text-brand-color-500" : "text-gray-300"}`}
          >
            ₱
            {hasValue
              ? tax.toLocaleString("en-PH", { minimumFractionDigits: 2 })
              : "0"}
          </span>
        </div>
        <div
          className={`h-px my-1 ${hasValue ? "bg-brand-color-500/15" : "bg-gray-100"}`}
        />
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-600">Total Price</span>
          <span
            className={`font-black ${hasValue ? "text-gray-800" : "text-gray-300"}`}
          >
            ₱
            {hasValue
              ? total.toLocaleString("en-PH", { minimumFractionDigits: 2 })
              : "0"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProductFormPage = ({ editProduct = null }: ProductFormPageProps) => {
  const router = useRouter();
  const isEditMode = !!editProduct;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // ── Form state ──────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    image: "",
    category: "",
    subcategory: "",
    info: "",
    description: "",
    isSignature: false,
    isPopular: false,
    productType: ITEM_TYPES.SOLO,
    paxCount: "",
    includedItems: [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // ── Image tab state ─────────────────────────────────────────────────────────

  const [activeImageTab, setActiveImageTab] = useState<ImageTab>("upload");
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string | null>(null);

  // ── Category / Subcategory state ────────────────────────────────────────────

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<SubCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState("");

  // ── Included items state ────────────────────────────────────────────────────

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSuccess = createMutation.isSuccess || updateMutation.isSuccess;
  const isComboOrSet = formData.productType !== ITEM_TYPES.SOLO;

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : selectedGalleryUrl || formData.image || null;

  // ── Init edit mode ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (editProduct) {
      const imageUrl = editProduct.image.url || "";
      setFormData({
        name: editProduct.name || "",
        price: editProduct.price?.toString() || "",
        image: imageUrl,
        category:
          typeof editProduct.category === "string"
            ? editProduct.category
            : editProduct.category?._id || "",
        subcategory:
          typeof editProduct.subcategory === "string"
            ? editProduct.subcategory
            : editProduct.subcategory?._id || "",
        info: editProduct.info || "",
        description: editProduct.description || "",
        isSignature: editProduct.isSignature || false,
        isPopular: editProduct.isPopular || false,
        productType: editProduct.productType || ITEM_TYPES.SOLO,
        paxCount: editProduct.paxCount?.toString() || "",
        includedItems:
          editProduct.includedItems?.map((item) => ({
            product:
              typeof item.product === "string"
                ? item.product
                : item.product._id,
            quantity: item.quantity,
            label: item.label,
            _name: typeof item.product === "object" ? item.product.name : "",
            _price:
              typeof item.product === "object" ? item.product.price : null,
          })) || [],
      });
      if (imageUrl.includes("cloudinary.com")) {
        setSelectedGalleryUrl(imageUrl);
        setActiveImageTab("gallery");
      } else if (imageUrl) {
        setActiveImageTab("url");
      }
    }
  }, [editProduct]);

  // ── Fetch categories ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories`);
      const data = await res.json();
      setCategories(data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  // ── Fetch subcategories ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!formData.category || showCustomCategory) {
      setFilteredSubcategories([]);
      return;
    }
    fetchSubcategories(formData.category);
  }, [formData.category]);

  const fetchSubcategories = async (categoryId: string) => {
    setLoadingSubcategories(true);
    try {
      const res = await fetch(`/api/subcategories?category=${categoryId}`);
      const data = await res.json();
      setFilteredSubcategories(data || []);
    } catch {
      toast.error("Failed to load subcategories");
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // ── Fetch Cloudinary gallery ─────────────────────────────────────────────────

  const fetchCloudinaryImages = async () => {
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      const res = await fetch("/api/cloudinary/images");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setCloudinaryImages(data?.resources || data || []);
    } catch {
      setGalleryError("Could not load gallery. Check your API route.");
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (
      activeImageTab === "gallery" &&
      cloudinaryImages.length === 0 &&
      !galleryError
    ) {
      fetchCloudinaryImages();
    }
  }, [activeImageTab]);

  // ── Server-side product search (debounced) ───────────────────────────────────

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!itemSearch.trim()) {
      setSearchResults([]);
      setShowItemDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(itemSearch)}&limit=20&productType=${ITEM_TYPES.SOLO}`
        );
        const data = await res.json();
        const results: Product[] = data?.data || data || [];

        // Filter out already-added items client-side (small list, safe)
        const addedIds = new Set(formData.includedItems.map((i) => i.product));
        setSearchResults(results.filter((p) => !addedIds.has(p._id)));
        setShowItemDropdown(true);
      } catch {
        toast.error("Failed to search products");
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [itemSearch]);

  // ── Close dropdown on outside click ─────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Tab switch ───────────────────────────────────────────────────────────────

  const handleTabSwitch = (tab: ImageTab) => {
    setActiveImageTab(tab);
    if (tab !== "upload") setImageFile(null);
    if (tab !== "url") setFormData((prev) => ({ ...prev, image: "" }));
    if (tab !== "gallery") setSelectedGalleryUrl(null);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__add_new__") {
      setShowCustomCategory(true);
      setFormData((prev) => ({ ...prev, category: "", subcategory: "" }));
    } else {
      setShowCustomCategory(false);
      setFormData((prev) => ({ ...prev, category: value, subcategory: "" }));
      setShowCustomSubcategory(false);
      setCustomSubcategory("");
    }
  };

  const handleSubcategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__add_new__") {
      setShowCustomSubcategory(true);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
    } else {
      setShowCustomSubcategory(false);
      setFormData((prev) => ({ ...prev, subcategory: value }));
    }
  };

  const handleProductTypeChange = (type: ProductType) => {
    setFormData((prev) => ({
      ...prev,
      productType: type,
      includedItems: type === ITEM_TYPES.SOLO ? [] : prev.includedItems,
      paxCount: type !== ITEM_TYPES.SET ? "" : prev.paxCount,
    }));
    // Clear search state when switching away from combo/set
    if (type === ITEM_TYPES.SOLO) {
      setItemSearch("");
      setSearchResults([]);
      setShowItemDropdown(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Image must be under 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.warning("Only images are allowed!");
        return;
      }
      setImageFile(file);
    }
  };

  const handleGallerySelect = (img: CloudinaryImage) => {
    setSelectedGalleryUrl(img.secure_url);
  };

  // ── Included items ────────────────────────────────────────────────────────────

  const addIncludedItem = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: [
        ...prev.includedItems,
        {
          product: product._id,
          quantity: 1,
          label: null,
          _name: product.name,
          _price: product.price,
        },
      ],
    }));
    setItemSearch("");
    setSearchResults([]);
    setShowItemDropdown(false);
  };

  const removeIncludedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: prev.includedItems.filter((_, i) => i !== index),
    }));
  };

  const updateIncludedItem = (
    index: number,
    field: keyof IncludedItem,
    value: string | number | null
  ) => {
    setFormData((prev) => {
      const updated = [...prev.includedItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, includedItems: updated };
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      let imageData =
        activeImageTab === "gallery"
          ? selectedGalleryUrl || ""
          : activeImageTab === "url"
            ? formData.image
            : "";

      let categoryId = formData.category;
      let subcategoryId = formData.subcategory || null;

      if (activeImageTab === "upload" && imageFile) {
        imageData = await fileToBase64(imageFile);
      }

      if (!imageData)
        throw new Error("Please provide an image via upload, URL, or gallery");

      if (showCustomCategory && customCategory) {
        const newCat = await categories_api.create({
          name: customCategory
        });
        categoryId = newCat?._id;
      }

      if (showCustomSubcategory && customSubcategory && categoryId) {
        const newSub = await subcategories_api.create({name: customSubcategory, categoryId});
        subcategoryId = newSub._id;
      }

      const payload = {
        name: formData.name,
        info: formData.info,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        image: imageData.startsWith("https") ? imageData : undefined,
        imageFile: imageData.startsWith("data:") ? imageData : undefined,
        category: categoryId,
        subcategory: subcategoryId,
        isSignature: formData.isSignature,
        isPopular: formData.isPopular,
        productType: formData.productType,
        paxCount: formData.paxCount ? parseInt(formData.paxCount) : null,
        includedItems: isComboOrSet
          ? formData.includedItems.map(({ product, quantity, label }) => ({
              product,
              quantity,
              label,
            }))
          : [],
      };

      if (isEditMode && editProduct) {
        await updateMutation.mutateAsync({ id: editProduct._id, data: payload });
        toast.success("Updated successfully!");
        router.back();
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Created successfully!");
        router.back();
      }
    } catch (error) {}
  };

  // ── Gallery filtered ──────────────────────────────────────────────────────────

  const filteredGalleryImages = cloudinaryImages.filter((img) =>
    img.public_id.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* ── Sticky Page Header ── */}
      <header className="sticky top-20 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              Products &rsaquo;{" "}
              <span className="text-brand-color-500 font-semibold">
                {isEditMode ? "Edit Product" : "New Product"}
              </span>
            </p>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
              {isEditMode ? `Edit: ${editProduct?.name}` : "Add New Product"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-color-500 hover:bg-[#c13500] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition shadow-md hover:shadow-lg active:scale-95"
            >
              {isLoading ? (
                <>
                  <DynamicIcon name="LoaderCircle" size={15} className="animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <DynamicIcon name="Save" size={15} />
                  {isEditMode ? "Save Changes" : "Create Product"}
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <form id="product-form" onSubmit={handleSubmit}>
        <div className="mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ════════════════════════════════════════
                LEFT COLUMN (col-span-2)
            ════════════════════════════════════════ */}
            <div className="lg:col-span-2 space-y-6">
              {/* ── Identity ── */}
              <SectionCard title="Product Identity" iconName="Beef">
                {/* Name */}
                <InputField
                  label="Product Name"
                  leftIcon={<DynamicIcon name="Beef" size={18} />}
                  placeholder="e.g., Pork Sinigang"
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleProductTypeChange(opt.value)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 cursor-pointer
                          ${
                            formData.productType === opt.value
                              ? "border-brand-color-500 bg-brand-color-500/10 text-brand-color-500"
                              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal text-center leading-tight opacity-70">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category + Subcategory side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label
                      htmlFor="categorySelect"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Category <span className="text-red-500">*</span>
                    </label>
                    {loadingCategories ? (
                      <div className="px-4 py-3 border border-gray-300 rounded-xl text-gray-400 text-sm">
                        Loading categories...
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            id="categorySelect"
                            onChange={handleCategoryChange}
                            value={
                              showCustomCategory ? "__add_new__" : formData.category
                            }
                            required={!showCustomCategory}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-color-500 focus:border-brand-color-500/20 outline-none transition cursor-pointer appearance-none"
                          >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name
                                  .replace(/-/g, " ")
                                  .split(" ")
                                  .map(
                                    (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                  )
                                  .join(" ")}
                              </option>
                            ))}
                            <option value="__add_new__">＋ Add New Category</option>
                          </select>
                          <DynamicIcon
                            name="ChevronDown"
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                        {showCustomCategory && (
                          <div className="mt-2">
                            <InputField
                              label="New Category Name"
                              type="text"
                              value={customCategory}
                              onChange={(e) => {
                                setCustomCategory(e.target.value);
                                setFormData((prev) => ({
                                  ...prev,
                                  category: e.target.value,
                                }));
                              }}
                              required
                              placeholder='e.g., "Desserts"'
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subcategory{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        (optional)
                      </span>
                    </label>
                    {loadingSubcategories ? (
                      <div className="px-4 py-3 border border-gray-300 rounded-xl text-gray-400 text-sm">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            onChange={handleSubcategoryChange}
                            value={
                              showCustomSubcategory
                                ? "__add_new__"
                                : formData.subcategory
                            }
                            disabled={!formData.category && !showCustomCategory}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-color-500 focus:border-brand-color-500/20 outline-none transition cursor-pointer appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            <option value="">No subcategory</option>
                            {filteredSubcategories.map((sub) => (
                              <option key={sub._id} value={sub._id}>
                                {sub.name}
                              </option>
                            ))}
                            <option value="__add_new__">
                              ＋ Add New Subcategory
                            </option>
                          </select>
                          <DynamicIcon
                            name="ChevronDown"
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
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
                      </>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* ── Descriptions ── */}
              <SectionCard title="Descriptions" iconName="FileText">
                <TextareaField
                  label="Product Info"
                  placeholder="e.g. Crispy fried chicken with rice and salad"
                  name="info"
                  value={formData.info}
                  onChange={handleChange}
                />
                <TextareaField
                  label="Product Description"
                  placeholder="e.g. Our signature crispy fried chicken, marinated in our secret blend of 12 spices for 24 hours…"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </SectionCard>

              {/* ── Included Items (combo / set) ── */}
              {isComboOrSet && (
                <SectionCard title="Included Items" iconName="ListChecks">
                  <div>
                    {/* Search box */}
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-brand-color-500">
                        {loadingSearch ? (
                          <DynamicIcon
                            name="LoaderCircle"
                            size={16}
                            className="text-gray-400 shrink-0 animate-spin"
                          />
                        ) : (
                          <DynamicIcon
                            name="Search"
                            size={16}
                            className="text-gray-400 shrink-0"
                          />
                        )}
                        <input
                          type="text"
                          placeholder="Search products to add..."
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          onFocus={() => {
                            if (searchResults.length > 0) setShowItemDropdown(true);
                          }}
                          className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 text-gray-800"
                        />
                        {itemSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setItemSearch("");
                              setSearchResults([]);
                              setShowItemDropdown(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <DynamicIcon name="X" size={14} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown */}
                      {showItemDropdown && itemSearch && (
                        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                          {loadingSearch ? (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                              <DynamicIcon
                                name="LoaderCircle"
                                size={14}
                                className="animate-spin"
                              />
                              Searching...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400">
                              No matching products found
                            </p>
                          ) : (
                            searchResults.map((p) => (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => addIncludedItem(p)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 text-left transition"
                              >
                                <span className="font-medium text-gray-800">
                                  {p.name}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  ₱{p.price}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Added items */}
                    {formData.includedItems.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.includedItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                              {item._name || item.product}
                            </span>
                            <input
                              type="text"
                              placeholder="Label (optional)"
                              value={item.label || ""}
                              onChange={(e) =>
                                updateIncludedItem(
                                  index,
                                  "label",
                                  e.target.value || null
                                )
                              }
                              className="w-32 text-xs px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-brand-color-500"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  updateIncludedItem(
                                    index,
                                    "quantity",
                                    Math.max(1, item.quantity - 1)
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
                                  updateIncludedItem(
                                    index,
                                    "quantity",
                                    item.quantity + 1
                                  )
                                }
                                className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition"
                              >
                                ＋
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeIncludedItem(index)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <DynamicIcon name="Trash2" size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.includedItems.length === 0 && !itemSearch && (
                      <p className="mt-2 text-xs text-gray-400">
                        No items added yet. Search above to include products.
                      </p>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* ── Image Section ── */}
              <SectionCard title="Product Image" iconName="ImagePlus">
                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-2">
                  {IMAGE_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => handleTabSwitch(tab.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer
                        ${
                          activeImageTab === tab.value
                            ? "bg-white text-brand-color-500 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Upload */}
                {activeImageTab === "upload" && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">
                    <InputField
                      subLabel="Upload (Max 5MB)"
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      required={!previewUrl}
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-color-500/20 file:text-brand-color-500 hover:file:bg-brand-color-500/30 cursor-pointer"
                    />
                    {imageFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {imageFile.name} (
                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {/* URL */}
                {activeImageTab === "url" && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">
                    <InputField
                      subLabel="Paste any image URL"
                      type="url"
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      required={!previewUrl}
                      placeholder="https://example.com/image.jpg"
                      leftIcon={<DynamicIcon name="Link" size={16} />}
                    />
                  </div>
                )}

                {/* Gallery */}
                {activeImageTab === "gallery" && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500">
                        {cloudinaryImages.length > 0
                          ? `${cloudinaryImages.length} image${cloudinaryImages.length !== 1 ? "s" : ""} in your Cloudinary`
                          : "Your uploaded Cloudinary images"}
                      </p>
                      <button
                        type="button"
                        onClick={fetchCloudinaryImages}
                        disabled={loadingGallery}
                        className="flex items-center gap-1 text-xs text-brand-color-500 hover:text-brand-color-600 font-medium disabled:opacity-50 transition"
                      >
                        <DynamicIcon
                          name="RefreshCcw"
                          size={12}
                          className={loadingGallery ? "animate-spin" : ""}
                        />
                        Refresh
                      </button>
                    </div>

                    {cloudinaryImages.length > 0 && (
                      <div className="mb-4">
                        <InputField
                          type="text"
                          placeholder="Search by filename..."
                          value={gallerySearch}
                          onChange={(e) => setGallerySearch(e.target.value)}
                          leftIcon={
                            <DynamicIcon
                              name="Search"
                              size={14}
                              className="text-gray-400 shrink-0"
                            />
                          }
                          rightElement={
                            gallerySearch && (
                              <button
                                type="button"
                                onClick={() => setGallerySearch("")}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <DynamicIcon name="X" size={12} />
                              </button>
                            )
                          }
                        />
                      </div>
                    )}

                    {loadingGallery ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                        <DynamicIcon
                          name="LoaderCircle"
                          size={24}
                          className="animate-spin"
                        />
                        <p className="text-sm">Loading gallery...</p>
                      </div>
                    ) : galleryError ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <p className="text-sm text-red-500">{galleryError}</p>
                        <button
                          type="button"
                          onClick={fetchCloudinaryImages}
                          className="text-xs text-brand-color-500 underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : filteredGalleryImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-1 text-gray-400">
                        <DynamicIcon name="Images" size={28} />
                        <p className="text-sm">
                          {gallerySearch
                            ? "No images match your search"
                            : "No images found in Cloudinary"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto pr-1">
                        {filteredGalleryImages.map((img) => {
                          const isSelected = selectedGalleryUrl === img.secure_url;
                          return (
                            <button
                              key={img.public_id}
                              type="button"
                              onClick={() => handleGallerySelect(img)}
                              className={`relative h-48 w-full rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer group
                                ${isSelected ? "border-brand-color-500 ring-2 ring-brand-color-500/30" : "border-gray-200 hover:border-gray-400"}`}
                            >
                              <img
                                src={img.secure_url}
                                alt={img.public_id}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-brand-color-500/20 flex items-center justify-center">
                                  <DynamicIcon
                                    name="CheckCircle2"
                                    size={22}
                                    className="text-brand-color-500 drop-shadow"
                                  />
                                </div>
                              )}
                              {!isSelected && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-1">
                                  <p className="text-white text-[9px] leading-tight truncate w-full">
                                    {img.public_id.split("/").pop()}
                                  </p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedGalleryUrl && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-color-500/10 border border-brand-color-500/30 rounded-xl">
                        <DynamicIcon
                          name="CheckCircle2"
                          size={14}
                          className="text-brand-color-500 shrink-0"
                        />
                        <p className="text-xs text-brand-color-500 font-medium truncate flex-1">
                          Image selected from gallery
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryUrl(null)}
                          className="text-brand-color-500 hover:text-brand-color-600 shrink-0"
                        >
                          <DynamicIcon name="X" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ════════════════════════════════════════
                RIGHT COLUMN (col-span-1)
            ════════════════════════════════════════ */}
            <div className="space-y-6">
              {/* ── Pricing & Tax ── */}
              <SectionCard title="Pricing" iconName="Tag">
                <div>
                  <InputField
                    label="Selling Price (₱)"
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    leftIcon={<DynamicIcon name="DollarSign" />}
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <TaxBreakdown price={formData.price} />
                <p className="flex items-start gap-1.5 text-[11px] text-gray-400 leading-relaxed">
                  <DynamicIcon name="Info" size={11} className="mt-0.5 shrink-0" />
                  Selling price is VAT-inclusive. Tax is back-computed at 12%.
                </p>
              </SectionCard>

              {/* ── Pax Count (set only) ── */}
              {formData.productType === "set" && (
                <SectionCard title="Set Details" iconName="Users">
                  <InputField
                    label="Pax Count"
                    placeholder="e.g., 4"
                    type="number"
                    id="paxCount"
                    name="paxCount"
                    value={formData.paxCount}
                    onChange={handleChange}
                  />
                </SectionCard>
              )}

              {/* ── Visibility Toggles ── */}
              <SectionCard title="Visibility & Badges" iconName="Sparkles">
                {/* Signature */}
                <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Signature Product
                    </p>
                    <p className="text-xs text-gray-500">
                      Appears in "Our Signature Products" section
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isSignature"
                      checked={formData.isSignature}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-brand-color-500 transition" />
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5" />
                  </label>
                </div>

                {/* Popular */}
                <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Popular Item
                    </p>
                    <p className="text-xs text-gray-500">
                      Highlights this product as a best-seller
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={formData.isPopular}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-brand-color-500 transition" />
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5" />
                  </label>
                </div>
              </SectionCard>

              {/* ── Success status ── */}
              {isSuccess && (
                <div className="p-4 rounded-xl font-medium bg-green-50 text-green-700 border border-green-200 text-sm">
                  ✓ Product {isEditMode ? "updated" : "created"} successfully!
                </div>
              )}

              {/* ── Image Preview ── */}
              {previewUrl && (
                <div className="bg-white sticky top-48 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                    <span className="text-brand-color-500">
                      <DynamicIcon name="Eye" size={15} />
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Preview
                    </h2>
                  </div>
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="h-60 aspect-square object-contain place-self-center"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x300?text=Invalid+Image";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;