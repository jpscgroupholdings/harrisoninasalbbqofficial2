import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models/Cart";
import { requireBetterAuth } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectDB();
    const customer = await requireBetterAuth(request);

    if (!customer) return NextResponse.json({ items: [] });

    const cart = await Cart.findOne({ customerId: customer._id }).lean();
    return NextResponse.json({ items: cart?.items ?? [] });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const customer = await requireBetterAuth(request);
    const { items = [] } = await request.json();

    await Cart.findOneAndUpdate(
      { customerId: customer._id },
      {
        items,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save cart" }, { status: 500 });
  }
}
