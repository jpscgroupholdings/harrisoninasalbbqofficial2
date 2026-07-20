"use client";

import { useProducts } from "@/hooks/api/useProducts";
import ProductTable from "@/app/admin/components/ProductTable";
import SectionHeader from "@/app/admin/components/SectionHeader";
import LoadingPage from "@/components/ui/LoadingPage";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatCard, StatCardProps } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";

const ProductsPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit,
    search: appliedSearch,
  });

  const totalProducts = data?.pagination?.total ?? 0;
  const products = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;

  const sortedProducts = [...products];

  const statCards: StatCardProps[] = useMemo(() => {
    return [
      { label: "Total Products", value: totalProducts, hasPreviousData: false },
      {
        label: "Popular",
        value: products.filter((p) => p.isPopular).length,
      },
      {
        label: "Signature",
        value: products.filter((p) => p.isSignature).length,
      },
      {
        label: "Active Discounts",
        value: products.filter((p) => p.activeProductDiscount).length,
      },
    ];
  }, [products, totalProducts]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setPage(1);
  };

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

      {/** Filters */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        placeholder="Search product by name, price, type"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
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
