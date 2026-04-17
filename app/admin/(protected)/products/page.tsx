"use client";

import { useProducts } from "@/hooks/api/useProducts";
import ProductTable from "@/app/admin/components/ProductTable";
import SectionHeader from "@/app/admin/components/SectionHeader";
import LoadingPage from "@/components/ui/LoadingPage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Pagination from "@/components/ui/Pagination";

const ProductsPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit,
  });

  const totalProducts = data?.pagination?.total ?? 0;
  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const sortedProducts = [...products];

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingPage />;
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
          <p className="text-2xl font-bold text-stone-800">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Popular</p>
          <p className="text-2xl font-bold text-emerald-600">
            {products.filter((p) => p.isPopular).length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <ProductTable products={sortedProducts} />

      <Pagination
        currentPage={pagination?.page ?? 1}
        totalPages={pagination?.totalPages ?? 1}
        total={pagination?.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />
    </section>
  );
};

export default ProductsPage;
