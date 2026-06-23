"use client";

import React, { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { useBranchName } from "../../hooks/useBranchName";
import { useAdminActivityLogs, ActivityLogParams } from "@/hooks/api/useActivityLogs";
import ActivityLogsTable from "./components/ActivityLogsTable";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "order", label: "Orders" },
  { value: "payment", label: "Payments" },
  { value: "inventory", label: "Inventory" },
  { value: "voucher", label: "Vouchers" },
];

const ACTOR_OPTIONS = [
  { value: "all", label: "All Actors" },
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customers" },
  { value: "system", label: "System" },
  { value: "webhook", label: "Webhooks" },
];

const ActivityLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");

  const { selectedBranchId } = useAdminBranchContext();
  const { branchName } = useBranchName();

  const params: ActivityLogParams = {
    page: currentPage,
    limit,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    actorType: actorFilter === "all" ? undefined : (actorFilter as any),
    branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
  };

  const { data, isPending } = useAdminActivityLogs(params);
  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, categoryFilter, actorFilter]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Activity Logs -{" "}
          <span className="text-brand-color-500">{branchName}</span>
        </h1>
        <p className="text-gray-500">
          Track all actions performed by staff, customers, and system events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-color-500/30 focus:border-brand-color-500"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Actor</label>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-color-500/30 focus:border-brand-color-500"
          >
            {ACTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <ActivityLogsTable logs={logs} isPending={isPending} />

      {/* Pagination */}
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

export default ActivityLogsPage;
