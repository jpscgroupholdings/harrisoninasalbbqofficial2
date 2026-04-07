import { requireSuperAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Branch } from "@/models/Branch";
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
            : "Failed to update branch status",
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
    await requireSuperAdmin(request)

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

    const { name, address, contactNumber, open, close, location } = body;

    // Validate required fields
    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        {
          error: "Branch name and address are required",
        },
        { status: 400 },
      );
    }

    // Validate location coordinates if provided
    if (
      location &&
      (!location.coordinates || location.coordinates.length !== 2)
    ) {
      return NextResponse.json(
        {
          error: "Invalid location coordinates. Expected [longitude, latitude]",
        },
        { status: 400 },
      );
    }

    // Build update object
    const updatedData: any = {
      name,
      address,
      contactNumber,
      operatingHours: {
        open,
        close,
      },
    };

    // only update location if provided
    if (location) {
      updatedData.location = {
        type: "Point",
        coordinates: location.coordinates, // [longitude, latitude]
      };
    }

    const updated = await Branch.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT /api/branches/[id] error:", error);
    return NextResponse.json(
      {
        error: "Faield to update branch",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireSuperAdmin(request)

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Branch id is required",
        },
        { status: 400 },
      );
    }

    const deleted = await Branch.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Branch deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/branches/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete branch",
      },
      { status: 500 },
    );
  }
}
