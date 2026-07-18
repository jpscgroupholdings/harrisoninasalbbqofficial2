import { getAPIError } from "@/lib/getApiError";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { updateProfileSchema } from "@/lib/validations";
import Staff from "@/models/Staff";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/staff/profile
 * Allows an authenticated admin to update their own profile details.
 * Only name, phone, and image can be changed — role/email/password are excluded.
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin(request);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return getAPIError(firstError, 400);
    }

    const { firstName, lastName, phone, image } = parsed.data;

    const updateFields: Record<string, unknown> = {
      firstName,
      lastName,
      phone,
    };

    // Only update image when provided
    if (image) {
      updateFields["image.url"] = image.url;
      updateFields["image.public_id"] = image.public_id;
    }

    const updated = await Staff.findByIdAndUpdate(admin._id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("branch", "name code")
      .lean();

    // Strip password from response
    const { password: _, ...staff } = updated as any;

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to update profile",
    });
  }
}
