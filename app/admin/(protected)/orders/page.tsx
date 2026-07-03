"use client";

import OrdersTable from "@/app/admin/(protected)/orders/components/OrdersTable";
import React, { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { useAdminOrders } from "@/hooks/api/admin/useAdminOrders";
import { ORDER_STATUSES, OrderStatus } from "@/types/orderConstants";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useBranchName } from "../../hooks/useBranchName";
import { SelectField } from "@/components/ui/FormComponents";

/**
 * Filter keys that map to API filter params.
 * "all" and "unpaid" are virtual filters — they use paymentFilter instead of status.
 * "cancelled_group" uses multiple status values via $in.
 */
type statusFilterType =
  | "all"
  | "pending_payment"
  | "unpaid"
  | OrderStatus
  | "cancelled_group";

const ORDER_FILTER_OPTIONS: {
  key: statusFilterType;
  label: string;
  statuses?: OrderStatus | OrderStatus[];
  paymentFilter?: "confirmed" | "unpaid";
  highlight?: boolean;
}[] = [
  { key: "all", label: "All Orders", paymentFilter: "confirmed" },
  {
    key: "pending_payment",
    label: "Pending Payment",
    statuses: ORDER_STATUSES.PENDING_PAYMENT,
    highlight: true,
  },
  { key: "unpaid", label: "Unpaid", paymentFilter: "unpaid", highlight: true },
  {
    key: ORDER_STATUSES.PENDING,
    label: "Pending",
    statuses: ORDER_STATUSES.PENDING,
  },
  {
    key: ORDER_STATUSES.PREPARING,
    label: "Preparing",
    statuses: ORDER_STATUSES.PREPARING,
  },
  {
    key: ORDER_STATUSES.DISPATCH,
    label: "Dispatch",
    statuses: ORDER_STATUSES.DISPATCH,
  },
  {
    key: ORDER_STATUSES.READY_FOR_PICKUP,
    label: "Ready for Pickup",
    statuses: ORDER_STATUSES.READY_FOR_PICKUP,
  },
  {
    key: ORDER_STATUSES.COMPLETED,
    label: "Completed",
    statuses: ORDER_STATUSES.COMPLETED,
  },
  {
    key: "cancelled_group",
    label: "Cancelled / Failed / Expired",
    statuses: [
      ORDER_STATUSES.CANCELLED,
      ORDER_STATUSES.FAILED,
      ORDER_STATUSES.EXPIRED,
    ],
  },
];

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<statusFilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { selectedBranchId } = useAdminBranchContext();
  const { branchName } = useBranchName();

  // Resolve the selected filter option into API query params
  const selectedFilter = ORDER_FILTER_OPTIONS.find(
    (option) => option.key === statusFilter
  )!;

  const { data, isPending } = useAdminOrders({
    page: currentPage,
    limit,
    search: appliedSearch,
    status: selectedFilter.statuses,
    paymentFilter: selectedFilter.paymentFilter,
    branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const filterCounts = data?.tabCounts;

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: statusFilterType) => {
    setStatusFilter(filter);
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
          Orders Management -{" "}
          <span className="text-brand-color-500">{branchName}</span>
        </h1>
        <p className="text-gray-500">View and manage all customers order</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_8fr] gap-4">
        <SelectField
          label="Filter by status"
          options={ORDER_FILTER_OPTIONS.map((option) => ({
            label:
              filterCounts?.[option.key] != null
                ? `${option.label} ${filterCounts[option.key] > 0 ? `(${filterCounts[option.key]})` : ""}`
                : option.label,
            value: option.key,
          }))}
          value={statusFilter}
          onChange={(e) =>
            handleFilterChange(e.target.value as statusFilterType)
          }
        />

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search orders - e.g. makati, pecho, delivery, customer name, branch, etc"
        />
      </div>

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