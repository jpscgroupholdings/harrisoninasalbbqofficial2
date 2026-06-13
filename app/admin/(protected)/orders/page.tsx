"use client";

import OrdersTable from "@/app/admin/(protected)/orders/components/OrdersTable";
import React, { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { useAdminOrders } from "@/hooks/api/admin/useAdminOrders";
import { OrderStatus } from "@/types/orderConstants";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";

type statusFilterType = "all" | OrderStatus;

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<statusFilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { selectedBranchId } = useAdminBranchContext();

  // ✅ pass all filters to the server
  const { data, isPending } = useAdminOrders(
    {
      page: currentPage,
      limit,
      search: appliedSearch,
      status: statusFilter === "all" ? undefined : statusFilter,
      branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
    },
  );

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  // reset to page 1 when filters change
  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as statusFilterType);
    setCurrentPage(1);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId]);

  return (
    <section className="space-y-6">
      {/** Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Orders Management
        </h1>
        <p className="text-gray-500">View and manage all customers order</p>
      </div>

      {/** Filters */}
      <SearchBar 
      value={searchQuery}
      onChange={setSearchQuery}
      onSearch={handleSearch}
      placeholder="Search for customer, email, status, reference"
      />

      <OrdersTable orders={orders} isPending={isPending} />

      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={limit}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setCurrentPage(1);
          }}
        />
      )}
    </section>
  );
};

export default OrdersPage;
