import { connectDB } from "@/lib/mongodb";
import { changePasswordSchema } from "@/lib/validations";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getAuth";

/**
 * POST /api/auth/admin/change-password
 * Allows an authenticated admin to change their own password.
 * Session is validated via the admin_token cookie, so current password is not required.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify the admin is authenticated and active
    const admin = await requireAdmin(request);

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { newPassword } = parsed.data;

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Staff.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } },
    );

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to change password",
      },
      { status: 500 },
    );
  }
}
