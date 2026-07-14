import "@/lib/registerModels";
import { connectDB } from "@/lib/mongodb";
import { ModifierGroupTemplate } from "@/models/ModifierGroupTemplate";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/getAuth";
import { getAPIError } from "@/lib/getApiError";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { modifierItemSchema } from "@/types/modifier-zod";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const templateCreateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  required: z.boolean().default(true),
  minSelect: z.coerce.number().int().min(1).default(1),
  maxSelect: z.coerce.number().int().min(1).default(1),
  items: z
    .array(modifierItemSchema)
    .min(1, "Template must have at least one item"),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/modifier-group-templates
 * List all modifier group templates with populated product references
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await requireSuperAdmin(request);

    if (!canAccess(superadmin.role, "modifier-groups.read")) {
      return getAPIError("Forbidden", 403);
    }

    const templates = await ModifierGroupTemplate.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "products",
          let: { templateId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$modifierGroups.templateId", "$$templateId"] } } },
            { $count: "total" },
          ],
          as: "_productCount",
        },
      },
      { $addFields: { productCount: { $ifNull: [{ $arrayElemAt: ["$_productCount.total", 0] }, 0] } } },
      { $unset: "_productCount" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "_modifierProducts",
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: { $ifNull: ["$items", []] },
              as: "item",
              in: {
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$_modifierProducts",
                        as: "p",
                        cond: { $eq: ["$$p._id", "$$item.product"] },
                      },
                    },
                    0,
                  ],
                },
                label: "$$item.label",
                price: "$$item.price",
                snapshotName: "$$item.snapshotName",
                snapshotPrice: "$$item.snapshotPrice",
                position: "$$item.position",
              },
            },
          },
        },
      },
      { $unset: "_modifierProducts" },
    ]);

    const normalized = templates.map((t) => ({
      ...t,
      _id: t._id?.toString(),
      productCount: t.productCount ?? 0,
      items: t.items?.map((item: any) => ({
        ...item,
        product: item.product
          ? {
              _id: item.product._id?.toString() || "",
              name: item.product.name || "",
              price: item.product.price ?? null,
              image: {
                url: item.product.image?.url || "",
                public_id: item.product.image?.public_id || "",
              },
              productType: item.product.productType || "solo",
            }
          : null,
      })),
    }));

    return NextResponse.json({ data: normalized }, { status: 200 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch modifier group templates",
    });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/modifier-group-templates
 * Create a new reusable modifier group template
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await requireSuperAdmin(request);

    if (!canAccess(superadmin.role, "modifier-groups.create")) {
      return getAPIError("Forbidden", 403);
    }

    const body = await request.json();
    const validated = templateCreateSchema.parse(body);

    const template = await ModifierGroupTemplate.create({
      name: validated.name,
      required: validated.required,
      minSelect: validated.minSelect,
      maxSelect: validated.maxSelect,
      items: validated.items.map((item, idx) => ({
        product: item.product,
        label: item.label ?? null,
        price: item.price ?? null,
        snapshotName: item.snapshotName ?? item.label ?? null,
        snapshotPrice: item.snapshotPrice ?? null,
        position: item.position ?? idx + 1,
      })),
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to create modifier group template",
    });
  }
}
