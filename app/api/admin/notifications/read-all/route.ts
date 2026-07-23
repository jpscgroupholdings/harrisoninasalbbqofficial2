/**
 * MARK ALL READ — PATCH /api/admin/notifications/read-all
 *
 * Marks all notifications for the current branch as read
 * for the authenticated staff member.
 */

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/services/notification.service";
import "@/lib/registerModels";
import { getAPIError } from "@/lib/getApiError";

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireAdmin(request);

    await connectDB();

    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") ?? "all";

    // Branch-scoped admins can only mark their own branch
    const effectiveBranchId = staff.branch
      ? staff.branch.toString()
      : branchId;

    const result = await markAllAsRead(
      staff._id.toString(),
      effectiveBranchId,
      staff.role,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("PATCH /api/admin/notifications/read-all error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to mark all as read",
    });
  }
}
