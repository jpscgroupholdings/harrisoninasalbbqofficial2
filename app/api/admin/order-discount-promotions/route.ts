import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import {
  DEFAULT_ORDER_DISCOUNT_PROMOTION,
  ORDER_DISCOUNT_DAY_MODES,
  ORDER_DISCOUNT_DAYS,
  ORDER_DISCOUNT_TYPES,
  OrderDiscountDay,
  OrderDiscountDayMode,
  OrderDiscountPromotionConfig,
  OrderDiscountType,
} from "@/lib/orderDiscountPromotion";
import { OrderDiscountPromotion } from "@/models/OrderDiscountPromotion";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type OrderDiscountPromotionPayload = {
  enabled?: boolean;
  name?: string;
  discountType?: OrderDiscountType;
  discountValue?: number;
  maximumDiscountAmount?: number | null;
  minimumOrderAmount?: number;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  dayMode?: OrderDiscountDayMode;
  days?: OrderDiscountDay[];
  startTime?: string;
  endTime?: string;
  maximumRedemptions?: number | null;
};

function parseOptionalDate(value: string | Date | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : NaN;
}

function normalizePayload(
  body: OrderDiscountPromotionPayload,
): OrderDiscountPromotionConfig {
  const name = body.name?.trim() || DEFAULT_ORDER_DISCOUNT_PROMOTION.name;
  const discountType =
    body.discountType ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.discountType;
  const discountValue = normalizeAmount(
    body.discountValue ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.discountValue,
  );
  const maximumDiscountAmount =
    body.maximumDiscountAmount === null ||
    body.maximumDiscountAmount === undefined ||
    body.maximumDiscountAmount === 0
      ? null
      : normalizeAmount(body.maximumDiscountAmount);
  const minimumOrderAmount = normalizeAmount(
    body.minimumOrderAmount ??
      DEFAULT_ORDER_DISCOUNT_PROMOTION.minimumOrderAmount,
  );
  const startsAt = parseOptionalDate(body.startsAt);
  const endsAt = parseOptionalDate(body.endsAt);
  const dayMode = body.dayMode ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.dayMode;
  const days = Array.isArray(body.days) ? body.days : [];
  const startTime =
    body.startTime ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.startTime;
  const endTime = body.endTime ?? DEFAULT_ORDER_DISCOUNT_PROMOTION.endTime;
  const maximumRedemptions =
    body.maximumRedemptions === null ||
    body.maximumRedemptions === undefined ||
    body.maximumRedemptions === 0
      ? null
      : Number(body.maximumRedemptions);

  return {
    enabled: Boolean(body.enabled),
    name,
    discountType,
    discountValue,
    maximumDiscountAmount,
    minimumOrderAmount,
    startsAt,
    endsAt,
    dayMode,
    days,
    startTime,
    endTime,
    maximumRedemptions,
    redemptionCount: 0,
  };
}

function validateConfig(config: OrderDiscountPromotionConfig) {
  if (!config.name) return "Promotion name is required.";

  if (!ORDER_DISCOUNT_TYPES.includes(config.discountType)) {
    return "Choose a valid discount type.";
  }

  if (!Number.isFinite(config.discountValue) || config.discountValue <= 0) {
    return "Discount value must be greater than 0.";
  }

  if (
    config.discountType === "percentage" &&
    (config.discountValue <= 0 || config.discountValue > 100)
  ) {
    return "Percentage discount must be between 1 and 100.";
  }

  if (
    config.discountType === "percentage" &&
    config.maximumDiscountAmount !== null &&
    (!Number.isFinite(config.maximumDiscountAmount) ||
      config.maximumDiscountAmount <= 0)
  ) {
    return "Maximum discount amount must be greater than 0.";
  }

  if (!Number.isFinite(config.minimumOrderAmount) || config.minimumOrderAmount < 0) {
    return "Minimum order amount cannot be negative.";
  }

  if (!config.startsAt) {
    return "Promotion start date is required.";
  }

  if (config.startsAt && config.endsAt && config.endsAt <= config.startsAt) {
    return "Promotion end date must be after the start date.";
  }

  if (!ORDER_DISCOUNT_DAY_MODES.includes(config.dayMode)) {
    return "Choose a valid day schedule.";
  }

  if (
    config.dayMode === "specific_days" &&
    (config.days.length === 0 ||
      config.days.some((day) => !ORDER_DISCOUNT_DAYS.includes(day)))
  ) {
    return "Choose at least one valid promotion day.";
  }

  if (!TIME_PATTERN.test(config.startTime) || !TIME_PATTERN.test(config.endTime)) {
    return "Promotion time must use HH:mm format.";
  }

  if (config.endTime <= config.startTime) {
    return "Promotion end time must be after the start time.";
  }

  if (
    config.maximumRedemptions !== null &&
    (!Number.isInteger(config.maximumRedemptions) ||
      config.maximumRedemptions < 1)
  ) {
    return "Maximum redemption must be a positive whole number.";
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const config = await OrderDiscountPromotion.findOne()
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(
      { config: config ?? DEFAULT_ORDER_DISCOUNT_PROMOTION },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch order discount promotion.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = (await request.json()) as OrderDiscountPromotionPayload;
    const normalizedConfig = normalizePayload(body);
    const validationError = validateConfig(normalizedConfig);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = await OrderDiscountPromotion.findOne()
      .sort({ updatedAt: -1 })
      .select({ redemptionCount: 1 })
      .lean<{ redemptionCount?: number }>();

    const config = await OrderDiscountPromotion.findOneAndUpdate(
      {},
      {
        $set: {
          ...normalizedConfig,
          days:
            normalizedConfig.dayMode === "opening_days"
              ? []
              : normalizedConfig.days,
          maximumDiscountAmount:
            normalizedConfig.discountType === "percentage"
              ? normalizedConfig.maximumDiscountAmount
              : null,
          redemptionCount: existing?.redemptionCount ?? 0,
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
            : "Failed to update order discount promotion.",
      },
      { status: 500 },
    );
  }
}
