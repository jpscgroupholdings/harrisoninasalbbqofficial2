import { connectDB } from "@/lib/mongodb";
import { getActiveProductDiscountPreviews } from "@/lib/product-promotions/product-promotion.application";
import { isPromotionScheduleActive } from "@/lib/promotions/promotions.service";
import "@/lib/registerModels";
import { Product } from "@/models/Product";
import { ProductDiscountPromotion } from "@/models/ProductDiscountPromotion";
import { Settings } from "@/models/Setting";
import { STOCK_STATUSES } from "@/types/inventory_types";
import type {
  PromotionDiscountDay,
  PromotionDiscountDayMode,
  PromotionDiscountType,
} from "@/types/promotions/promotion-constant";
import { buildPaginationMeta, parsePagination } from "@/utils/query-helpers";
import mongoose, { type PipelineStage } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type ProductDiscountPromotionRecord = {
  products: {
    product: mongoose.Types.ObjectId;
  }[];
  startsAt: Date;
  endsAt?: Date | null;
  dayMode: PromotionDiscountDayMode;
  days: PromotionDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions?: number | null;
  redemptionCount: number;
  discountType: PromotionDiscountType;
  discountValue: number;
};

type ModifierProductAggregate = {
  _id?: { toString: () => string };
  name?: string;
  price?: number | null;
  image?: {
    url?: string;
    public_id?: string;
  };
  productType?: string;
};

type ModifierItemAggregate = {
  product?: ModifierProductAggregate | null;
  quantity: number;
  label?: string | null;
  price?: number | null;
  snapshotName?: string | null;
  snapshotPrice?: number | null;
};

type ModifierGroupAggregate = {
  _id?: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  items: ModifierItemAggregate[];
};

type DiscountedProductAggregate = {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image?: {
    url?: string;
    public_id?: string;
  };
  info?: string;
  description?: string;
  category?: {
    _id?: mongoose.Types.ObjectId;
    name?: string;
  };
  subcategory?: {
    _id?: mongoose.Types.ObjectId;
    name?: string;
  } | null;
  productType?: string;
  modifierGroups?: ModifierGroupAggregate[];
  paxCount?: number | null;
  isPopular?: boolean;
  isSignature?: boolean;
  quantity?: number;
  status?: string;
};

function getUniqueProductIds(promotions: ProductDiscountPromotionRecord[]) {
  const productIds = new Map<string, mongoose.Types.ObjectId>();

  for (const promotion of promotions) {
    for (const product of promotion.products) {
      productIds.set(product.product.toString(), product.product);
    }
  }

  return [...productIds.values()];
}

