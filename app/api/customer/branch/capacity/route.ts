import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Branch } from "@/models/Branch";
import { Settings } from "@/models/Setting";
import { FULFILLMENT_TYPE, ORDER_STATUSES } from "@/types/orderConstants";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

const ACTIVE_STATUSES = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.DISPATCH,
  ORDER_STATUSES.READY_FOR_PICKUP,
];

/**
 * GET /api/customer/branch/capacity?branchId=...&fulfillmentType=...
 *
 * Returns whether a branch can currently accept new orders.
 * Pickup orders are only blocked by the manual isBusy override —
 * no capacity counting since pickup doesn't share riders.
 * Delivery orders are subject to full capacity counting.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const fulfillmentType = searchParams.get("fulfillmentType");

    if (!branchId) {
      return NextResponse.json(
        { error: "Missing branchId query parameter" },
        { status: 400 },
      );
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Admin manual override — hard block regardless of fulfillment type
    if (branch.isBusy) {
      return NextResponse.json({
        canAcceptOrders: false,
        reason: "high_demand",
        message:
          "We're currently experiencing high demand. Please try again shortly.",
      });
    }

    // Pickup: only isBusy matters — no rider-based capacity counting
    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) {
      return NextResponse.json({ canAcceptOrders: true });
    }

    // Delivery (or unspecified): full capacity check

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
              "We're currently experiencing high demand. Please try again shortly. You may try pickup instead.",
          }),
    });
  } catch (error) {
    console.error("GET /api/customer/branch/capacity error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check branch capacity",
      },
      { status: 500 },
    );
  }
}
