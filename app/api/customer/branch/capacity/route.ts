import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Branch } from "@/models/Branch";
import { Settings } from "@/models/Setting";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

const ACTIVE_STATUSES = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.DISPATCH,
  ORDER_STATUSES.READY_FOR_PICKUP,
];

/**
 * GET /api/customer/branch/capacity?branchId=...
 *
 * Returns whether a branch can currently accept new orders.
 * Used by the frontend to show "high demand" overlay and disable checkout.
 * Never exposes rider count or internal staffing details.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "Missing branchId query parameter" },
        { status: 400 },
      );
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 },
      );
    }

    // Admin manual override — hard block
    if (branch.isBusy) {
      return NextResponse.json({
        canAcceptOrders: false,
        reason: "high_demand",
        message: "We're currently experiencing high demand. Please try again shortly.",
      });
    }

    // Resolve the effective limit: branch-specific > global fallback > no limit
    const settings = await Settings.findOne();
    const maxActiveOrders =
      branch.maxActiveOrders ?? settings?.globalMaxActiveOrders ?? null;
    const isSharedCapacity = settings?.isGlobalCapacityShared === true;

    // No limit configured — always allow
    if (maxActiveOrders === null) {
      return NextResponse.json({ canAcceptOrders: true });
    }

    // When shared capacity is enabled, count active orders across ALL branches
    // so branches that share riders/resources are affected by each other's load.
    // Otherwise, count only this branch's orders independently.
    const activeOrderCount = await Order.countDocuments({
      ...(isSharedCapacity ? {} : { branchId }),
      status: { $in: ACTIVE_STATUSES },
    });

    const canAccept = activeOrderCount < maxActiveOrders;

    return NextResponse.json({
      canAcceptOrders: canAccept,
      maxActiveOrders,
      activeOrderCount,
      ...(canAccept
        ? {}
        : {
            reason: "high_demand",
            message:
              "We're currently experiencing high demand. Please try again shortly.",
          }),
    });
  } catch (error) {
    console.error("GET /api/customer/branch/capacity error:", error);
    return NextResponse.json(
      { error: "Failed to check branch capacity" },
      { status: 500 },
    );
  }
}
