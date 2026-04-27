import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageFile, oldPublicId } = body;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required!" },
        { status: 400 },
      );
    }

    if(oldPublicId){
        await cloudinary.uploader.destroy(oldPublicId);
    }

    const uploadResult = await cloudinary.uploader.upload(imageFile, {
      folder: "customer_profile",
    });

    const secure_url = uploadResult.secure_url;
    const public_id = uploadResult.public_id

    return NextResponse.json({ secure_url, public_id}, { status: 201 }); // response as object
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
