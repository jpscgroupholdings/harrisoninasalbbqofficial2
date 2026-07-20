"use client";

import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { getErrorMessage } from "@/helper/getErrorMessage";
import { apiClient } from "@/lib/apiClient";
import type { DashboardPeriod } from "@/services/admin/dashboard.service";
import type { DashboardStats } from "@/types/adminType";
import { useQuery } from "@tanstack/react-query";
import { buildDashboardQuery } from "../helper/buildDashboardQuery";
import { StatCard, StatCardProps } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";

const DashboardCard = ({ period }: { period: DashboardPeriod }) => {
  const { selectedBranchId } = useAdminBranchContext();

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard-stats", selectedBranchId, period],
    queryFn: () =>
      apiClient.get<DashboardStats>(
        `/admin/dashboard/stats?${buildDashboardQuery(period, selectedBranchId)}`,
      ),
  });

  const dashboardStats = dashboardQuery?.data;
  const isLoading = dashboardQuery.isLoading;
  const errorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error)
    : null;

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
        {errorMessage}
      </div>
    );
  }

  // Fallbacks so the grid renders skeleton values instead of crashing
  // while dashboardStats is still undefined.
  const totalOrders = dashboardStats?.totalOrders ?? 0;
  const totalRevenue = dashboardStats?.totalRevenue ?? 0;
  const pendingOrders = dashboardStats?.pendingOrders ?? 0;
  const bestSellingProduct =
    dashboardStats?.bestSellingProduct ?? "No sales yet";
  const bestSellingCount = dashboardStats?.bestSellingCount ?? 0;

  const cards: StatCardProps[] = [
    {
      label: "Total Orders",
      value: totalOrders,
    },
    {
      label: "Total Revenue",
      value: totalRevenue,
      isCurrency: true,
    },
    {
      label: "Pending Orders",
      value: pendingOrders,
    },
    {
      label: "Best Seller",
      value: bestSellingProduct,
      changeText: `${bestSellingCount} sold`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        : cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
};

export default DashboardCard;
