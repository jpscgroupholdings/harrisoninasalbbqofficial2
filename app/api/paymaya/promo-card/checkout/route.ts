import { getAuthHeader } from "@/lib/getAuthHeader";
import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { getPromoCardConfig } from "@/lib/promoCardConfig";
import { PromoCardPurchase } from "@/models/PromoCardPurchase";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";

type PromoCardCheckoutBody = {
  firstName?: string;
  lastName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

function assertValidPromoCardPayload(
  body: PromoCardCheckoutBody,
): asserts body is Required<PromoCardCheckoutBody> {
  if (!body.firstName || !body.lastName) {
    throw new Error("Customer name is required.");
  }

  if (!body.customerEmail || !body.customerEmail.includes("@")) {
    throw new Error("A valid email is required.");
  }

  if (!body.customerPhone) {
    throw new Error("Customer phone is required.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const customer = await requireBetterAuth(request);

    if (!customer?._id) {
      return NextResponse.json(
        { error: "Login is required to purchase a promo card." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as PromoCardCheckoutBody;
    assertValidPromoCardPayload(body);

    const activePromoCard = await PromoCardPurchase.findOne({
      customerId: customer._id,
      status: { $in: ["pending", "paid"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (activePromoCard) {
      return NextResponse.json(
        {
          error:
            activePromoCard.status === "paid"
              ? "You already have an active promo card."
              : "You already have a pending promo card payment.",
          promoCard: {
            referenceNumber: activePromoCard.referenceNumber,
            status: activePromoCard.status,
          },
        },
        { status: 409 },
      );
    }

    const promoCardConfig = await getPromoCardConfig();
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? request.nextUrl.origin;
    const referenceNumber = `PROMO-CARD-${Date.now()}`;
    const promoCardPurchase = await PromoCardPurchase.create({
      customerId: customer._id,
      referenceNumber,
      status: "pending",
      paymentStatus: "PENDING",
      firstName: body.firstName,
      lastName: body.lastName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      purchasePrice: promoCardConfig.purchasePrice,
      discountRate: promoCardConfig.discountRate,
      discountRules: promoCardConfig.discountRules,
      voucherRule: promoCardConfig.voucherRule,
    });

    const payload = {
      totalAmount: {
        value: promoCardConfig.purchasePrice,
        currency: "PHP",
        details: {
          discount: 0,
          vatAmount: 0,
          vatableSales: promoCardConfig.purchasePrice,
        },
      },
      items: [
        {
          name: promoCardConfig.name,
          quantity: 1,
          code: promoCardConfig.sku,
          description: `${(promoCardConfig.discountRate * 100).toFixed(0)}% discount card`,
          amount: { value: promoCardConfig.purchasePrice },
          totalAmount: {
            value: promoCardConfig.purchasePrice,
            currency: "PHP",
          },
        },
      ],
      buyer: {
        firstName: body.firstName,
        lastName: body.lastName,
        contact: {
          email: body.customerEmail,
          phone: body.customerPhone,
        },
      },
      redirectUrl: {
        success: `${baseUrl}/promo-card?payment=success&referenceNumber=${referenceNumber}`,
        failure: `${baseUrl}/promo-card?payment=failed&referenceNumber=${referenceNumber}`,
        cancel: `${baseUrl}/promo-card?payment=cancelled&referenceNumber=${referenceNumber}`,
      },
      requestReferenceNumber: referenceNumber,
    };

    try {
      const response = await fetch(
        "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        checkoutId?: string;
        redirectUrl?: string;
        message?: string;
      };

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.message ?? "Maya promo card checkout failed.");
      }

      promoCardPurchase.checkoutId = data.checkoutId;
      await promoCardPurchase.save();

      return NextResponse.json(
        {
          referenceNumber,
          checkoutId: data.checkoutId,
          redirectUrl: data.redirectUrl,
        },
        { status: 201 },
      );
    } catch (error) {
      await PromoCardPurchase.updateOne(
        { _id: promoCardPurchase._id },
        {
          $set: {
            status: "failed",
            paymentStatus: "CHECKOUT_LINK_FAILED",
            failedAt: new Date(),
          },
        },
      );
      throw error;
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "You already have an active promo card request." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create promo card checkout.",
      },
      { status: 400 },
    );
  }
}
