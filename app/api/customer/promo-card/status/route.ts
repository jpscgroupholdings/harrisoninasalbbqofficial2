import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { getPromoCardConfig } from "@/lib/promoCardConfig";
import { PromoCardPurchase } from "@/models/PromoCardPurchase";
import { getCustomerVoucherBalance } from "@/services/promoCardBenefits";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const customer = await requireBetterAuth(request);
    const config = await getPromoCardConfig();

    if (!customer?._id) {
      return NextResponse.json(
        {
          hasPaidPromoCard: false,
          hasPendingPromoCard: false,
        canRequestPromoCard: false,
        promoCard: null,
        config,
        voucherBalance: 0,
      },
        { status: 200 },
      );
    }

    const latestPromoCard = await PromoCardPurchase.findOne({
      customerId: customer._id,
    })
      .sort({ createdAt: -1 })
      .lean();
    const voucherBalance = await getCustomerVoucherBalance(customer._id);

    return NextResponse.json(
      {
        hasPaidPromoCard: latestPromoCard?.status === "paid",
        hasPendingPromoCard: latestPromoCard?.status === "pending",
        canRequestPromoCard:
          !latestPromoCard ||
          ["failed", "expired", "cancelled"].includes(latestPromoCard.status),
        promoCard: latestPromoCard
          ? {
              referenceNumber: latestPromoCard.referenceNumber,
              status: latestPromoCard.status,
              purchasePrice: latestPromoCard.purchasePrice,
              discountRate: latestPromoCard.discountRate,
              createdAt: latestPromoCard.createdAt,
              paidAt: latestPromoCard.paidAt,
            }
          : null,
        config,
        voucherBalance,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check promo card status.",
      },
      { status: 500 },
    );
  }
}
