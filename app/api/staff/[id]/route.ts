import { requireSuperAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { updateStaffSchema } from "@/lib/validations";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireSuperAdmin(request);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Staff id is required!" },
        { status: 400 },
      );
    }

    const staff = await Staff.findById(id);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found!" }, { status: 404 });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff status" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireSuperAdmin(request)

    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          error: "Staff id is required!",
        },
        { status: 400 },
      );
    }

    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { firstName, lastName, email, password, phone, role, branch } =
      parsed.data;

    const existing = await Staff.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const emailTaken = await Staff.findOne({ email, _id: { $ne: id } });

      if (emailTaken) {
        return NextResponse.json(
          { error: "A staff account with this email already exists." },
          { status: 409 },
        );
      }
    }

    // Build update payload — Zod already converted empty branch → null and empty password → undefined
    const updatedFields: Record<string, any> = {
      firstName,
      lastName,
      email,
      phone,
      role,
      branch,
    };

    // Only hash if a new password was provided
    if (password) {
      updatedFields.password = await bcrypt.hash(password, 12);
    }

    const updated = await Staff.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    })
      .populate("branch", "name code")
      .lean();

    // Strip password from response
    const { password: _, ...staff } = updated as any;

    return NextResponse.json(staff, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update staff's details" },
      { status: 500 },
    );
  }
}
