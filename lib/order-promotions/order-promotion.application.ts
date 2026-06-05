import { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import type {
  PromotionDiscountDay,
  PromotionDiscountDayMode,
  PromotionDiscountType,
} from "@/types/promotions/promotion-constant";
import { getStoreStatus } from "@/lib/storeStatus";
import { OrderDiscountPromotion } from "@/models/OrderDiscountPromotion";
import { Settings } from "@/models/Setting";

import { calculateOrderDiscountAmount } from "./order-promotion.calculation";
import { isPromotionScheduleActive } from "../promotions/promotions.service";

type OrderDiscountPromotionRecord = {
  _id: Types.ObjectId;
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maximumDiscountAmount?: number | null;
  minimumOrderAmount: number;
  startsAt: Date;
  endsAt?: Date | null;
  dayMode: PromotionDiscountDayMode;
  days: PromotionDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions?: number | null;
  redemptionCount: number;
};

export type AppliedOrderDiscountPromotion = {
  promotionId: Types.ObjectId;
  name: string;
  discountAmount: number;
};


export async function resolveOrderDiscountPromotion(
  subtotalAmount: number,
  discountableAmount: number,
  session: ClientSession,
): Promise<AppliedOrderDiscountPromotion | null> {
  const now = new Date();
  const settings = await Settings.findOne()
    .select({ operatingHours: 1 })
    .session(session);
  const operatingHours = settings?.operatingHours ?? null;

  const promotions = await OrderDiscountPromotion.find({
    enabled: true,
    minimumOrderAmount: { $lte: subtotalAmount },
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
    .lean<OrderDiscountPromotionRecord[]>();

  const bestPromotion = promotions
    .filter((promotion) =>
      isPromotionScheduleActive(promotion, operatingHours, now),
    )
    .map((promotion) => ({
      promotionId: promotion._id,
      name: promotion.name,
      discountAmount: calculateOrderDiscountAmount(
        promotion,
        discountableAmount,
      ),
    }))
    .filter((promotion) => promotion.discountAmount > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0];

  return bestPromotion ?? null;
}

export async function incrementOrderDiscountRedemption(
  promotion: AppliedOrderDiscountPromotion | null,
  session: ClientSession,
) {
  if (!promotion) return;

  const now = new Date();
  const updated = await OrderDiscountPromotion.findOneAndUpdate(
    {
      _id: promotion.promotionId,
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
    throw new Error("This order discount has reached its redemption limit.");
  }
}
