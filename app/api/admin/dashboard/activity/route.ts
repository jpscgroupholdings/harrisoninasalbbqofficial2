import {
  getDashboardActivity,
  resolveDashboardFilters,
} from "@/services/admin/dashboard.service";
import { requireAdmin } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { getAPIError } from "@/lib/getApiError";

/**
 * GET /api/admin/dashboard/activity
 *
 * Returns real-time activity data for the dashboard aside panel:
 * - pending orders (recent 5)
 * - low/out-of-stock items (recent 5)
 * - new customers (last 7 days, recent 5)
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!canAccess(admin.role, "dashboard.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestedBranchId = req.nextUrl.searchParams.get("branchId");
    const filters = resolveDashboardFilters(admin, requestedBranchId);

    const activity = await getDashboardActivity(filters);

    return NextResponse.json(activity);
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch activity data",
    });
  }
}
