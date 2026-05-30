import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { getPromoCardConfig } from "@/lib/promoCardConfig";
import { Order } from "@/models/Orders";
import { PromoCardPurchase } from "@/models/PromoCardPurchase";
import { getCustomerVoucherBalance } from "@/services/promoCardBenefits";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

type PromoCardUsageOrder = {
  _id: unknown;
  status: string;
  createdAt: Date;
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  total?: {
    totalAmount?: number;
    subtotalAmount?: number;
    discountAmount?: number;
    discountCode?: string;
    voucherDiscountAmount?: number;
  };
  paymentInfo?: {
    referenceNumber?: string;
  };
};

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
          usageHistory: [],
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
    const usageHistory = latestPromoCard
      ? await Order.find({
          customerId: customer._id,
          status: { $nin: ["cancelled", "failed", "expired"] },
          $or: [
            { "total.discountCode": latestPromoCard.referenceNumber },
            { "total.voucherDiscountAmount": { $gt: 0 } },
          ],
        })
          .select({
            _id: 1,
            status: 1,
            items: 1,
            total: 1,
            "paymentInfo.referenceNumber": 1,
            createdAt: 1,
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean<PromoCardUsageOrder[]>()
      : [];

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
              firstName: latestPromoCard.firstName,
              lastName: latestPromoCard.lastName,
              customerEmail: latestPromoCard.customerEmail,
              customerPhone: latestPromoCard.customerPhone,
              purchasePrice: latestPromoCard.purchasePrice,
              discountRate: latestPromoCard.discountRate,
              createdAt: latestPromoCard.createdAt,
              paidAt: latestPromoCard.paidAt,
            }
          : null,
        config,
        voucherBalance,
        usageHistory: usageHistory.map((order) => ({
          id: String(order._id),
          referenceNumber: order.paymentInfo?.referenceNumber,
          status: order.status,
          createdAt: order.createdAt,
          subtotalAmount: order.total?.subtotalAmount ?? 0,
          discountAmount: order.total?.discountAmount ?? 0,
          voucherDiscountAmount: order.total?.voucherDiscountAmount ?? 0,
          totalAmount: order.total?.totalAmount ?? 0,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          })),
        })),
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
