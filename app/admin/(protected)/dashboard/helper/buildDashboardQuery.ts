import { DashboardPeriod } from "@/services/admin/dashboard.service";

/**
 * Builds the query string from a DashboardPeriod and branchId.
 */
export function buildDashboardQuery(period: DashboardPeriod, branchId: string) {
  const params = new URLSearchParams();

  params.set("range", period.range);
  if (period.range === "month") {
    params.set("month", String(period.month));
    params.set("year", String(period.year));
  } else if (period.range === "year") {
    params.set("year", String(period.year));
  }

  if (branchId !== "all") {
    params.set("branchId", branchId);
  }

  return params.toString();
}