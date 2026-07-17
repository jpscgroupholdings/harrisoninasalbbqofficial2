"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { InputField, SelectField } from "@/components/ui/FormComponents";
import { FetchError } from "@/components/ui/FetchError";
import LoadingPage from "@/components/ui/LoadingPage";
import Pagination from "@/components/ui/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/apiClient";
import { buildQueryString } from "@/utils/buildQueryString";
import type {
  CustomerFilter,
  CustomerSortBy,
  CustomersListResponse,
} from "@/types/CustomerAccountType";
import CustomerDetailModal from "./components/CustomerDetailModal";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { IconButton } from "@/components/ui/buttons";

const FILTER_OPTIONS: { value: CustomerFilter; label: string }[] = [
  { value: "all", label: "All Customers" },
  { value: "active", label: "Active" },
  { value: "new", label: "New (30 days)" },
  { value: "vip", label: "VIP (₱10k+)" },
  { value: "banned", label: "Suspended" },
];

const SORT_OPTIONS: { value: CustomerSortBy; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest_spent", label: "Highest Spent" },
  { value: "most_orders", label: "Most Orders" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

const CustomersPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [sort, setSort] = useState<CustomerSortBy>("newest");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const queryString = buildQueryString({ page, limit, sort, filter, search });

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers", page, limit, search, filter, sort],
    queryFn: () =>
      apiClient.get<CustomersListResponse>(`/admin/customers${queryString}`),
  });

  const customerList = useMemo(() => response?.data ?? [], [response?.data]);
  const pagination = response?.pagination;
  const summary = response?.summary;

  // Average customer value computed from current page data
  const average = useMemo(() => {
    const totalRevenue = customerList.reduce(
      (sum, c) => sum + (c.totalSpent ?? 0),
      0,
    );
    return customerList.length > 0 ? totalRevenue / customerList.length : 0;
  }, [customerList]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as CustomerFilter);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value as CustomerSortBy);
    setPage(1);
  };

  const customerHeaders = [
    "Customer",
    "Contact",
    "Total Orders",
    "Total Spent",
    "Status",
    "Join Date",
    "Actions",
  ];

  if (isLoading) return <LoadingPage />;
  if (error)
    return (
      <FetchError
        error={
          error instanceof Error ? error : new Error("Failed to load customers")
        }
        onRetry={() => window.location.reload()}
        description="Something went wrong while fetching the customer list."
      />
    );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Customers</h1>
        <p className="text-stone-500">View and manage customer information</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <DynamicIcon name="Users" size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">
                Total Customers
              </p>
              <p className="text-xl font-bold text-stone-800">
                {summary?.totalCustomers ??
                  pagination?.total ??
                  customerList.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <DynamicIcon name="Star" size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">
                VIP Customers
              </p>
              <p className="text-xl font-bold text-stone-800">
                {summary?.vipCustomers ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-color-500 text-white flex items-center justify-center shrink-0">
              <DynamicIcon name="Wallet" size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">
                Avg. Value
              </p>
              <p className="text-xl font-bold text-stone-800">
                ₱
                {average.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <DynamicIcon name="UserPlus" size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">
                New (30 days)
              </p>
              <p className="text-xl font-bold text-stone-800">
                {summary?.newCustomers ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search + Filter + Sort ── */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="w-full md:w-96">
          <InputField
            placeholder="Search by name, email, or phone..."
            leftIcon={<DynamicIcon name="Search" size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            rightElement={
              <IconButton
                onClick={handleSearch}
                text="Search"
                variant="ghost"
              />
            }
          />
        </div>

        <div className="w-full md:w-52">
          <SelectField
            name="filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            options={FILTER_OPTIONS.map((f) => ({
              value: f.value,
              label: f.label,
            }))}
          />
        </div>

        <div className="w-full md:w-52">
          <SelectField
            name="sort"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            options={SORT_OPTIONS.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {customerHeaders.map((head) => (
                  <TableHead
                    key={head}
                    className="text-xs font-semibold uppercase tracking-wider text-center"
                  >
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-stone-100">
              {customerList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={customerHeaders.length}>
                    <div className="flex flex-col items-center text-stone-400 gap-2 py-12">
                      <DynamicIcon name="Ban" size={28} />
                      <p className="text-sm">No customers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customerList.map((customer) => {
                  const isBanned = customer.banned === true;
                  return (
                    <TableRow
                      key={customer._id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      {/* Customer Name + Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3 mx-auto max-w-60 min-w-44">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {customer.image ? (
                              <img
                                src={customer.image}
                                alt={`${customer.firstName} photo`}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>
                                {customer.firstName?.charAt(0) ?? "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-xs text-stone-400 font-mono truncate">
                              {customer._id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div>
                          <p className="text-sm text-stone-700">
                            {customer.email ?? "--"}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {customer.phone ?? "--"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Total Orders */}
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-stone-800">
                          {customer.totalOrders ?? 0}
                        </span>
                      </TableCell>

                      {/* Total Spent */}
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-emerald-600">
                          ₱{(customer.totalSpent ?? 0).toLocaleString()}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg bg-red-100 text-red-600">
                            <DynamicIcon name="Ban" size={12} />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                            <DynamicIcon name="UserCheck" size={12} />
                            Active
                          </span>
                        )}
                      </TableCell>

                      {/* Join Date */}
                      <TableCell className="text-center">
                        <span className="text-sm text-stone-600">
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <button
                          onClick={() =>
                            customer._id && setSelectedCustomerId(customer._id)
                          }
                          className="px-4 py-2 text-sm font-semibold text-brand-color-500 hover:bg-brand-color-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* ── Customer Detail Modal ── */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </section>
  );
};

export default CustomersPage;
