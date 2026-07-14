import { getAPIError } from "@/lib/getApiError";
import { requireSuperAdmin } from "@/lib/getAuth";
import { handleReorderRequest } from "@/lib/reorder";
import { SubCategory } from "@/models/SubCategory";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { subcategories } = await request.json();
    const result = await handleReorderRequest(
      SubCategory,
      subcategories,
      "Subcategories",
    );
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failded to reorder subcategories",
    });
  }
}
