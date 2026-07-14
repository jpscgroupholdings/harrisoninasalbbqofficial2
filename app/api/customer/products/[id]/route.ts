import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { STOCK_STATUSES } from "@/types/inventory_types";
import "@/lib/registerModels";
import { getActiveProductDiscountPreviews } from "@/lib/product-promotions/product-promotion.application";
import { getAPIError } from "@/lib/getApiError";
import mongoose from "mongoose";
import { getValidObjectId } from "@/helper/getValidObjectIds";
import type { ModifierGroupAggregate, ModifierItemAggregate } from "@/types/modifier-aggregate";

/**
 * GET /api/customer/products/[id]
 *
 * Fetch a single product by ID with populated modifier groups and branch inventory.
 * Used by the combo/set product detail page.
 *
 * Query Parameters:
 * - branchId (optional): If provided, includes branch-specific stock info
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!getValidObjectId(id)) {
      return getAPIError("Invalid product ID", 400);
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    // Aggregation pipeline for a single product with populated modifier groups
    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Populate category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // Populate subcategory
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true },
      },

      // Populate modifier group items' product references
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
                templateId: "$$group.templateId",
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
    ];

    // Add branch inventory lookup if branchId is provided
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      pipeline.push(
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
                      { $eq: ["$branchId", { $toObjectId: branchId }] },
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
      );
    }

    // Final projection
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        image: 1,
        info: 1,
        description: 1,
        category: { _id: "$category._id", name: "$category.name" },
        subcategory: {
          _id: "$subcategory._id",
          name: "$subcategory.name",
        },
        productType: 1,
        modifierGroups: 1,
        paxCount: 1,
        isPopular: 1,
        isSignature: 1,
        quantity: 1,
        status: 1,
      },
    });

    const [product] = await Product.aggregate(pipeline);

    if (!product) {
      return getAPIError("Product not found", 404);
    }

    // Compute active discount preview
    const discountPreviews = await getActiveProductDiscountPreviews([
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      },
    ]);

    const result = {
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
          templateId: group.templateId?.toString() || null,
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
              label: item.label,
              price: item.price,
              snapshotName: item.snapshotName,
              snapshotPrice: item.snapshotPrice,
            })) || [],
        })) || [],
      paxCount: product.paxCount,
      isPopular: product.isPopular || false,
      isSignature: product.isSignature || false,
      activeProductDiscount:
        discountPreviews.get(product._id.toString()) ?? null,
      quantity: branchId ? (product.quantity ?? 0) : null,
      status: branchId ? (product.status ?? "") : null,
    };

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[PRODUCT_DETAIL] Error:", error);
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to fetch product details",
    });
  }
}
