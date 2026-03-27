import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    await connectDB();

    const adminData = await Staff.findById(payload.id)
      .populate("branch", "name code address")
      .lean();

    if (!adminData) {
      return NextResponse.json({ error: "Admin not found!" }, { status: 404 });
    }

    console.log(adminData);
    return NextResponse.json(adminData);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.error instanceof Error
            ? error.message
            : "Failed to fetch admin",
      },
      { status: 500 },
    );
  }
}
