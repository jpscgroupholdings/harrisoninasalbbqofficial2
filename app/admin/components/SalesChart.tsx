'use client'

import { SalesData, TopProduct } from "@/types/adminType";
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

interface SalesChartProps {
  salesData: SalesData[];
  topProducts: TopProduct[];
}

const SalesChart = ({ salesData, topProducts }: SalesChartProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/**Sales Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Weekly revenue trend</p>
          </div>

          <select className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-color-500">
            <option value="">This Week</option>
            <option value="">This Month</option>
            <option value="">This Year</option>
          </select>
        </div>

        <ResponsiveContainer width={"100%"} height={280}>
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
      </div>

      {/** Top Products */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-800">
            Top Selling Products
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Best performers this month
          </p>
        </div>

        <ResponsiveContainer width={"100%"} height={280}>
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
            {/* <Bar dataKey="sales" fill="url(#colorGradient)" radius={[8,8,0,0]} /> */}
            {/* <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2={"1"}>
                <stop offset={"0%"} stopColor="#ef4501"/>
                <stop offset={"100%"} stopColor="#c13500"/>
              </linearGradient>
            </defs> */}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
