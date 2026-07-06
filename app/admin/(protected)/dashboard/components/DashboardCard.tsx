"use client";

import MetricCard, { MetricCardProps } from "@/components/ui/MetricCard";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { getErrorMessage } from "@/helper/getErrorMessage";
import { apiClient } from "@/lib/apiClient";
import type { DashboardPeriod } from "@/services/admin/dashboard.service";
import type { DashboardStats } from "@/types/adminType";
import { useQuery } from "@tanstack/react-query";
import { buildDashboardQuery } from "../helper/buildDashboardQuery";

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
  const errorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error)
    : null;

  if (dashboardQuery.isLoading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-500">
        Loading dashboard stats...
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
        {errorMessage}
      </div>
    );
  }

  if (!dashboardStats) return null;

  const { bestSellingCount } = dashboardStats;

  const cards: MetricCardProps[] = [
    {
      title: "Total Orders",
      value: dashboardStats.totalOrders,
      icon: "Package",
      iconColor: "bg-blue-600",
    },
    {
      title: "Total Revenue",
      value: `PHP ${dashboardStats.totalRevenue.toLocaleString()}`,
      icon: "CircleDollarSign",
      iconColor: "bg-emerald-600",
    },
    {
      title: "Pending Orders",
      value: dashboardStats.pendingOrders,
      icon: "ClockAlert",
      iconColor: "bg-[#ef4501]",
    },
    {
      title: "Best Seller",
      value: dashboardStats.bestSellingProduct,
      icon: "Trophy",
      iconColor: "bg-amber-600",
      badge: `${bestSellingCount} old`,
      badgeTone: bestSellingCount > 0 ? "positive" : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          iconColor={card.iconColor}
          badge={card.badge}
          badgeTone={card.badgeTone}
        />
      ))}
    </div>
  );
};

export default DashboardCard;
