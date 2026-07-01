import { POLICY_SLUGS, policyFallbackMap } from "@/data/policyData";
import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { Policy } from "@/models/Policy";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  - list all policies (admin)
 * always returns all 4 policies. For eaech slug, returns the database recoerd if it exists;
 * otherwise returns static fallback data. Each policy includes a `seeded` boolean so the
 * admin knows which ones are live vs preview.
 *
 * POST  - seed All policies into the database from static fallback data. Used for initial setup
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin(request);

    if (!canAccess(admin.role, "legal.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const policies = await Policy.find().sort({ slug: 1 }).lean();

    //** Always return all 4 policies: DB data wehere seeded, fallback where not*/
    const merged = POLICY_SLUGS.map((slug) => {
      const dbPolicy = policies.find((p) => p.slug === slug);
      if (dbPolicy) {
        return { ...dbPolicy, seeded: true };
      }
      const fallback = policyFallbackMap.get(slug)!;
      return {
        ...fallback,
        seeded: false,
        lastUpdatedBy: null,
        createdAt: null,
        updatedAt: null,
      };
    });

    // true only when all policies have been seeded

    const allSeeded = merged.every((p) => p.seeded);

    return NextResponse.json(
      {
        data: merged,
        seeded: allSeeded,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch policies",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const admin = await requireAdmin(request);

    if (!canAccess(admin.role, "legal.update")) {
      return NextResponse.json({ error: "Forbidded" }, { status: 403 });
    }

    //** Upsert each fallback policy into the database */
    const policyFallbackData = Array.from(policyFallbackMap.values());
    const results = await Promise.all(
      policyFallbackData.map((fallback) =>
        Policy.findOneAndUpdate(
          { slug: fallback.slug },
          {
            $set: {
              title: fallback.title,
              subTitle: fallback.subtitle,
              sections: fallback.sections,
              lastUpdateBy: {
                staffId: admin._id,
                name: `${admin.firstName} ${admin.lastName}`,
              },
            },
          },
          { upsert: true, new: true, runValidators: true },
        ),
      ),
    );

    return NextResponse.json(
      {
        message: "Policies seeded successfully!",
        data: results,
        count: results.length,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to seed policies",
      },
      { status: 500 },
    );
  }
}
