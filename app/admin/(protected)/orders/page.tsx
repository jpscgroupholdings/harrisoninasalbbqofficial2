"use client";

import { InputField } from "@/components/ui/InputField";
import OrdersTable from "@/app/admin/components/OrdersTable";
import React, { useState } from "react";
import { useOrders } from "@/hooks/api/useOrders";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const { data: placedOrders = [] } = useOrders();

  const filteredOrders = placedOrders.filter((order) => {
    const searchableFields = [
      order._id,
      order.status,
      order.paymentInfo?.customerName,
      order.paymentInfo?.customerEmail,
      order.paymentInfo?.customerPhone,
      order.paymentInfo?.referenceNumber,
      order.paymentInfo?.method,
    ].map((field) => field?.toLowerCase() ?? "");

    const lowerQuery = searchQuery.toLowerCase();

    const matchesSearch = searchableFields.some((field) =>
      field.includes(lowerQuery),
    );
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  const getPaginationRange = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
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
          {/**Search */}
          <div className="flex-1">
            <InputField
              type="text"
              placeholder="Search order by ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/** Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ef4501]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Orders:</span>
            <span className="ml-2 font-semibold text-stone-800">
              {filteredOrders.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Pending: </span>
            <span className="ml-2 font-semibold text-amber-600">
              {filteredOrders.filter((o) => o.status === "pending").length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Preparing: </span>
            <span className="ml-2 font-semibold text-blue-600">
              {filteredOrders.filter((o) => o.status === "preparing").length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Completed: </span>
            <span className="ml-2 font-semibold text-emerald-600">
              {filteredOrders.filter((o) => o.status === "completed").length}
            </span>
          </div>
        </div>
      </div>

      {/** Orders Table */}
      <OrdersTable orders={paginatedOrders} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {getPaginationRange(currentPage, totalPages).map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-stone-400 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? "bg-[#ef4501] text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
