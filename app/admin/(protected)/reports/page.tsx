"use client";

import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { apiClient } from "@/lib/apiClient";
import { getErrorMessage } from "@/helper/getErrorMessage";
import type { DashboardPeriod } from "@/services/admin/dashboard.service";
import type { ReportsData } from "@/services/admin/reports.service";
import { buildDashboardQuery as buildReportsQuery } from "../dashboard/helper/buildDashboardQuery";
import DashboardFilter from "../dashboard/components/DashboardFilter";
import { NoDataFound } from "../../components/dashboard/NoDataFound";
import { formatCurrency } from "@/helper/formatter";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";

// ============================================
// MAIN PAGE
// ============================================

const ReportsPage = () => {
  const { selectedBranchId } = useAdminBranchContext();
  const [period, setPeriod] = useState<DashboardPeriod>({
    range: "month",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-reports", selectedBranchId, period],
    queryFn: () =>
      apiClient.get<ReportsData>(
        `/admin/reports?${buildReportsQuery(period, selectedBranchId)}`,
      ),
  });

  const keyMetrics = data?.keyMetrics ?? [];
  const trend = data?.trend ?? [];
  const categorySales = data?.categorySales ?? [];
  const peakHours = data?.peakHours ?? [];
  const errorMessage = isError ? getErrorMessage(error) : null;

  const hasTrendData = trend.length > 0;
  const hasCategoryData = categorySales.length > 0;
  const hasPeakHourData = peakHours.some((h) => h.orders > 0);

  return (
    <section className="space-y-6">
      {/** Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-stone-500">
            Detailed insights into your business performance
          </p>
        </div>
        <DashboardFilter value={period} onChange={setPeriod} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton />)
        ) : isError ? (
          <div className="col-span-full">
            <NoDataFound
              iconName="CircleAlert"
              text={errorMessage ?? "Failed to load reports"}
              subText="Try to refresh the page or select a different time period."
            />
          </div>
        ) : keyMetrics.length > 0 ? (
          keyMetrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              changeText={`${metric.percentChange}% from previous period`}
              percentChange={metric.percentChange}
              isCurrency={metric.isCurrency}
              isPercentage={metric.isPercentage}
            />
          ))
        ) : (
          <div className="col-span-full">
            <NoDataFound
              iconName="BadgeDollarSign"
              text="No data for this period"
              subText="Try selecting a different time period to see your metrics."
            />
          </div>
        )}
      </div>

      {/** Revenue & Orders Trend */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-800">
            Revenue & Orders Trend
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Performance over the selected period
          </p>
        </div>
        {isLoading ? (
          <NoDataFound
            iconName="Loader"
            text="Loading trend data"
            subText="Charts are being refreshed."
          />
        ) : isError ? (
          <NoDataFound
            iconName="CircleAlert"
            text={errorMessage ?? "Failed to load trend"}
            subText="Try to refresh the page."
          />
        ) : hasTrendData ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="left"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px",
                }}
                formatter={(value, name) =>
                  name === "Revenue (₱)"
                    ? [formatCurrency(Number(value)), name]
                    : [value, name]
                }
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={3}
                name="Revenue (₱)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#dc2626"
                strokeWidth={3}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <NoDataFound
            iconName="TrendingUp"
            text="No trend data yet"
            subText="Revenue and order trends will appear here once orders are completed."
          />
        )}
      </div>

      {/** Sales by Category & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/** Category Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-stone-800">
              Sales by Category
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Item quantity distribution across menu categories
            </p>
          </div>
          {isLoading ? (
            <NoDataFound
              iconName="Loader"
              text="Loading category data"
              subText="Category breakdown is being computed."
            />
          ) : isError ? (
            <NoDataFound
              iconName="CircleAlert"
              text={errorMessage ?? "Failed to load categories"}
              subText="Try to refresh the page."
            />
          ) : hasCategoryData ? (
            <ResponsiveContainer width={"100%"} height={300}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <NoDataFound
              iconName="ChartPie"
              text="No category data yet"
              subText="Sales by category will show here once completed orders have items."
            />
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-stone-800">
              Peak Hours Analysis
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Busiest hours of the day
            </p>
          </div>
          {isLoading ? (
            <NoDataFound
              iconName="Loader"
              text="Loading peak hours"
              subText="Hourly analysis is being computed."
            />
          ) : isError ? (
            <NoDataFound
              iconName="CircleAlert"
              text={errorMessage ?? "Failed to load peak hours"}
              subText="Try to refresh the page."
            />
          ) : hasPeakHourData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px" }}
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
                <Bar dataKey="orders" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataFound
              iconName="Clock"
              text="No peak hours data yet"
              subText="Hourly order patterns will appear here once orders are completed."
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportsPage;
