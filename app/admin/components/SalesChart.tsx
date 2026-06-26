"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { SelectField } from "@/components/ui/FormComponents/SelectField";
import { useAdminBranchContext } from "@/contexts/AdminBranchContext";
import { getErrorMessage } from "@/helper/getErrorMessage";
import { apiClient } from "@/lib/apiClient";
import type { DashboardRange } from "@/services/admin/dashboard.service";
import type { SalesData, TopProduct } from "@/types/adminType";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

const NotDataFound = ({
  iconName = "CircleOff",
  text = "No data yet",
  subText = "Data will show here. Try to refresh the page",
}: {
  iconName: string;
  text: string;
  subText: string;
}) => (
  <div className="flex flex-col items-center justify-center h-70 text-center px-6">
    <div className="relative mb-4">
      <div className="w-16 h-16 bg-brand-color-100 rounded-2xl flex items-center justify-center">
        <DynamicIcon
          name={iconName}
          size={24}
          className="text-brand-color-500"
        />
      </div>
    </div>
    <p className="text-sm font-semibold text-gray-800 mb-1">{text}</p>
    <p className="text-xs text-gray-400 leading-relaxed max-w-50">{subText}</p>
  </div>
);

type SalesChartResponse = {
  salesData: SalesData[];
  topProducts: TopProduct[];
};

const getDashboardQuery = (range: DashboardRange, selectedBranchId: string) => {
  const params = new URLSearchParams({ range });

  if (selectedBranchId !== "all") {
    params.set("branchId", selectedBranchId);
  }

  return params.toString();
};

export default function SalesChartClient() {
  const { selectedBranchId } = useAdminBranchContext();

  const [selectedRange, setSelectedRange] = useState<DashboardRange>("week");

  const dashboardQuery = useQuery({
    queryKey: ["admin-sales-chart", selectedBranchId, selectedRange],
    queryFn: () =>
      apiClient.get<SalesChartResponse>(
        `/admin/dashboard?${getDashboardQuery(selectedRange, selectedBranchId)}`,
      ),
  });

  const salesData = dashboardQuery.data?.salesData ?? [];
  const topProducts = dashboardQuery.data?.topProducts ?? [];
  const errorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error)
    : null;

  const dateRangeOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Weekly revenue trend</p>
          </div>
          <SelectField
            value={selectedRange}
            options={dateRangeOptions}
            onChange={(e) => setSelectedRange(e.target.value as DashboardRange)}
          />
        </div>
        {dashboardQuery.isLoading ? (
          <NotDataFound
            iconName="Loader"
            text="Loading revenue data"
            subText="Dashboard charts are being refreshed."
          />
        ) : errorMessage ? (
          <NotDataFound
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
          <NotDataFound
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
            Best performers this month
          </p>
        </div>
        {dashboardQuery.isLoading ? (
          <NotDataFound
            iconName="Loader"
            text="Loading product data"
            subText="Top products are being refreshed."
          />
        ) : errorMessage ? (
          <NotDataFound
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
          <NotDataFound
            iconName="ChartColumnBig"
            text="No top sellers yet"
            subText="Your best-performing products will show up here once sales come in."
          />
        )}
      </div>
    </div>
  );
}
