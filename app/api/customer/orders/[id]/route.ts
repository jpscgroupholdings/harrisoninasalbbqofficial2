import { requireCustomerAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { queryOrders } from "@/lib/orders/orderService";
import { NextRequest, NextResponse } from "next/server";

// app/api/orders/guest/[id]/route.ts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const customer = await requireCustomerAuth(request);
  
  const { id } = await context.params;
  const order = await queryOrders({
    filter: { _id: id },
    limit: 1,
  });

  const found = order.data[0];
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block if belongs to registered customer
  if (found.customerId) {
    return NextResponse.json(
      { error: "Sign in to view this order.", code: "AUTH_REQUIRED" },
      { status: 403 },
    );
  }

  return NextResponse.json({ data: found });
}
