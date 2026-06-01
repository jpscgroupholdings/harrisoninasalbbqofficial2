import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import {
  DEFAULT_PROMO_CARD_VALIDITY_RULE,
  PROMO_CARD,
  PROMO_CARD_DAYS,
  PROMO_CARD_VALIDITY_UNITS,
  PromoCardDay,
  PromoCardDiscountRule,
  PromoCardValidityRule,
  PromoCardValidityUnit,
  PromoCardVoucherRule,
} from "@/lib/promoCard";
import { DEFAULT_VOUCHER_USAGE_RULE } from "@/types/voucher.types";
import { getPromoCardConfig } from "@/lib/promoCardConfig";
import { PromoCardConfigModel } from "@/models/PromoCardConfig";
import { PromoCardPurchase } from "@/models/PromoCardPurchase";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") || 10)),
    );
    const skip = (page - 1) * limit;

    const [data, total, paidCount, pendingCount, paidRevenueResult] =
      await Promise.all([
        PromoCardPurchase.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PromoCardPurchase.countDocuments({}),
        PromoCardPurchase.countDocuments({ status: "paid" }),
        PromoCardPurchase.countDocuments({ status: "pending" }),
        PromoCardPurchase.aggregate<{ total: number }>([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$purchasePrice" } } },
        ]),
      ]);

    const totalPages = Math.ceil(total / limit);
    const config = await getPromoCardConfig();

    return NextResponse.json(
      {
        data,
        config,
        stats: {
          total,
          paid: paidCount,
          pending: pendingCount,
          paidRevenue: paidRevenueResult[0]?.total ?? 0,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch promo card purchases.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = (await request.json()) as {
      name?: string;
      purchasePrice?: number;
      discountRules?: {
        days?: PromoCardDay[];
        discountPercent?: number;
      }[];
      voucherRule?: PromoCardVoucherRule;
      validityRule?: {
        duration?: number;
        unit?: PromoCardValidityUnit;
        expiresAt?: string | Date | null;
      };
    };

    const name = body.name?.trim();
    const purchasePrice = Number(body.purchasePrice);
    const rawDiscountRules = Array.isArray(body.discountRules)
      ? body.discountRules
      : [];
    const voucherRule = body.voucherRule;
    const validityRule = body.validityRule;
    const usageRule = voucherRule?.usageRule;

    if (!name) {
      return NextResponse.json(
        { error: "Promo card name is required." },
        { status: 400 },
      );
    }

    if (rawDiscountRules.length === 0 || rawDiscountRules.length > 2) {
      return NextResponse.json(
        { error: "Add 1 to 2 discount day rules." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(purchasePrice) || purchasePrice < 1) {
      return NextResponse.json(
        { error: "Promo card amount must be at least ₱1." },
        { status: 400 },
      );
    }

    const usedDays = new Set<string>();
    const discountRules: PromoCardDiscountRule[] = [];

    for (const rule of rawDiscountRules) {
      const days = Array.isArray(rule.days) ? rule.days : [];
      const discountPercent = Number(rule.discountPercent);

      if (
        days.length === 0 ||
        days.some((day) => !PROMO_CARD_DAYS.includes(day))
      ) {
        return NextResponse.json(
          { error: "Each discount rule must include valid days." },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        return NextResponse.json(
          { error: "Discount percent must be between 0 and 100." },
          { status: 400 },
        );
      }

      for (const day of days) {
        if (usedDays.has(day)) {
          return NextResponse.json(
            { error: "A day can only be assigned to one discount rule." },
            { status: 400 },
          );
        }
        usedDays.add(day);
      }

      discountRules.push({
        days,
        discountRate: Number((discountPercent / 100).toFixed(4)),
      });
    }

    const isOneTimeUse = Boolean(
      usageRule?.isOneTimeUse ?? DEFAULT_VOUCHER_USAGE_RULE.isOneTimeUse,
    );
    const isConsumable = Boolean(
      usageRule?.isConsumable ?? DEFAULT_VOUCHER_USAGE_RULE.isConsumable,
    );

    if (isOneTimeUse === isConsumable) {
      return NextResponse.json(
        { error: "Choose either one-time use or consumable vouchers." },
        { status: 400 },
      );
    }

    const normalizedVoucherRule: PromoCardVoucherRule = {
      enabled: Boolean(voucherRule?.enabled),
      voucherAmount: Number(voucherRule?.voucherAmount ?? 0),
      minimumPurchase: Number(voucherRule?.minimumPurchase ?? 0),
      usageRule: {
        isOneTimeUse,
        isConsumable,
      },
    };

    if (
      normalizedVoucherRule.enabled &&
      (normalizedVoucherRule.voucherAmount <= 0 ||
        normalizedVoucherRule.minimumPurchase <= 0)
    ) {
      return NextResponse.json(
        { error: "Voucher amount and minimum purchase must be greater than 0." },
        { status: 400 },
      );
    }

    const validityDuration = Number(
      validityRule?.duration ?? DEFAULT_PROMO_CARD_VALIDITY_RULE.duration,
    );
    const validityUnit =
      validityRule?.unit ?? DEFAULT_PROMO_CARD_VALIDITY_RULE.unit;

    if (
      !Number.isInteger(validityDuration) ||
      validityDuration < 1 ||
      !PROMO_CARD_VALIDITY_UNITS.includes(validityUnit)
    ) {
      return NextResponse.json(
        { error: "Promo card validity must be a positive duration." },
        { status: 400 },
      );
    }

    let expiresAt: Date | null = DEFAULT_PROMO_CARD_VALIDITY_RULE.expiresAt;

    if (validityRule?.expiresAt) {
      const parsedExpiresAt = new Date(validityRule.expiresAt);

      if (Number.isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json(
          { error: "Promo card expiration date is invalid." },
          { status: 400 },
        );
      }

      expiresAt = parsedExpiresAt;
    }

    const normalizedValidityRule: PromoCardValidityRule = {
      duration: validityDuration,
      unit: validityUnit,
      expiresAt,
    };

    const config = await PromoCardConfigModel.findOneAndUpdate(
      {},
      {
        $set: {
          name,
          discountRate: discountRules[0].discountRate,
          discountRules,
          voucherRule: normalizedVoucherRule,
          validityRule: normalizedValidityRule,
          purchasePrice: Number(purchasePrice.toFixed(2)),
          sku: PROMO_CARD.sku,
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update promo card settings.",
      },
      { status: 500 },
    );
  }
}
