import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import "@/models/Branch"; // Ensure Branch model is registered for population
import { COOKIE_NAMES } from "@/lib/getAuth";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAMES.ADMIN_TOKEN)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    let payload;

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (jwtError: any) {
      return NextResponse.json(
        {
          error: "Invalid or expired token",
          details: jwtError.message,
        },
        { status: 401 }
      );
    }

    await connectDB();

    if (!payload.id) {
      return NextResponse.json(
        { error: "Invalid token payload: missing id" },
        { status: 400 }
      );
    }

    const adminData = await Staff.findById(payload.id)
      .populate("branch", "name code address")
      .lean();

    if (!adminData) {
      return NextResponse.json(
        { error: `Admin not found with id: ${payload.id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(adminData);
  } catch (error: any) {
    console.error("🔥 GET /admin error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}