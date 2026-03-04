import { connectDB } from "@/lib/mongodb";
import { Branch } from "@/models/Branch";
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
        {
          error: "Branch id is required!",
        },
        { status: 400 },
      );
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    branch.isActive = !branch.isActive;
    await branch.save();

    return NextResponse.json(branch);
  } catch (error) {
    console.error("PATCH /api/branch/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating the branch status.",
      },
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
          error: "Branch id is required!",
        },
        { status: 400 },
      );
    }

    const {
      name,
      street,
      city,
      zipCode,
      contactNumber,
      open,
      close,
      daysOpen,
    } = body;

    const updated = await Branch.findByIdAndUpdate(
      id,
      {
        name,
        address: {
          street,
          city,
          zipCode,
        },
        contactNumber,
        operatingHours: {
          open,
          close,
          daysOpen,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Faield to update branch",
      },
      { status: 500 },
    );
  }
}
