import { requireAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import {
  normalizeOrderDiscountPromotionPayload,
  OrderDiscountPromotionPayload,
  validateOrderDiscountPromotionConfig,
} from "@/lib/orderDiscountPromotionValidation";
import { OrderDiscountPromotion } from "@/models/OrderDiscountPromotion";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const data = await OrderDiscountPromotion.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch order discount promotions.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = (await request.json()) as OrderDiscountPromotionPayload;
    const normalizedConfig = normalizeOrderDiscountPromotionPayload(body);
    const validationError =
      validateOrderDiscountPromotionConfig(normalizedConfig);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const [promotion] = await OrderDiscountPromotion.create([normalizedConfig]);

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order discount promotion.",
      },
      { status: 500 },
    );
  }
}
