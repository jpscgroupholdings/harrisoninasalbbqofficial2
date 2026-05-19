"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { SelectField } from "@/components/ui/SelectField";
import { DashboardRange } from "@/services/admin/dashboard.service";
import { SalesData, TopProduct } from "@/types/adminType";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const NotDataFound = ({ iconName = "CircleOff", text = "No data yet", subText = "Data will show here. Try to refresh the page" }: { iconName: string; text: string; subText: string }) => (
  <div className="flex flex-col items-center justify-center h-70 text-center px-6">
    <div className="relative mb-4">
      <div className="w-16 h-16 bg-brand-color-100 rounded-2xl flex items-center justify-center">
        <DynamicIcon name={iconName} size={24} className="text-brand-color-500" />
      </div>
    </div>
    <p className="text-sm font-semibold text-gray-800 mb-1">{text}</p>
    <p className="text-xs text-gray-400 leading-relaxed max-w-50">{subText}</p>
  </div>
);

interface SalesChartClientProps {
  initialSalesData: SalesData[];
  initialTopProducts: TopProduct[];
}

export default function SalesChartClient({ initialSalesData, initialTopProducts }: SalesChartClientProps) {
  const [salesData, setSalesData] = useState<SalesData[]>(initialSalesData);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(initialTopProducts);

  const dateRangeOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  async function handleRangeChange(range: DashboardRange) {
    // Fetch from an API route — NOT the service directly
    const res = await fetch(`/api/admin/dashboard?range=${range}`);
    const data = await res.json();
    setSalesData(data.salesData);
    setTopProducts(data.topProducts);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Weekly revenue trend</p>
          </div>
          <SelectField
            options={dateRangeOptions}
            onChange={(e) => handleRangeChange(e.target.value as DashboardRange)}
          />
        </div>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px" }} />
              <Line type="monotone" dataKey="sales" stroke="#ef4501" strokeWidth={2} dot={{ fill: "#dc2626", r: 3 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <NotDataFound iconName="BadgeDollarSign" text="No revenue data yet" subText="Revenue trends will appear here once your store starts receiving orders." />
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-800">Top Selling Products</h3>
          <p className="text-sm text-stone-500 mt-1">Best performers this month</p>
        </div>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px" }} />
              <Bar dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NotDataFound iconName="ChartColumnBig" text="No top sellers yet" subText="Your best-performing products will show up here once sales come in." />
        )}
      </div>
    </div>
  );
}