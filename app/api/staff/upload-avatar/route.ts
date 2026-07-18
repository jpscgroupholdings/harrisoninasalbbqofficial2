import { requireAdmin } from "@/lib/getAuth";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { NextRequest, NextResponse } from "next/server";
import { getAPIError } from "@/lib/getApiError";

/**
 * POST /api/staff/upload-avatar
 * Uploads an admin's profile avatar to Cloudinary under the admin_profile folder.
 * Accepts a base64-encoded imageFile and an optional oldPublicId to destroy the previous image.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { imageFile, oldPublicId } = body;

    if (!imageFile) {
      return getAPIError("Image file is required", 400);
    }

    const image = await uploadToCloudinary(imageFile, {
      folder: "admin_profile",
      oldPublicId,
      transformation: [
        { width: 512, height: 512, crop: "fill" },
        { quality: "auto", format: "auto" },
      ],
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to upload avatar",
    });
  }
}
