import { requireSuperAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Branch } from "@/models/Branch";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const data = await Branch.find({isActive: true}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/branches error: ", error);
    return NextResponse.json(
      {
        error: "Failed to fetch branches",
      },
      { status: 500 },
    );
  }
}

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required").trim(),
  address: z.string().min(1, "Address is required").trim(),
  contactNumber: z.string().optional(),
  open: z.string().optional(),
  close: z.string().optional(),
  location: z.object({
    coordinates: z
      .array(z.number())
      .length(2, "Coordinates must be [longitude, latitude]"),
  }),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireSuperAdmin(request)

    const body = await request.json();
    const parsed = branchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, address, contactNumber, open, close, location } = parsed.data;

    // Generate unique branch code
    const count = await Branch.countDocuments();
    const code = `BR-${String(count + 1).padStart(3, "0")}`;

    const data = await Branch.create({
      name,
      code,
      address,
      contactNumber,
      operatingHours: {
        open,
        close,
      },
      location: {
        type: "Point",
        coordinates: location.coordinates, // [longitue, latitude] as GeoJSON format
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/branches error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create branch",
      },
      { status: 500 },
    );
  }
}
