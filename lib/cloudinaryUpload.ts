import cloudinary from "@/lib/cloudinary";

/** Consistent image result shape used across all models */
export type CloudinaryImage = {
  url: string;
  public_id: string;
};

type UploadOptions = {
  /** Cloudinary folder path, e.g. "products", "admin_profile", "customer_profile" */
  folder: string;
  /** Optional transformations applied to the uploaded image */
  transformation?: Record<string, unknown>[];
  /** Public ID of a previous image to destroy before uploading the new one */
  oldPublicId?: string;
};

/**
 * Centralized Cloudinary upload helper.
 *
 * Accepts a base64 data-URI string, uploads it to the specified folder,
 * optionally destroys the previous image, and returns the consistent
 * `{ url, public_id }` shape used by Product, Category, Staff, etc.
 */
export async function uploadToCloudinary(
  imageFile: string,
  options: UploadOptions,
): Promise<CloudinaryImage> {
  const { folder, transformation, oldPublicId } = options;

  // Remove the previous image from Cloudinary if one exists
  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId);
  }

  const result = await cloudinary.uploader.upload(imageFile, {
    folder,
    transformation: transformation ?? [
      { quality: "auto", format: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Destroy a Cloudinary image by its public ID.
 * Returns true if successfully deleted.
 */
export async function destroyCloudinaryImage(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === "ok";
}
