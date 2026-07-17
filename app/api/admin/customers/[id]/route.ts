import { getCustomerStats } from "@/services/customer/customer-stat.service";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import { getAPIError } from "@/lib/getApiError";

/**
 * GET /api/admin/customers/[id]
 * Returns a single customer with aggregated order stats.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { id } = await params;

    if (!getValidObjectId(id)) {
      return getAPIError("Invalid customer ID", 400);
    }

    const customer = await User.findById(id).lean();
    if (!customer) {
      return getAPIError("Customer not found", 404);
    }

    // Fetch order stats for this single customer
    const statsMap = await getCustomerStats([customer.email]);
    const stats = statsMap[customer.email] ?? { totalOrders: 0, totalSpent: 0 };

    return NextResponse.json(
      {
        data: {
          ...customer,
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch customer",
    });
  }
}

/**
 * PATCH /api/admin/customers/[id]
 * Toggle the banned/suspended status of a customer account.
 * Body: { action: "ban" | "unban" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (!getValidObjectId(id)) {
      return getAPIError("Invalid customer ID", 400);
    }

    if (action !== "ban" && action !== "unban") {
      return getAPIError("Invalid action. Must be ban or unban", 400);
    }

    const customer = await User.findById(id).lean();
    if (!customer) {
      return getAPIError("Customer not found", 404);
    }

    const banned = action === "ban";

    // Update the banned field directly in the user collection (Better Auth managed)
    await User.findByIdAndUpdate(id, { banned }, { new: true });

    return NextResponse.json(
      {
        message: `Customer ${banned ? "banned" : "unbanned"} successfully`,
        banned,
      },
      { status: 200 },
    );
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to update customer",
    });
  }
}
