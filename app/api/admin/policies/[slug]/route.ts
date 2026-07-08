import { POLICY_SLUGS, policyFallbackMap } from "@/data/policyData";
import { getAPIError } from "@/lib/getApiError";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { Policy } from "@/models/Policy";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const admin = await requireAdmin(request);

    if (!canAccess(admin.role, "legal.read")) {
      return getAPIError("Forbidden", 403);
    }

    const { slug } = await params;

    if (!POLICY_SLUGS.includes(slug)) {
      return getAPIError("Invalid policy slug", 400);
    }

    const policy = await Policy.findOne({ slug }).lean();

    if (!policy) {
      /** Show fallback data so admin can preview before seeding */
      const fallback = policyFallbackMap.get(slug);
      if (!fallback) {
        return getAPIError("Policy not found", 404);
      }
      return NextResponse.json(
        { data: fallback, seeded: false },
        { status: 200 },
      );
    }

    return NextResponse.json({ data: policy, seeded: true }, { status: 200 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch policy",
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const admin = await requireAdmin(request);

    if (!canAccess(admin.role, "legal.update")) {
      return getAPIError("Forbidden", 403);
    }

    const { slug } = await params;

    if (!POLICY_SLUGS.includes(slug)) {
      return getAPIError("Invalid policy slug", 400, {
        extra: {
          validSlugs: POLICY_SLUGS,
        },
      });
    }

    const body = await request.json();

    /** Validate required fields */
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.subtitle || typeof body.subtitle !== "string") {
      return NextResponse.json(
        { error: "Subtitle is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.sections) || body.sections.length === 0) {
      return NextResponse.json(
        { error: "At least one section is required" },
        { status: 400 },
      );
    }

    for (const section of body.sections) {
      if (!section.heading || typeof section.heading !== "string") {
        return NextResponse.json(
          { error: "Each section must have a heading" },
          { status: 400 },
        );
      }

      if (!section.content || typeof section.content !== "string") {
        return NextResponse.json(
          { error: "Each section must have content" },
          { status: 400 },
        );
      }
    }

    const updated = await Policy.findOneAndUpdate(
      { slug },
      {
        $set: {
          title: body.title.trim(),
          subtitle: body.subtitle.trim(),
          sections: body.sections.map(
            (s: { heading: string; content: string }) => ({
              heading: s.heading.trim(),
              content: s.content.trim(),
            }),
          ),
          lastUpdatedBy: {
            staffId: admin._id,
            name: `${admin.firstName} ${admin.lastName}`,
          },
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return NextResponse.json(
      {
        message: "Policy updated successfully",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to update policy",
    });
  }
}
