import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { InputField } from "@/components/ui/InputField";
import Modal from "@/components/ui/Modal";
import {
  Beef,
  Layers,
  Link,
  LoaderCircle,
  Search,
  Trash2,
  X,
  ChevronDown,
  Package,
  Utensils,
  Star,
  Upload,
  Images,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/api/useProducts";
import { Category, IncludedItemUI, Product } from "@/types/adminType";
import { toast } from "sonner";
import { TextareaField } from "@/components/ui/TextAreaField";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType = "solo" | "combo" | "set";
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

interface ProductsModalProps {
  setIsModalOpen: (value: boolean) => void;
  editProduct?: Product | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPE_OPTIONS: {
  value: ProductType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "solo",
    label: "Solo",
    description: "Single ala-carte item",
    icon: <Utensils size={16} />,
  },
  {
    value: "combo",
    label: "Combo",
    description: "Bundled meal with drink",
    icon: <Package size={16} />,
  },
  {
    value: "set",
    label: "Set",
    description: "Group / sharing platter",
    icon: <Star size={16} />,
  },
];

const IMAGE_TABS: { value: ImageTab; label: string; icon: React.ReactNode }[] =
  [
    { value: "upload", label: "Upload", icon: <Upload size={14} /> },
    { value: "url", label: "URL", icon: <Link size={14} /> },
    { value: "gallery", label: "Gallery", icon: <Images size={14} /> },
  ];

// ─── Component ────────────────────────────────────────────────────────────────

const ProductsModal = ({
  setIsModalOpen,
  editProduct = null,
}: ProductsModalProps) => {
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
    productType: "solo",
    paxCount: "",
    includedItems: [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // ── Image tab state ─────────────────────────────────────────────────────────

  const [activeImageTab, setActiveImageTab] = useState<ImageTab>("upload");
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>(
    [],
  );
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string | null>(
    null,
  );

  // ── Category / Subcategory state ────────────────────────────────────────────

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    SubCategory[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState("");

  // ── Included items state ────────────────────────────────────────────────────

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSuccess = createMutation.isSuccess || updateMutation.isSuccess;
  const isComboOrSet = formData.productType !== "solo";

  // Active preview URL — whichever source is active
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
        category: editProduct.category._id || "",
        subcategory: editProduct.subcategory?._id || "",
        info: editProduct.info || "",
        description: editProduct.description || "",
        isSignature: editProduct.isSignature || false,
        isPopular: editProduct.isPopular || false,
        productType: editProduct.productType || "solo",
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
      // If existing image URL looks like Cloudinary, pre-select gallery tab
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

  // ── Fetch subcategories when category changes ────────────────────────────────

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
      // Support both { resources: [] } and a plain array
      setCloudinaryImages(data?.resources || data || []);
    } catch (err) {
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

  // ── Fetch solo products for includedItems picker ─────────────────────────────

  useEffect(() => {
    if (isComboOrSet && allProducts.length === 0) {
      fetchAllProducts();
    }
  }, [isComboOrSet]);

  const fetchAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products`);
      const data = await res.json();
      setAllProducts(data?.products || data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // ── Tab switch handler ───────────────────────────────────────────────────────

  const handleTabSwitch = (tab: ImageTab) => {
    setActiveImageTab(tab);
    // Clear the other sources so only the active tab contributes
    if (tab !== "upload") setImageFile(null);
    if (tab !== "url") setFormData((prev) => ({ ...prev, image: "" }));
    if (tab !== "gallery") setSelectedGalleryUrl(null);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
      includedItems: type === "solo" ? [] : prev.includedItems,
      paxCount: type !== "set" ? "" : prev.paxCount,
    }));
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

  const filteredProducts = allProducts.filter((p) => {
    const alreadyAdded = formData.includedItems.some(
      (i) => i.product === p._id,
    );
    const matchesSearch = p.name
      .toLowerCase()
      .includes(itemSearch.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

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
    value: string | number | null,
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
      // Resolve final image data from whichever tab is active
      let imageData =
        activeImageTab === "gallery"
          ? selectedGalleryUrl || ""
          : activeImageTab === "url"
            ? formData.image
            : ""; // will be replaced by base64 below

      let categoryId = formData.category;
      let subcategoryId = formData.subcategory || null;

      if (activeImageTab === "upload" && imageFile) {
        imageData = await fileToBase64(imageFile);
      }

      if (!imageData) {
        throw new Error("Please provide an image via upload, URL, or gallery");
      }

      // Create new category if needed
      if (showCustomCategory && customCategory) {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customCategory }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to create category");
          return;
        }
        const newCat = await res.json();
        categoryId = newCat._id;
      }

      // Create new subcategory if needed
      if (showCustomSubcategory && customSubcategory && categoryId) {
        const res = await fetch("/api/subcategories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customSubcategory,
            category: categoryId,
          }),
        });
        const newSub = await res.json();
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
              label: label || null,
            }))
          : [],
      };

      if (isEditMode && editProduct) {
        await updateMutation.mutateAsync({
          id: editProduct._id,
          data: payload,
        });
        toast.success("Updated successfully!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Created successfully!");
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Mutation error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Gallery filtered images ───────────────────────────────────────────────────

  const filteredGalleryImages = cloudinaryImages.filter((img) =>
    img.public_id.toLowerCase().includes(gallerySearch.toLowerCase()),
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      onClose={() => setIsModalOpen(false)}
      title={isEditMode ? "Edit Product" : "Add New Product"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Product Name ── */}
        <InputField
          label="Product Name"
          leftIcon={<Beef size={18} />}
          placeholder="e.g., Pork Sinigang"
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* ── Product Type ── */}
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
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 text-sm font-semibold transition-all duration-150 cursor-pointer
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

        {/* ── Category ── */}
        <div>
          <label
            htmlFor="categorySelect"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Category <span className="text-red-500">*</span>
          </label>
          {loadingCategories ? (
            <div className="px-4 py-3 border border-gray-300 rounded-lg text-gray-400 text-sm">
              Loading categories...
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  id="categorySelect"
                  onChange={handleCategoryChange}
                  value={showCustomCategory ? "__add_new__" : formData.category}
                  required={!showCustomCategory}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-color-500 focus:border-brand-color-500/20 outline-none transition cursor-pointer appearance-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name
                        .replace(/-/g, " ")
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                  <option value="__add_new__">＋ Add New Category</option>
                </select>
                <ChevronDown
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
                    placeholder='e.g., "Desserts", "Full Plates"'
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Subcategory ── */}
        {(formData.category || showCustomCategory) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subcategory{" "}
              <span className="text-gray-400 font-normal text-xs">
                (optional)
              </span>
            </label>
            {loadingSubcategories ? (
              <div className="px-4 py-3 border border-gray-300 rounded-lg text-gray-400 text-sm">
                Loading subcategories...
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-color-500 focus:border-brand-color-500/20 outline-none transition cursor-pointer appearance-none"
                  >
                    <option value="">No subcategory</option>
                    {filteredSubcategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                    <option value="__add_new__">＋ Add New Subcategory</option>
                  </select>
                  <ChevronDown
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
                      placeholder='e.g., "Ala-Carte", "Solo Meals"'
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Price ── */}
        <InputField
          label="Price (₱)"
          placeholder="0.00"
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        {/* ── Pax Count (set only) ── */}
        {formData.productType === "set" && (
          <InputField
            label="Pax Count"
            placeholder="e.g., 4"
            type="number"
            id="paxCount"
            name="paxCount"
            value={formData.paxCount}
            onChange={handleChange}
          />
        )}

        {/* ── Included Items (combo / set) ── */}
        {isComboOrSet && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Included Items{" "}
              <span className="text-gray-400 font-normal text-xs">
                (search & add products)
              </span>
            </label>

            {/* Search box */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-brand-color-500">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={
                    loadingProducts
                      ? "Loading products..."
                      : "Search solo products to add..."
                  }
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  disabled={loadingProducts}
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                />
                {itemSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setItemSearch("");
                      setShowItemDropdown(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showItemDropdown && itemSearch && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">
                      No matching products found
                    </p>
                  ) : (
                    filteredProducts.slice(0, 10).map((p) => (
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

            {/* Added items list */}
            {formData.includedItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.includedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
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
                          e.target.value || null,
                        )
                      }
                      className="w-32 text-xs px-2 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-color-500"
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateIncludedItem(
                            index,
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
                          updateIncludedItem(
                            index,
                            "quantity",
                            item.quantity + 1,
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
                      <Trash2 size={15} />
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
        )}

        {/* ── Image Section (tabbed) ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Image <span className="text-red-500">*</span>
          </label>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
            {IMAGE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabSwitch(tab.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer
                  ${
                    activeImageTab === tab.value
                      ? "bg-white text-brand-color-500 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Upload ── */}
          {activeImageTab === "upload" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5">
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

          {/* ── Tab: URL ── */}
          {activeImageTab === "url" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5">
              <InputField
                subLabel="Paste any image URL"
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                required={!previewUrl}
                placeholder="https://example.com/image.jpg"
                leftIcon={<Link size={16} />}
              />
            </div>
          )}

          {/* ── Tab: Gallery ── */}
          {activeImageTab === "gallery" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* Gallery header */}
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
                  <RefreshCw
                    size={12}
                    className={loadingGallery ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {/* Search */}
              {cloudinaryImages.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg mb-3 focus-within:ring-2 focus-within:ring-brand-color-500">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by filename..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                  />
                  {gallerySearch && (
                    <button
                      type="button"
                      onClick={() => setGallerySearch("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* States */}
              {loadingGallery ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <LoaderCircle size={24} className="animate-spin" />
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
                  <Images size={28} />
                  <p className="text-sm">
                    {gallerySearch
                      ? "No images match your search"
                      : "No images found in Cloudinary"}
                  </p>
                </div>
              ) : (
                /* Image grid */
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredGalleryImages.map((img) => {
                    const isSelected = selectedGalleryUrl === img.secure_url;
                    return (
                      <button
                        key={img.public_id}
                        type="button"
                        onClick={() => handleGallerySelect(img)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer group
                          ${
                            isSelected
                              ? "border-brand-color-500 ring-2 ring-brand-color-500/30"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                      >
                        <img
                          src={img.secure_url}
                          alt={img.public_id}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Selected overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand-color-500/20 flex items-center justify-center">
                            <CheckCircle2
                              size={22}
                              className="text-brand-color-500 drop-shadow"
                            />
                          </div>
                        )}
                        {/* Hover overlay with filename */}
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

              {/* Selected image info */}
              {selectedGalleryUrl && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-color-500/10 border border-brand-color-500/30 rounded-lg">
                  <CheckCircle2
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
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Image Preview ── */}
        {previewUrl && (
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full max-w-md h-56 object-cover rounded-lg mx-auto shadow-sm"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/400x300?text=Invalid+Image";
              }}
            />
          </div>
        )}

        <div>
          <TextareaField
            label="Product Info"
            placeholder="e.g. Crispy fried chicken with rice and salad"
            name="info"
            value={formData.info}
            onChange={handleChange}
          />
          <TextareaField
            label="Product Description"
            placeholder="e.g. Our signature crispy fried chicken, marinated in our secret blend of 12 spices for 24 hours. Served with jasmine rice and fresh garden salad. Includes your choice of beverage. Available as 2-piece, 4-piece, or 6-piece."
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* ── Toggles ── */}
        <div className="space-y-3">
          {/* Signature */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
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
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
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
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-color-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#c13500] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoaderCircle size={18} className="animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </span>
          ) : (
            `✓ ${isEditMode ? "Update Product" : "Create Product"}`
          )}
        </button>
      </form>

      {/* Status */}
      {isSuccess && (
        <div className="mt-4 p-4 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">
          ✓ Product {isEditMode ? "updated" : "created"} successfully!
        </div>
      )}

      {!loadingCategories && categories.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}{" "}
          available
        </div>
      )}
    </Modal>
  );
};

export default ProductsModal;
