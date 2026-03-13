import { getAuthHeader } from "@/lib/getAuthHeader";
import { connectDB } from "@/lib/mongodb";
import { CheckoutSession } from "@/models/CheckoutSession";
import { Order } from "@/models/Orders";
import { Product } from "@/models/Product";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { success } from "zod";

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const MINIMUM_AMOUNT = 100;
    const TAX_RATE = 0.12;

    // Never trust your front to calculate the total amount
    let recalculatedSubTotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      if (!cartItem._id || !cartItem.quantity) {
        throw new Error("Invalid cart item.");
      }

      const product = await Product.findById(cartItem._id);

      if (!product) {
        throw new Error("Product not found!");
      }

      // Just check the stock, don't deduct yet
      if (product.stock < cartItem.quantity) {
        throw new Error(
          `${product.name} only has ${product.stock} item(s) left in stock`,
        );
      }

      recalculatedSubTotal += product.price * cartItem.quantity;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image.url,
        category: product.category,
        quantity: cartItem.quantity,
      });
    }

    if (recalculatedSubTotal < MINIMUM_AMOUNT) {
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);
    }

    const tax = recalculatedSubTotal * TAX_RATE;
    const grandTotal = recalculatedSubTotal + tax;

    const publicKey = process.env.MAYA_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error("Maya key not configured");
    }

    const mayaItems = validatedItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalAmount: {
        value: item.price * item.quantity,
        currency: "PHP",
      },
    }));

    const requestReferenceNumber = `ORDER-${Date.now()}`;

    const payload = {
      totalAmount: {
        value: grandTotal,
        currency: "PHP",
        details: {
          discount: "0",
          tax,
          subTotal: recalculatedSubTotal,
        },
      },
      items: mayaItems,
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed`,
        cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
      },
      requestReferenceNumber,
    };

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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message ?? "Maya checkout failed", details: data },
        { status: response.status },
      );
    }

    // Save a lightweight pending session (not full order yet)
    await CheckoutSession.create({
      checkoutId: data.checkoutId,
      referenceNumber: requestReferenceNumber,
      items: validatedItems,
      total: { subTotal: recalculatedSubTotal, tax, total: grandTotal },
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    });

    // Return checkoutId and redirectUrl to the frontend
    return NextResponse.json(
      {
        checkoutId: data.checkoutId,
        redirectUrl: data.redirectUrl
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to checkout!",
    });
  }
}
