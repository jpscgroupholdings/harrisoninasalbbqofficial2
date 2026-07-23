/**
 * MARK NOTIFICATION READ — PATCH /api/admin/notifications/[id]/read
 *
 * Marks a single notification as read for the authenticated staff member.
 */

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/services/notification.service";
import "@/lib/registerModels";
import { getAPIError } from "@/lib/getApiError";
import { getValidObjectId } from "@/helper/getValidObjectIds";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await requireAdmin(request);

    const { id } = await context.params;

    if (!id || !getValidObjectId(id)) {
      return getAPIError("Invalid notification ID", 400);
    }

    await connectDB();
    await markAsRead(id, staff._id.toString());

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/notifications/[id]/read error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to mark notification as read",
    });
  }
}
