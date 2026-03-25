import React from "react";
import DashboardCards from "@/app/admin/components/DashboardCard";
import SalesChart from "@/app/admin/components/SalesChart";
import { mockSalesData, mockTopProducts } from "@/data/mockData";
import { getDashboardStats } from "@/lib/dashboardStats";

export default async function DashboardPage() {
  
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-500">
          Monitor your restaurant performance and operations
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardCards stats={stats} />

      {/* Charts */}
      <SalesChart salesData={mockSalesData} topProducts={mockTopProducts} />

      {/* Recent Orders */}
      {/* <OrdersTable orders={recentOrders} showActions={false} /> */}
    </div>
  );
}
