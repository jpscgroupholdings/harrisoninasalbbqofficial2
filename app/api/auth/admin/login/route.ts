import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // check if user exists
    const staff = await Staff.findOne({ email}).select("+password");
    if (!staff) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if(!staff.isActive){
      return NextResponse.json(
        { error: "Account Locked. Please contact your upline" },
        { status: 403 },
      );
    }

    // check if password is correct
    const isValid = await bcrypt.compare(password, staff.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // sign JWT
    const token = await new SignJWT({
      id: staff._id.toString(),
      email: staff.email,
      role: staff.role,
      branch: staff.branch ? staff.branch.toString() : null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      message: "Login successfully!",
      user: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
      },
    });

    // set HTTP only cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hrs
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login Failed" },
      { status: 500 },
    );
  }
}
