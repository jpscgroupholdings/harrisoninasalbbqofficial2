import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Policy } from "@/models/Policy";
import { POLICY_SLUGS } from "@/data/policyData";

/**
 * GET /api/policies/[slug]
 *
 * Public endpoint — fetches a single policy by slug from the database.
 * No authentication required. Returns 404 if no record exists
 * (policies must be seeded by admin first).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!POLICY_SLUGS.includes(slug)) {
      return NextResponse.json(
        { error: "Invalid policy slug", validSlugs: POLICY_SLUGS },
        { status: 400 },
      );
    }

    const policy = await Policy.findOne({ slug }).lean();

    if (!policy) {
      return NextResponse.json(
        { data: null },
        { status: 200 },
      );
    }

    return NextResponse.json({ data: policy }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch policy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
