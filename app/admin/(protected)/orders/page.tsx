"use client";

import { InputField } from "@/components/ui/InputField";
import OrdersTable from "@/app/admin/components/OrdersTable";
import React, { useState } from "react";
import { useOrders } from "@/hooks/api/useOrders";
import Pagination from "@/components/ui/Pagination";

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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full flex gap-4">
            <InputField
              type="text"
              placeholder="Search order by ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="border rounded-xl px-4 cursor-pointer bg-brand-color-500 text-white"
            >
              Search
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={handleStatus}
            className="px-6 py-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-color-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats — now from server totals */}
        <div className="mt-6 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Orders:</span>
            <span className="ml-2 font-semibold text-stone-800">
              {pagination?.total ?? 0}
            </span>
          </div>
        </div>
      </div>

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
