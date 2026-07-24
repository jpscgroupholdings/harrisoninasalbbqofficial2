import { getAuthHeader, getMayaQrAuthHeader } from "@/lib/getAuthHeader";
import { getMayaCheckoutUrl, getMayaQrUrl } from "@/lib/mayaConfig";
import { requireBetterAuth } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { PAYMENT_STATUSES } from "@/types/paymentConstants";
import { addMoney, multiplyMoney, roundMoney } from "@/lib/money";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const customer = await requireBetterAuth(request);
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.customerId &&
      (!customer || order.customerId.toString() !== customer._id.toString())
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.paymentInfo?.paymentMethod !== "maya") {
      return NextResponse.json(
        { error: "Only Maya orders can create a payment checkout." },
        { status: 400 },
      );
    }

    if (order.status !== ORDER_STATUSES.PENDING_PAYMENT) {
      return NextResponse.json(
        { error: "This order is no longer awaiting payment." },
        { status: 400 },
      );
    }

    if (order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS) {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 },
      );
    }

    const { paymentInfo } = order;
    const shippingAddress = paymentInfo.shippingAddress;
    const { line1, line2, city, province, zipCode } = shippingAddress ?? {};

    const referenceNumber = paymentInfo?.referenceNumber;

    // QR PH: skip the full checkout payload — only needs totalAmount + redirects
    const useQrPh = request.nextUrl.searchParams.get("useQrPh") === "true";

    if (useQrPh) {
      const qrPayload = {
        totalAmount: {
          value: order.total.totalAmount.toFixed(2),
          currency: "PHP",
        },
        redirectUrl: {
          success: `${process.env.NEXT_PUBLIC_URL}/payment/success?referenceNumber=${referenceNumber}`,
          failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed?referenceNumber=${referenceNumber}`,
          cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel?referenceNumber=${referenceNumber}`,
        },
        requestReferenceNumber: referenceNumber,
      };

      const response = await fetch(getMayaQrUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getMayaQrAuthHeader(), // QR PH uses "Pay with Maya" app keys
        },
        body: JSON.stringify(qrPayload),
      });

      const data = await response.json();

      console.log("[Maya QR PH] Status:", response.status);
      console.log("[Maya QR PH] Response:", JSON.stringify(data, null, 2));

      if (!response.ok || !data.redirectUrl) {
        return NextResponse.json(
          {
            error: data.message ?? "Failed to create QR payment.",
            mayaResponse: data,
          },
          { status: 502 },
        );
      }

      order.paymentInfo.checkoutId = data.paymentId;
      await order.save();

      return NextResponse.json({
        checkoutId: data.paymentId,
        redirectUrl: data.redirectUrl,
      });
    }

    // Split each order item into parent product (base price) + modifier upgrade line items.
    // The stored item.price = base price + all upgrade prices, so we compute base by subtracting.
    const productItems: any[] = [];
    for (const item of order.items as any[]) {
      const modifierSelections: any[] = item.modifierSelections ?? [];

      // Compute total upgrade cost per unit
      const upgradePerUnit = modifierSelections.reduce(
        (sum: number, group: any) =>
          sum +
          group.items.reduce(
            (gSum: number, mi: any) =>
              gSum + multiplyMoney(mi.upgradePrice, mi.quantity),
            0,
          ),
        0,
      );
      const basePrice = item.price - upgradePerUnit;

      // Parent product line item — handle zero-price (free promo items) with nominal amount
      const isFreeProduct = basePrice === 0;
      productItems.push({
        name: isFreeProduct ? `${item.name} (FREE)` : item.name,
        quantity: item.quantity,
        code: String(item.productId ?? item._id),
        description: isFreeProduct
          ? `Free item — ${item.description ?? ""}`.trim()
          : item.description ?? "",
        amount: { value: isFreeProduct ? 1 : roundMoney(basePrice) },
        totalAmount: {
          value: multiplyMoney(basePrice, item.quantity),
          currency: "PHP",
        },
      });

      // Each modifier upgrade as its own line item (including zero-price as "Included")
      for (const group of modifierSelections) {
        for (const mi of group.items as any[]) {
          const qty = mi.quantity * item.quantity;
          if (mi.upgradePrice > 0) {
            const modLineTotal = multiplyMoney(mi.upgradePrice, qty);
            productItems.push({
              name: mi.label ?? mi.name,
              quantity: qty,
              code: `UPGRADE-${mi.productId}`,
              description: `Upgrade for ${item.name} — ${group.groupName}`,
              amount: { value: mi.upgradePrice },
              totalAmount: {
                value: modLineTotal,
                currency: "PHP",
              },
            });
          } else {
            // Zero-price upgrade: nominal amount so Maya renders it, totalAmount = 0
            productItems.push({
              name: `${mi.label ?? mi.name} (Included)`,
              quantity: qty,
              code: `UPGRADE-${mi.productId}`,
              description: `Included with ${item.name} — ${group.groupName}`,
              amount: { value: 1 },
              totalAmount: {
                value: 0,
                currency: "PHP",
              },
            });
          }
        }
      }
    }

    // Delivery fee line items: show as FREE when free delivery was applied
    // (use nominal amount if rawDeliveryFee is 0 so Maya still renders the line),
    // or show the regular distance-based fee.
    const deliveryItems = order.total.freeDeliveryApplied
      ? [
          {
            name: "Delivery Fee (FREE)",
            quantity: 1,
            code: "DELIVERY_FEE_FREE",
            description: order.total.rawDeliveryFee
              ? `Free delivery — originally ₱${order.total.rawDeliveryFee}`
              : "Free delivery",
            amount: { value: order.total.rawDeliveryFee || 1 },
            totalAmount: {
              value: 0,
              currency: "PHP",
            },
          },
        ]
      : order.total.deliveryFeeAmount > 0
        ? [
            {
              name: "Delivery Fee",
              quantity: 1,
              code: "DELIVERY_FEE",
              description: "Distance-based delivery fee",
              amount: { value: order.total.deliveryFeeAmount },
              totalAmount: {
                value: order.total.deliveryFeeAmount,
                currency: "PHP",
              },
            },
          ]
        : [];

    const payload = {
      totalAmount: {
        value: order.total.totalAmount,
        currency: "PHP",
        details: {
          discount: addMoney(
            order.total.discountAmount ?? 0,
            order.total.voucherDiscountAmount ?? 0,
          ),
          vatAmount: order.total.vatAmount,
          subTotal: order.total.vatableSales,
        },
      },
      items: [...productItems, ...deliveryItems],
      buyer: {
        firstName: paymentInfo.firstName,
        lastName: paymentInfo.lastName,
        contact: {
          email: paymentInfo.customerEmail,
          phone: paymentInfo.customerPhone,
        },

        ...(shippingAddress && {
          shippingAddress: {
            line1,
            line2,
            city,
            province,
            state: province,
            zipCode,
            countryCode: "PH",
          },
        }),
      },
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success?referenceNumber=${referenceNumber}`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed?referenceNumber=${referenceNumber}`,
        cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel?referenceNumber=${referenceNumber}`,
      },
      requestReferenceNumber: paymentInfo.referenceNumber,
    };

    const response = await fetch(getMayaCheckoutUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.redirectUrl) {
      return NextResponse.json(
        { error: data.message ?? "Failed to create payment checkout." },
        { status: 502 },
      );
    }

    order.paymentInfo.checkoutId = data.checkoutId;

    await order.save();

    return NextResponse.json({
      checkoutId: data.checkoutId,
      redirectUrl: data.redirectUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      {
        status: 500,
      },
    );
  }
}
