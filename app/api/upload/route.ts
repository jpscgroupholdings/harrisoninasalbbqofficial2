import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/getAuth";
import {
  uploadToCloudinary,
  destroyCloudinaryImage,
} from "@/lib/cloudinaryUpload";
import { getAPIError } from "@/lib/getApiError";

/**
 * POST /api/upload
 * General-purpose image upload for products (superadmin only).
 * Accepts FormData with a file field, validates type (image only) and size (max 5MB).
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return getAPIError("No file provided", 400);
    }

    if (!file.type.startsWith("image/")) {
      return getAPIError("Only image files are allowed");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return getAPIError("File size exceeds 5MB limit");
    }

    // Convert file to base64 data-URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const image = await uploadToCloudinary(dataURI, {
      folder: "products",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      success: true,
      secure_url: image.url,
      public_id: image.public_id,
    });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Upload failed. Please try again.",
    });
  }
}

/**
 * DELETE /api/upload?publicId=...
 * Removes a Cloudinary image by its public ID (superadmin only).
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return getAPIError("Public ID is required", 400);
    }

    const success = await destroyCloudinaryImage(publicId);

    return NextResponse.json({ success });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to delete image",
    });
  }
}
