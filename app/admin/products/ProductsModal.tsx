import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { InputField } from "@/components/ui/InputField";
import Modal from "@/components/ui/Modal";
import { Beef, DollarSign, Layers, Link } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/api/useProducts";
import { Category, Product } from "@/types/adminType";
import { toast } from "sonner";

interface ProductFormData {
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  stock: string;
  isSignature: boolean
}

interface ProductsModalProps {
  setIsModalOpen: (value: boolean) => void;
  editProduct?: Product | null;
}

const ProductsModal = ({
  setIsModalOpen,
  editProduct = null,
}: ProductsModalProps) => {
  const isEditMode = !!editProduct;

  // USE THE MUTATIONS
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    stock: "",
    isSignature: false
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Loading/error states come from mutations
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = (createMutation.error as any) || (updateMutation.error as any);
  const isSuccess = createMutation.isSuccess || updateMutation.isSuccess;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || "",
        price: editProduct.price.toString() || "",
        description: editProduct.description || "",
        image: editProduct.image.url || "",
        category: editProduct.category._id || "",
        stock: editProduct.stock.toString() || "",
        isSignature: editProduct.isSignature || false
      });
    }
  }, [editProduct]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`api/categories`);
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to fetch categories: ", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {

    const {name, value, type} = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "__add_new__") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setShowCustomCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  const handleCustomCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData({ ...formData, category: value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        return;
      }

      setImageFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let imageData = formData.image;
      let categoryId = formData.category;

      if (imageFile) {
        imageData = await fileToBase64(imageFile);
      }

      if (!imageData) {
        throw new Error("Please provide an image URL or upload an image");
      }

      if (showCustomCategory && customCategory) {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customCategory }),
        });

        const newCat = await res.json();
        categoryId = newCat._id;
      }

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        image: imageData.startsWith("https") ? imageData : undefined,
        imageFile: imageData.startsWith("data:") ? imageData : undefined,
        category: categoryId,
        stock: parseFloat(formData.stock),
        isSignature: formData.isSignature
      };

      if (isEditMode && editProduct) {
        // USE THE UPDATE MUTATION
        await updateMutation.mutateAsync({
          id: editProduct._id,
          data: payload,
        });

        toast.success("Update Successfully!");
      } else {
        // USE THE CREATE MUTATION
        await createMutation.mutateAsync(payload);
        toast.success("Created Successfull!");
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Mutation error:", error);
    }
  };

  return (
    <div>
      <Modal
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
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

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ef4501] focus:border-[#ef4501]/20 outline-none transition"
              placeholder="Describe your dish in detail..."
            />
          </div>

          {/* Category (Dynamic) */}
          <div>
            <label
              htmlFor="categorySelect"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Category <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="px-4 py-3 border border-gray-300 rounded-lg text-gray-500">
                Loading categories...
              </div>
            ) : (
              <>
                <select
                  id="categorySelect"
                  onChange={handleCategoryChange}
                  value={showCustomCategory ? "__add_new__" : formData.category}
                  required={!showCustomCategory}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ef4501] focus:border-[#ef4501]/20 outline-none transition cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name
                        .replace(/-/g, " ")
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </option>
                  ))}
                  <option
                    value="__add_new__"
                    className="text-[#ef4501] semi-font-bold"
                  >
                    Add New Category +{" "}
                  </option>
                </select>
                {showCustomCategory && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={handleCustomCategoryChange}
                      required
                      placeholder="Enter new category name"
                      className="w-full px-4 py-3 border border-[#ef4501] rounded-lg focus:ring-2 focus:ring-[#ef4501] focus:border-[#ef4501]/20 outline-none transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Use simple names like "Full Plates", "Favourites",
                      "Dessert"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <InputField
              label="Price"
              leftIcon={<DollarSign size={18} />}
              placeholder="0.00"
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            {/* Stock */}
            <InputField
              label="Stock"
              leftIcon={<Layers size={18} />}
              placeholder="0.00"
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Product Image <span className="text-red-500">*</span>
            </label>
            <div className="mb-4">
              <label
                htmlFor="imageFile"
                className="block text-xs text-gray-600 mb-2"
              >
                Upload Image (Max 5MB)
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ef4501] focus:border-[#ef4501]/20 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ef4501]/20 file:text-[#ef4501] hover:file:bg-[#ef4501]/30 cursor-pointer"
              />
              {imageFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Selected: {imageFile.name} (
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="text-center text-gray-500 text-sm my-2">OR</div>
            <div>
              <label
                htmlFor="image"
                className="block text-xs text-gray-600 mb-2"
              >
                Paste Image URL
              </label>
              <InputField
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                disabled={!!imageFile}
                placeholder="https://example.com/image.jpg"
                leftIcon={<Link size={16} />}
              />
            </div>
          </div>

          {/* Image Preview */}
          {(formData.image || imageFile) && (
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Preview:
              </p>
              <img
                src={
                  imageFile ? URL.createObjectURL(imageFile) : formData.image
                }
                alt="Product preview"
                className="w-full max-w-md h-64 object-cover rounded-lg mx-auto shadow-sm"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x300?text=Invalid+Image";
                }}
              />
            </div>
          )}

          {/* Signature Product */}
<div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
  <div>
    <p className="text-sm font-semibold text-gray-800">
      Mark as Signature Product
    </p>
    <p className="text-xs text-gray-500">
      This product will appear in the "Our Signature Products" section.
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
    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#ef4501] transition"></div>
    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
  </label>
</div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ef4501] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#c13500] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditMode ? "Updating Product..." : "Creating Product..."}
              </span>
            ) : (
              `✓ ${isEditMode ? "Update Product" : "Create Product"}`
            )}
          </button>
        </form>

        {/* Status Messages */}
        {isSuccess && (
          <div className="mt-6 p-4 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">
            ✓ Product {isEditMode ? "updated" : "created"} successfully!
          </div>
        )}

        {!loadingCategories && categories.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}{" "}
            available
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsModal;
