"use client";

import { InputField } from "@/components/ui/InputField";
import OrdersTable from "@/app/admin/components/OrdersTable";
import React, { useState } from "react";
import { useOrders } from "@/hooks/api/useOrders";
import Pagination from "@/components/ui/Pagination";
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUSES,
  OrderStatus,
} from "@/types/orderConstants";
import { Search } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ✅ pass all filters to the server
  const { data } = useOrders(
    { type: "admin" },
    {
      page: currentPage,
      limit,
      search: appliedSearch,
      status: statusFilter === "all" ? undefined : statusFilter,
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
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

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

      <OrdersTable orders={orders} />

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
