"use client";

import { useBranchName } from "../../hooks/useBranchName";
import type { DashboardPeriod } from "@/services/admin/dashboard.service";
import { useState } from "react";
import {
  DashboardCards,
  DashboardFilter,
  SalesChartClient,
} from "./components";
import DashboardActivityAside from "./components/DashboardActivityAside";

export default function DashboardPage() {
  const { branchName } = useBranchName();

  const [period, setPeriod] = useState<DashboardPeriod>({ range: "week" });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main Content ── */}
      <div className="flex-1 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Dashboard Overview -{" "}
            <span className="text-brand-color-500">{branchName}</span>
          </h1>

          <p className="text-gray-500">
            Monitor your restaurant performance and operations
          </p>
        </div>

        {/* Global Time Period Filter */}
        <DashboardFilter value={period} onChange={setPeriod} />

        <DashboardCards period={period} />

        {/* Charts */}
        <SalesChartClient period={period} />
      </div>

      {/* ── Activity Aside ── */}
      <aside className="lg:w-[320px] shrink-0">
        <DashboardActivityAside />
      </aside>
    </div>
  );
}
