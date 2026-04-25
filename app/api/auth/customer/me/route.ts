import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ _id: session.user.id })
    .select("shippingAddress")
    .lean();

  return NextResponse.json({ shippingAddress: user?.shippingAddress ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    { _id: session.user.id },
    { $set: { shippingAddress: address } },
    { new: true, select: "shippingAddress" },
  ).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, address: user.shippingAddress });
}