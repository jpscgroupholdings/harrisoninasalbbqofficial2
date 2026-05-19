import DashboardCards from "@/app/admin/components/DashboardCard";
import SalesChart from "@/app/admin/components/SalesChart";
import { mockSalesData, mockTopProducts } from "@/data/mockData";
import {
  DashboardRange,
  getDashboardStats,
  getSalesData,
  getTopProducts,
} from "@/services/admin/dashboard.service";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const salesData = await getSalesData("week");
  const topProducts = await getTopProducts("week");

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
      <SalesChart
        initialSalesData={salesData}
        initialTopProducts={topProducts}
      />
    </div>
  );
}
