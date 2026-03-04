import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
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

    const { firstName, lastName, email, password, phone, role, branch } = body;

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

    // only hash if new password provided
    const updatedFields: Record<string, any> = {
        firstName,
        lastName,
        email,
        phone,
        role,
        branch
    }

    if(password && password.trim().length > 0){
        updatedFields.password = await bcrypt.hash(password, 12)
    }

    const updated = await Staff.findByIdAndUpdate(id, updatedFields, {new: true, runValidators: true}).populate("branch", "name code").lean();

      // strip password from response
    const { password: _, ...staff } = updated as any;

     return NextResponse.json(staff, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff's details" },
      { status: 500 },
    );
  }
}
