"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/api/useProducts";
import { Product } from "@/types/products";

import ProductTable from "@/app/admin/components/ProductTable";
import ProductsModal from "./ProductsModal";
import SectionHeader from "@/app/admin/components/SectionHeader";
import LoadingPage from "@/components/ui/LoadingPage";
import { useRouter } from "next/navigation";

const ProductsPage = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts();

  const sortedProducts = [...products];

  if (isLoading) {
    return (
     <LoadingPage />
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
        subTitle="Manage your resturant's products"
        onClick={() => router.push("/products/new")}
        btnTxt="+ Add Product"
        permission="products.create"
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
            {products.filter((p) => p.isPopular).length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <ProductTable
        products={sortedProducts}
      />

      {/* Add Product Modal */}
      {/* {isModalOpen && (
        <ProductsModal
          setIsModalOpen={setIsModalOpen}
          editProduct={selectedProduct}
        />
      )} */}
    </section>
  );
};

export default ProductsPage;
