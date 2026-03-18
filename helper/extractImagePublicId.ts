export function extractPublicId(url: string): string {
  try {
    const parts = url.split("/upload/")[1];
    // v1771405509/products/xxxx.png

    const withoutVersion = parts.replace(/^v\d+\//, "");
    // products/xxxx.png

    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
    // products/xxxx

    return publicId;
  } catch (error) {
    return "";
  }
}