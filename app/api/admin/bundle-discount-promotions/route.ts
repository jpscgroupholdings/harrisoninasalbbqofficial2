import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { BundleDiscountPromotion } from "@/models/BundleDiscountPromotion";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const data = await BundleDiscountPromotion.find({})
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch list of bundle discount promotion",
      },
      { status: 500 },
    );
  }
}