function normalizeProduct(
  product: DiscountedProductAggregate,
  discountPreviews: Awaited<ReturnType<typeof getActiveProductDiscountPreviews>>,
) {
  return {
    _id: product._id.toString(),
    name: product.name,
    price: product.price,
    image: {
      url: product.image?.url || "",
      public_id: product.image?.public_id || "",
    },
    info: product.info || "Product info is not available",
    description: product.description || "Product description is not available",
    category: {
      _id: product.category?._id?.toString() || "",
      name: product.category?.name || "Uncategorized",
    },
    subcategory: product.subcategory?._id
      ? {
          _id: product.subcategory._id.toString(),
          name: product.subcategory.name,
        }
      : null,
    productType: product.productType || "solo",
    modifierGroups:
      product.modifierGroups?.map((group: ModifierGroupAggregate) => ({
        _id: group._id?.toString(),
        name: group.name,
        required: group.required,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        items:
          group.items?.map((item: ModifierItemAggregate) => ({
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
              : "",
            quantity: item.quantity,
            label: item.label,
            price: item.price,
            snapshotName: item.snapshotName,
            snapshotPrice: item.snapshotPrice,
          })) || [],
      })) || [],
    paxCount: product.paxCount,
    isPopular: product.isPopular || false,
    isSignature: product.isSignature || false,
    activeProductDiscount: discountPreviews.get(product._id.toString()) ?? null,
    ...(product.quantity != null && { quantity: product.quantity }),
    ...(product.status && { status: product.status }),
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const pagination = parsePagination(searchParams, {
      defaultLimit: 8,
      maxLimit: 24,
    });
    const page = pagination.page;
    const limit = Math.max(1, pagination.limit);
    const skip = (page - 1) * limit;

    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json(
        { error: "Invalid branchId." },
        { status: 400 },
      );
    }

    const now = new Date();
    const settings = await Settings.findOne().select({ operatingHours: 1 });
    const operatingHours = settings?.operatingHours ?? null;
    const promotions = await ProductDiscountPromotion.find({
      enabled: true,
      startsAt: { $lte: now },
      $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
      $and: [
        {
          $or: [
            { maximumRedemptions: null },
            {
              $expr: {
                $lt: ["$redemptionCount", "$maximumRedemptions"],
              },
            },
          ],
        },
      ],
    })
      .select({
        products: 1,
        startsAt: 1,
        endsAt: 1,
        dayMode: 1,
        days: 1,
        startTime: 1,
        endTime: 1,
        maximumRedemptions: 1,
        redemptionCount: 1,
        discountType: 1,
        discountValue: 1,
      })
      .lean<ProductDiscountPromotionRecord[]>();

    const activePromotions = promotions.filter((promotion) =>
      isPromotionScheduleActive(promotion, operatingHours, now),
    );
    const discountedProductIds = getUniqueProductIds(activePromotions);

    if (discountedProductIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          branchId: branchId ?? null,
          data: [],
          pagination: buildPaginationMeta(0, page, limit),
        },
        { status: 200 },
      );
    }

    const productMatch = {
      _id: { $in: discountedProductIds },
      price: { $gt: 0 },
    };

    // lookup inventory if branchId is provided, then determine stock status 
    const inventoryStages: PipelineStage[] = branchId
      ? [
          {
            $lookup: {
              from: "inventories",
              let: { productId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$productId", "$$productId"] },
                        {
                          $eq: [
                            "$branchId",
                            { $toObjectId: branchId },
                          ],
                        },
                      ],
                    },
                  },
                },
                { $project: { quantity: 1, reorderLevel: 1 } },
              ],
              as: "inventory",
            },
          },
          {
            $addFields: {
              quantity: {
                $ifNull: [{ $arrayElemAt: ["$inventory.quantity", 0] }, 0],
              },
              reorderLevel: {
                $ifNull: [{ $arrayElemAt: ["$inventory.reorderLevel", 0] }, 10],
              },
            },
          },
          { $unset: "inventory" },
          {
            $addFields: {
              status: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$quantity", 0] },
                      then: STOCK_STATUSES.OUT_OF_STOCK,
                    },
                    {
                      case: { $lte: ["$quantity", "$reorderLevel"] },
                      then: STOCK_STATUSES.LOW_STOCK,
                    },
                  ],
                  default: STOCK_STATUSES.IN_STOCK,
                },
              },
            },
          },
        ]
      : [];

    // if no branchId, skip inventory lookup and default to in stock with null quantity
    const basePipeline: PipelineStage[] = [
      { $match: productMatch },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "modifierGroups.items.product",
          foreignField: "_id",
          as: "_modifierProducts",
        },
      },
      {
        $addFields: {
          modifierGroups: {
            $map: {
              input: { $ifNull: ["$modifierGroups", []] },
              as: "group",
              in: {
                _id: "$$group._id",
                name: "$$group.name",
                required: "$$group.required",
                minSelect: "$$group.minSelect",
                maxSelect: "$$group.maxSelect",
                items: {
                  $map: {
                    input: { $ifNull: ["$$group.items", []] },
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
                      quantity: "$$item.quantity",
                      label: "$$item.label",
                      price: "$$item.price",
                      snapshotName: "$$item.snapshotName",
                      snapshotPrice: "$$item.snapshotPrice",
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $unset: "_modifierProducts" },
      ...inventoryStages,
      { $sort: { "category.position": 1, name: 1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          image: 1,
          info: 1,
          description: 1,
          category: { _id: "$category._id", name: "$category.name" },
          subcategory: { _id: "$subcategory._id", name: "$subcategory.name" },
          productType: 1,
          modifierGroups: 1,
          paxCount: 1,
          isPopular: 1,
          isSignature: 1,
          quantity: 1,
          status: 1,
        },
      },
    ];

    // Execute count and paginated query in parallel
    const [countResult, products] = await Promise.all([
      Product.aggregate([...basePipeline, { $count: "total" }]),
      Product.aggregate<DiscountedProductAggregate>([
        ...basePipeline,
        { $skip: skip },
        { $limit: limit },
      ]),
    ]);
    const total = countResult[0]?.total ?? 0;
    const discountPreviews = await getActiveProductDiscountPreviews(
      products.map((product) => ({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      })),
    );
    const result = products
      .map((product) => normalizeProduct(product, discountPreviews))
      .filter((product) => product.activeProductDiscount);

    return NextResponse.json(
      {
        success: true,
        branchId: branchId ?? null,
        data: result,
        pagination: buildPaginationMeta(total, page, limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DISCOUNTED_PRODUCTS] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch discounted products.",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching discounted products.",
      },
      { status: 500 },
    );
  }
}
