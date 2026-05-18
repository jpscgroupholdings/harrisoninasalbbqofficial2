import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";
import {
  assertStoreIsOpen,
  assertValidPayload,
  computeTax,
  dispatchOrderCreatedEvent,
  fetchBranch,
  persistOrder,
  reserveInventory,
  resolveCart,
  sendOrderConfirmationEmail,
} from "../../paymaya/checkout/route";

const MINIMUM_AMOUNT = 100;

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Guard: store open?
    await assertStoreIsOpen(session);

    // 2. Auth (optional customer)
    const customer = await requireBetterAuth();
    const customerId = customer?._id ?? null;

    // 3. Parse & validate body
    const body: CreateOrderPayload = await request.json();
    assertValidPayload(body);

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    // 5. Resolve cart items + reserve inventory
    const { totalPrice, orderItems } = await resolveCart(
      body.items,
      body.branchId,
      session,
    );

    if (totalPrice < MINIMUM_AMOUNT) {
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);
    }

    // 6. Tax breakdown
    const tax = computeTax(totalPrice);
    const referenceNumber = `ORDER-${Date.now()}`;

    // COD has no checkout gateway — pass empty string for checkoutId
    const checkoutId = "";

    // 8. Persist order
    const order = await persistOrder(
      body,
      branch,
      orderItems,
      tax,
      checkoutId,
      referenceNumber,
      customerId,
      session,
    );

    // 9. Reserve inventory now that we have orderId
    await reserveInventory(orderItems, body.branchId, order._id, session);
    await session.commitTransaction();

    const paymentMethod = order?.paymentInfo?.paymentMethod;

    // 10. Side effects (after commit — failures are non-fatal)
    await Promise.allSettled([
      dispatchOrderCreatedEvent(
        order._id.toString(),
        referenceNumber,
        paymentMethod,
      ),
      sendOrderConfirmationEmail(order),
    ]);

    return NextResponse.json(
      {
        success: true,
        referenceNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to checkout!",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
