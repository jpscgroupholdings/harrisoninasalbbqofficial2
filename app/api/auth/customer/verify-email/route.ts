import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SignJWT } from "jose";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { COOKIE_NAMES } from "@/lib/getAuth";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get("token");
    const email = searchParams.get("email");

    const appUrl = process.env.NEXT_PUBLIC_URL ?? "";

    // ── Validate params ───────────────────────────────────────────────
    if (!rawToken || !email) {
      return NextResponse.redirect(`${appUrl}/verify-error?reason=invalid_link`);
    }

    await connectDB();

    // ── Hash the incoming token to compare with DB ────────────────────
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // ── Find customer with matching token ─────────────────────────────
    const customer = await Customer.findOne({ email: email.toLowerCase() })
      .select("+verificationToken +verificationTokenExpiry");

    if (!customer) {
      return NextResponse.redirect(`${appUrl}/verify-error?reason=not_found`);
    }

    // ── Already verified ──────────────────────────────────────────────
    if (customer.isEmailVerified) {
      return NextResponse.redirect(`${appUrl}/?verified=already`);
    }

    // ── Check token match ─────────────────────────────────────────────
    if (customer.verificationToken !== hashedToken) {
      return NextResponse.redirect(`${appUrl}/verify-error?reason=invalid_token`);
    }

    // ── Check token expiry ────────────────────────────────────────────
    if (!customer.verificationTokenExpiry || customer.verificationTokenExpiry < new Date()) {
      return NextResponse.redirect(`${appUrl}/verify-error?reason=expired`);
    }

    // ── Mark as verified, clear token ─────────────────────────────────
    await Customer.findByIdAndUpdate(customer._id, {
      isEmailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
    });

    // ── Sign JWT (same as login route) ────────────────────────────────
    const token = await new SignJWT({
      id: customer._id.toString(),
      email: customer.email,
      fullname: customer.fullname ?? "Name not found!",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    // ── Set cookie + redirect to dashboard ────────────────────────────
    const response = NextResponse.redirect(`${appUrl}/?verified=true`);

    response.cookies.set(COOKIE_NAMES.CUSTOMER_TOKEN, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;

  } catch (err) {
    console.error("[verify-email]", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.redirect(`${appUrl}/verify-error?reason=server_error`);
  }
}