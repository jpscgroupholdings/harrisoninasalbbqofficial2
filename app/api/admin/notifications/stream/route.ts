/**
 * SSE NOTIFICATION STREAM — GET /api/admin/notifications/stream
 *
 * Opens a Server-Sent Events connection and pushes new notifications
 * in real time. The client auto-reconnects when the connection drops
 * (standard EventSource behavior, handles Vercel serverless timeouts).
 *
 * Headers: Content-Type: text/event-stream
 * Events:
 *   - "init"       → sent on connect with current unread count
 *   - "notification" → pushed when a new notification is created
 *   - "heartbeat"  → sent every 25s to keep the connection alive
 */

import { requireAdmin } from "@/lib/getAuth";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { Types } from "mongoose";
import {
  addSubscriber,
  removeSubscriber,
  SSESubscriber,
} from "@/services/notification.service";

// Allow the connection to stay open as long as the platform allows
export const maxDuration = 300; // 5 min — Vercel Pro / self-hosted

export async function GET(request: NextRequest) {
  // Authenticate before opening the stream
  let staff;
  try {
    staff = await requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();

  const url = new URL(request.url);
  const branchId = url.searchParams.get("branchId") ?? "all";
  const effectiveBranchId = staff.branch
    ? staff.branch.toString()
    : branchId;

  // Compute initial unread count
  const unreadMatch: Record<string, unknown> = {
    targetRoles: staff.role,
    "readBy.staffId": { $ne: new Types.ObjectId(staff._id.toString()) },
  };
  if (effectiveBranchId !== "all") {
    unreadMatch.branchId = new Types.ObjectId(effectiveBranchId);
  }
  const unreadCount = await Notification.countDocuments(unreadMatch);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "init", payload: { unreadCount } })}\n\n`,
        ),
      );

      // Register this subscriber for real-time pushes
      const subscriber: SSESubscriber = {
        branchId: effectiveBranchId,
        staffId: staff._id.toString(),
        role: staff.role,
        controller,
      };
      addSubscriber(subscriber);

      // Heartbeat every 25s to prevent idle timeout
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "heartbeat", payload: { ts: Date.now() } })}\n\n`,
            ),
          );
        } catch {
          // Connection closed — clean up
          clearInterval(heartbeat);
          removeSubscriber(subscriber);
        }
      }, 25_000);

      // Clean up when the client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSubscriber(subscriber);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // prevent nginx proxy buffering
    },
  });
}
