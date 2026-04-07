import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/getAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    
    await requireAdmin(request);
    const result = await cloudinary.api.resources({
      type: "upload",
      max_results: 50,
      resource_type: "image",
    });

    return NextResponse.json(result); // { resources: [...]}
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch cloudinary images",
      },
      { status: 500 },
    );
  }
}
