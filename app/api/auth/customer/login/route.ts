import { COOKIE_NAMES } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
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
        { error: "Required field must be filled!" },
        { status: 400 },
      );
    }

    const userFound = await Customer.findOne({ email }).select("+password");

    if (!userFound) {
      return NextResponse.json(
        { error: "Account not found!" },
        { status: 404 },
      );
    }

    if (!userFound.isActive) {
      return NextResponse.json(
        { error: "Account locked. Please try again!" },
        { status: 403 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, userFound.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials!" },
        { status: 401 },
      );
    }

    // sign JWT - this becomes payload
    const token = await new SignJWT({
      id: userFound._id.toString(),
      email: userFound.email,
      fullname: userFound.fullname || "Name not found!",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      message: "Login Successfully!",
      user: {
        id: userFound._id,
        fullname: userFound.fullname,
        email: userFound.email,
        phone: userFound.phone || "",
      },
    });

    // set HTTP only cookies
    response.cookies.set(COOKIE_NAMES.CUSTOMER_TOKEN, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to login",
      },
      { status: 500 },
    );
  }
}
