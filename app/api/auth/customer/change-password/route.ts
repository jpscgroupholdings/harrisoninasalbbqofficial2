import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { changePasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { APIError } from "better-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POSTS /api/auth/customer/change-password
 * Allows an authenticated customer to change their password after login.
 * Uses the Better Auth session to verify identity, so current password is not required.
 */

export async function POST(request: NextRequest) {
  try {
    // Verify the customer is authenticatedf via Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Your must be logged in to change your password",
        },
        { status: 401 },
      );
    }

    // Check if the user has a credential acccount (not 0Auth-only)
    const accounts = await auth.api.listUserAccounts({
      headers: request.headers,
    });

    const hasCredentialAccount = accounts?.some(
      (acc: { providerId: string }) => acc.providerId === "credential",
    );

    if (!hasCredentialAccount) {
      return NextResponse.json(
        {
          error:
            "Your account uses Google sign-in. Password management is handled by Google.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { newPassword } = parsed.data;

    await connectDB();

    // Find the user's credential account and update the password
    // Better Auth stores password in the "account" collection with providerId "credential"
    const db = (await connectDB()).connection.db;
    const accountCollection = db.collection("account");

    const credentialAccount = await accountCollection.findOne({
      userId: session.session.userId,
      providerId: "credential",
    });

    if (!credentialAccount) {
      return NextResponse.json(
        {
          error:
            "No password account found. You may be using Google sign-in only.",
        },
        { status: 400 },
      );
    }

    // Hash the password and update the account
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await accountCollection.updateOne(
      { _id: credentialAccount._id },
      { $set: { password: hashedPassword } },
    );

    return NextResponse.json(
      {
        message: "Password updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to change password",
      },
      { status: 500 },
    );
  }
}
