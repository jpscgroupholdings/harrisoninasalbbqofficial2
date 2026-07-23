/**
 * NOTIFICATIONS API — GET /api/admin/notifications
 *
 * Returns paginated notifications for the authenticated staff member.
 * Supports branch filtering and unread-only mode.
 */

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/services/notification.service";
import "@/lib/registerModels";
import { getAPIError } from "@/lib/getApiError";

export async function GET(request: NextRequest) {
  try {
    const staff = await requireAdmin(request);

    await connectDB();

    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? "all";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    // Branch-scoped admins can only see their own branch
    const effectiveBranchId = staff.branch
      ? staff.branch.toString()
      : branchId;

    const result = await getNotifications({
      staffId: staff._id.toString(),
      branchId: effectiveBranchId,
      role: staff.role,
      limit,
      cursor,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET /api/admin/notifications error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch notifications",
    });
  }
}
