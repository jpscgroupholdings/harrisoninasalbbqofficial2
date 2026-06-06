import { Types, type ClientSession } from "mongoose";
import { ProductDiscountPromotion } from "@/models/ProductDiscountPromotion";
import { Settings } from "@/models/Setting";
import type {
  PromotionDiscountDay,
  PromotionDiscountDayMode,
  PromotionDiscountType,
} from "@/types/promotions/promotion-constant";
import { roundMoney } from "@/lib/promotions/promotion.calculation";
import { isPromotionScheduleActive } from "@/lib/promotions/promotions.service";

type ProductDiscountPromotionRecord = {
  _id: Types.ObjectId;
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  products: {
    product: Types.ObjectId;
    name: string;
  }[];
  startsAt: Date;
  endsAt?: Date | null;
  dayMode: PromotionDiscountDayMode;
  days: PromotionDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions?: number | null;
  redemptionCount: number;
};

export type ProductDiscountCartLine = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
};

export type AppliedProductDiscountPromotion = {
  promotionId: Types.ObjectId;
  name: string;
  productId: Types.ObjectId;
  productName: string;
  discountAmount: number;
};

export type ProductDiscountResolution = {
  originalSubtotalAmount: number;
  discountedSubtotalAmount: number;
  productDiscountAmount: number;
  appliedPromotions: AppliedProductDiscountPromotion[];
};

type ProductDiscountStrategy = (
  promotion: ProductDiscountPromotionRecord,
  lineSubtotal: number,
) => number;

const productDiscountStrategies: Record<
  PromotionDiscountType,
  ProductDiscountStrategy
> = {
  percentage(promotion, lineSubtotal) {
    return roundMoney(lineSubtotal * (promotion.discountValue / 100));
  },
  fixed(promotion, lineSubtotal) {
    return roundMoney(Math.min(promotion.discountValue, lineSubtotal));
  },
};

function getLineSubtotal(line: ProductDiscountCartLine) {
  return roundMoney(line.price * line.quantity);
}

function getProductKey(productId: Types.ObjectId) {
  return productId.toString();
}

function resolveBestLinePromotion(
  line: ProductDiscountCartLine,
  promotions: ProductDiscountPromotionRecord[],
) {
  const productKey = getProductKey(line.productId);
  const lineSubtotal = getLineSubtotal(line);

  return promotions
    .filter((promotion) =>
      promotion.products.some(
        (product) => getProductKey(product.product) === productKey,
      ),
    )
    .map((promotion) => ({
      promotionId: promotion._id,
      name: promotion.name,
      productId: line.productId,
      productName: line.name,
      discountAmount: productDiscountStrategies[promotion.discountType](
        promotion,
        lineSubtotal,
      ),
    }))
    .filter((promotion) => promotion.discountAmount > 0)
    .sort((left, right) => right.discountAmount - left.discountAmount)[0];
}

export async function resolveProductDiscountPromotions(
  lines: ProductDiscountCartLine[],
  session: ClientSession,
): Promise<ProductDiscountResolution> {
  const originalSubtotalAmount = roundMoney(
    lines.reduce((sum, line) => sum + getLineSubtotal(line), 0),
  );

  if (lines.length === 0 || originalSubtotalAmount <= 0) {
    return {
      originalSubtotalAmount,
      discountedSubtotalAmount: originalSubtotalAmount,
      productDiscountAmount: 0,
      appliedPromotions: [],
    };
  }

  const now = new Date();
  const settings = await Settings.findOne()
    .select({ operatingHours: 1 })
    .session(session);
  const operatingHours = settings?.operatingHours ?? null;
  const productIds = lines.map((line) => line.productId);

  const promotions = await ProductDiscountPromotion.find({
    enabled: true,
    "products.product": { $in: productIds },
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
    .session(session)
    .lean<ProductDiscountPromotionRecord[]>();

  const activePromotions = promotions.filter((promotion) =>
    isPromotionScheduleActive(promotion, operatingHours, now),
  );
  const appliedPromotions = lines
    .map((line) => resolveBestLinePromotion(line, activePromotions))
    .filter(
      (promotion): promotion is AppliedProductDiscountPromotion =>
        promotion !== undefined,
    );
  const productDiscountAmount = roundMoney(
    appliedPromotions.reduce(
      (sum, promotion) => sum + promotion.discountAmount,
      0,
    ),
  );

  return {
    originalSubtotalAmount,
    discountedSubtotalAmount: roundMoney(
      Math.max(originalSubtotalAmount - productDiscountAmount, 0),
    ),
    productDiscountAmount,
    appliedPromotions,
  };
}

export async function incrementProductDiscountRedemptions(
  appliedPromotions: AppliedProductDiscountPromotion[],
  session: ClientSession,
) {
  const promotionIds = [
    ...new Set(
      appliedPromotions.map((promotion) => promotion.promotionId.toString()),
    ),
  ];

  for (const promotionId of promotionIds) {
    const now = new Date();
    const updated = await ProductDiscountPromotion.findOneAndUpdate(
      {
        _id: new Types.ObjectId(promotionId),
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
      },
      { $inc: { redemptionCount: 1 } },
      { new: true, session },
    );

    if (!updated) {
      throw new Error("This product discount has reached its redemption limit.");
    }
  }
}
