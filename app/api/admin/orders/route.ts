/**
 * GET /api/admin/orders
 *
 * Fetch all orders with smart sorting using STATUS_PRIORITY.
 * Supports paymentFilter param for tab-based filtering:
 *   - "confirmed" (default): excludes PENDING_PAYMENT and unconfirmed Maya orders
 *   - "unpaid": shows Maya orders without payment confirmation (not PENDING_PAYMENT)
 *   - omitted + explicit status: shows matching status only
 */

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getAuth";
import { STAFF_ROLES } from "@/types/staff";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { queryOrders, countOrders } from "@/services/order/order.service";
import { parseRequestQuery } from "@/utils/query-helpers";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";
import { getValidObjectId } from "@/helper/getValidObjectIds";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin(request);
    if (!canAccess(admin.role, "orders.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { page, limit, skip, sort, match } = parseRequestQuery(request, {
      exactFields: ["status"],
      searchFields: [
        "paymentInfo.firstName",
        "paymentInfo.lastName",
        "paymentInfo.customerEmail",
        "paymentInfo.customerPhone",
        "status",
        "paymentInfo.referenceNumber",
        "items.name",
        "paymentInfo.shippingAddress.city",
        "branchSnapshot.name",
        "fulfillmentType"
      ],
      defaultLimit: 20,
      maxLimit: 50,
      defaultSort: { status: 1, createdAt: -1 },
    });

    const paymentFilter = request.nextUrl.searchParams.get("paymentFilter");

    // Separate search $or from other match fields to prevent $or collision.
    // MongoDB cannot have two top-level $or keys — the second silently overwrites the first,
    // which was breaking search on tabs that also need a payment-confirmation $or.
    const searchOr = match.$or as Record<string, any>[] | undefined;
    const baseMatch = { ...match };
    if (searchOr) delete baseMatch.$or;

    const filter: Record<string, any> = { ...baseMatch };

    // Build the payment/tab $or separately so we can combine it with search via $and
    let paymentOr: Record<string, any>[] | undefined;

    // When a specific status is explicitly requested, show only that status
    // (includes PENDING_PAYMENT if the admin selects that tab)
    if (match.status) {
      // For PENDING status: exclude unconfirmed Maya orders
      // (COD orders always shown; Maya orders need PAYMENT_SUCCESS + valid paymentId)
      if (match.status === ORDER_STATUSES.PENDING) {
        paymentOr = [
          { "paymentInfo.paymentMethod": { $ne: "maya" } },
          {
            "paymentInfo.paymentStatus": PAYMENT_STATUSES.PAYMENT_SUCCESS,
            "paymentInfo.paymentId": { $exists: true, $nin: [null, ""] },
          },
        ];
      }
      // Other single statuses or $in groups: no additional payment filter
    } else if (paymentFilter === "unpaid") {
      // "Unpaid" tab: Maya orders where payment is NOT confirmed, excluding PENDING_PAYMENT
      filter.status = { $ne: ORDER_STATUSES.PENDING_PAYMENT };
      filter["paymentInfo.paymentMethod"] = "maya";
      paymentOr = [
        {
          "paymentInfo.paymentStatus": {
            $ne: PAYMENT_STATUSES.PAYMENT_SUCCESS,
          },
        },
        { "paymentInfo.paymentId": { $in: [null, ""] } },
        { "paymentInfo.paymentId": { $exists: false } },
      ];
    } else {
      // Default / "All" tab: exclude PENDING_PAYMENT and unconfirmed Maya orders
      filter.status = { $ne: ORDER_STATUSES.PENDING_PAYMENT };
      paymentOr = [
        // COD orders are always shown — payment happens on delivery
        { "paymentInfo.paymentMethod": { $ne: "maya" } },
        // Maya orders with confirmed payment (PAYMENT_SUCCESS + valid paymentId)
        {
          "paymentInfo.paymentStatus": PAYMENT_STATUSES.PAYMENT_SUCCESS,
          "paymentInfo.paymentId": { $exists: true, $nin: [null, ""] },
        },
      ];
    }

    // Combine search $or and payment $or properly.
    // Both must be satisfied simultaneously — use $and to prevent $or collision.
    if (searchOr && paymentOr) {
      filter.$and = [{ $or: searchOr }, { $or: paymentOr }];
    } else if (searchOr) {
      filter.$or = searchOr;
    } else if (paymentOr) {
      filter.$or = paymentOr;
    }

    const requestedBranchId = request.nextUrl.searchParams.get("branchId");

    if (
      admin.role === STAFF_ROLES.SUPERADMIN ||
      admin.role === STAFF_ROLES.CASHIER
    ) {
      if (requestedBranchId && requestedBranchId !== "all") {
        const branchObjectId = getValidObjectId(requestedBranchId);

        if (!branchObjectId) {
          return NextResponse.json(
            { error: "Invalid branch id" },
            { status: 400 },
          );
        }

        filter.branchId = branchObjectId;
      }
    } else {
      if (!admin.branch)
        return NextResponse.json(
          { error: "No branch assigned" },
          { status: 403 },
        );

      const assignedBranchId = getValidObjectId(admin.branch);

      if (!assignedBranchId) {
        return NextResponse.json(
          { error: "Invalid assigned branch" },
          { status: 403 },
        );
      }

      filter.branchId = assignedBranchId;
    }

    const result = await queryOrders({
      filter,
      page,
      limit,
      skip,
      sort,
    });

    // Build tab counts (branch-only, no search/pagination)
    const branchFilter: Record<string, any> = {};
    if (filter.branchId) branchFilter.branchId = filter.branchId;

    // Reusable $or arrays for payment confirmation logic
    const confirmedPaymentOr = [
      { "paymentInfo.paymentMethod": { $ne: "maya" } },
      {
        "paymentInfo.paymentStatus": PAYMENT_STATUSES.PAYMENT_SUCCESS,
        "paymentInfo.paymentId": { $exists: true, $nin: [null, ""] },
      },
    ];

    const unconfirmedMayaOr = [
      {
        "paymentInfo.paymentStatus": { $ne: PAYMENT_STATUSES.PAYMENT_SUCCESS },
      },
      { "paymentInfo.paymentId": { $in: [null, ""] } },
      { "paymentInfo.paymentId": { $exists: false } },
    ];

    const tabFilters: Record<string, Record<string, any>> = {
      all: {
        ...branchFilter,
        status: { $ne: ORDER_STATUSES.PENDING_PAYMENT },
        $or: confirmedPaymentOr,
      },
      pending_payment: {
        ...branchFilter,
        status: ORDER_STATUSES.PENDING_PAYMENT,
      },
      unpaid: {
        ...branchFilter,
        status: { $ne: ORDER_STATUSES.PENDING_PAYMENT },
        "paymentInfo.paymentMethod": "maya",
        $or: unconfirmedMayaOr,
      },
      [ORDER_STATUSES.PENDING]: {
        ...branchFilter,
        status: ORDER_STATUSES.PENDING,
        $or: confirmedPaymentOr,
      },
      [ORDER_STATUSES.CONFIRMED]: {
        ...branchFilter,
        status: ORDER_STATUSES.CONFIRMED,
      },
      [ORDER_STATUSES.PREPARING]: {
        ...branchFilter,
        status: ORDER_STATUSES.PREPARING,
      },
      [ORDER_STATUSES.DISPATCH]: {
        ...branchFilter,
        status: ORDER_STATUSES.DISPATCH,
      },
      [ORDER_STATUSES.READY_FOR_PICKUP]: {
        ...branchFilter,
        status: ORDER_STATUSES.READY_FOR_PICKUP,
      },
      [ORDER_STATUSES.COMPLETED]: {
        ...branchFilter,
        status: ORDER_STATUSES.COMPLETED,
      },
      cancelled_group: {
        ...branchFilter,
        status: {
          $in: [
            ORDER_STATUSES.CANCELLED,
            ORDER_STATUSES.FAILED,
            ORDER_STATUSES.EXPIRED,
          ],
        },
      },
    };

    const tabCountsArray = await Promise.all(
      Object.entries(tabFilters).map(async ([key, f]) => [
        key,
        await countOrders(f),
      ]),
    );
    const tabCounts = Object.fromEntries(tabCountsArray);

    return NextResponse.json({ ...result, tabCounts });
  } catch (error: any) {
    if (error.message === "Unauthorized!") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
