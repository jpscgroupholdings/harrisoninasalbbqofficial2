"use client";

import ProductTable from "@/components/admin/ProductTable";
import { useState } from "react";
import ProductsModal from "./ProductsModal";
import { Product } from "@/types/adminType";
import { useProducts } from "@/hooks/api/useProducts";
import SectionHeader from "@/components/admin/SectionHeader";

const ProductsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts();

  const sortedProducts = products.sort((a, b) => a.stock - b.stock);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading products...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load products"}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <SectionHeader
        title={"Products Management"}
        subTitle="Manage your menu items and inventory"
        onClick={() => {
          setSelectedProduct(null);
          setIsModalOpen(true);
        }}
        btnTxt="+ Add New Product"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-stone-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Popular</p>
          <p className="text-2xl font-bold text-emerald-600">
            {products.filter((p: Product) => p.isPopular).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600">
            {products.filter((p: Product) => p.stock < 20).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {products.filter((p: Product) => p.stock === 0).length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <ProductTable
        products={sortedProducts}
        onEdit={(product) => {
          setSelectedProduct(product);
          setIsModalOpen(true);
        }}
      />

      {/* Add Product Modal */}
      {isModalOpen && (
        <ProductsModal
          setIsModalOpen={setIsModalOpen}
          editProduct={selectedProduct}
        />
      )}
    </section>
  );
};

export default ProductsPage;
