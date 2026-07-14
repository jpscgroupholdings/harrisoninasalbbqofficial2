import { getAPIError } from "@/lib/getApiError";
import { requireSuperAdmin } from "@/lib/getAuth";
import { handleReorderRequest } from "@/lib/reorder";
import { Category } from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { categories } = await request.json();
    const result = await handleReorderRequest(
      Category,
      categories,
      "Categories",
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to reorder categories",
    });
  }
}
