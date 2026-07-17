"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { MONTHS } from "@/data/months";
import { getErrorMessage } from "@/helper/getErrorMessage";
import { apiClient } from "@/lib/apiClient";
import type { DashboardPeriod } from "@/services/admin/dashboard.service";
import type { SalesData, TopProduct } from "@/types/adminType";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildDashboardQuery } from "../helper/buildDashboardQuery";
import { NoDataFound } from "../../(components)/dashboard/NoDataFound";

type SalesChartResponse = {
  salesData: SalesData[];
  topProducts: TopProduct[];
};

export default function SalesChartClient({ period }: { period: DashboardPeriod }) {
  const { selectedBranchId } = useAdminBranchContext();

  const dashboardQuery = useQuery({
    queryKey: ["admin-sales-chart", selectedBranchId, period],
    queryFn: () =>
      apiClient.get<SalesChartResponse>(
        `/admin/dashboard?${buildDashboardQuery(period, selectedBranchId)}`,
      ),
  });

  const salesData = dashboardQuery.data?.salesData ?? [];
  const topProducts = dashboardQuery.data?.topProducts ?? [];
  const errorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error)
    : null;

  const rangeLabel =
    period.range === "week"
      ? "Weekly"
      : period.range === "month"
        ? MONTHS[period.month - 1]?.label ?? "Monthly"
        : String(period.year);

  const periodSubtext =
    period.range === "week"
      ? "this week"
      : period.range === "month"
        ? `in ${MONTHS[period.month - 1]?.label} ${period.year}`
        : `in ${period.year}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
          <p className="text-sm text-gray-500 mt-1">{rangeLabel} revenue trend</p>
        </div>
        {dashboardQuery.isLoading ? (
          <NoDataFound
            iconName="Loader"
            text="Loading revenue data"
            subText="Dashboard charts are being refreshed."
          />
        ) : errorMessage ? (
          <NoDataFound
            iconName="CircleAlert"
            text={errorMessage}
            subText="Try to refresh the dashboard."
          />
        ) : salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#ef4501"
                strokeWidth={2}
                dot={{ fill: "#dc2626", r: 3 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <NoDataFound
            iconName="BadgeDollarSign"
            text="No revenue data yet"
            subText="Revenue trends will appear here once your store starts receiving orders."
          />
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-800">
            Top Selling Products
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Best performers {periodSubtext}
          </p>
        </div>
        {dashboardQuery.isLoading ? (
          <NoDataFound
            iconName="Loader"
            text="Loading product data"
            subText="Top products are being refreshed."
          />
        ) : errorMessage ? (
          <NoDataFound
            iconName="CircleAlert"
            text={errorMessage}
            subText="Try to refresh the dashboard."
          />
        ) : topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Bar dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoDataFound
            iconName="ChartColumnBig"
            text="No top sellers yet"
            subText="Your best-performing products will show up here once sales come in."
          />
        )}
      </div>
    </div>
  );
}
