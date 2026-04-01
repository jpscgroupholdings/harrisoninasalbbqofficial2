import { COOKIE_NAMES } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAMES.CUSTOMER_TOKEN)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    await connectDB();

    const customer = await Customer.findById(payload.id).lean();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found!" },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.error instanceof Error ? error.message : "Failed to fetch user",
      },
      { status: 500 },
    );
  }
}
