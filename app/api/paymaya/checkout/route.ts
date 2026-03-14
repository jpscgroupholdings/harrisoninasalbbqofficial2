import { getAuthHeader } from "@/lib/getAuthHeader";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Product } from "@/models/Product";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const body = await request.json();

    const MINIMUM_AMOUNT = 100;
    const TAX_RATE = 0.12;

    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    let recalculatedSubTotal = 0;

    // Separate Maya payload items from Order snapshot items
    const orderItems = [];
    const mayaItems = [];

    for (const cartItem of items) {
      if (!cartItem._id || !cartItem.quantity) {
        throw new Error("Invalid cart item.");
      }

      const product = await Product.findById(cartItem._id).session(session);

      if (!product) {
        throw new Error("Product not found!");
      }

      if (product.stock < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `${product.name} only has ${product.stock} item(s) left in stock`,
          },
          { status: 400 },
        );
      }

      // ✅ Deduct stock inside the transaction
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -cartItem.quantity } },
        { session },
      );

      recalculatedSubTotal += product.price * cartItem.quantity;

      // ✅ Only fields that exist in your OrderItemSchema
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image.url,
        category: product.category,
        quantity: cartItem.quantity,
      });

      // ✅ Maya payload format (separate — not saved to DB)
      mayaItems.push({
        name: product.name,
        quantity: cartItem.quantity,
        code: String(product._id),
        description: product.description,
        amount: {
          value: product.price,
        },
        totalAmount: {
          value: product.price * cartItem.quantity,
          currency: "PHP",
        },
      });
    }

    if (recalculatedSubTotal < MINIMUM_AMOUNT) {
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);
    }

    const tax = recalculatedSubTotal * TAX_RATE;
    const grandTotal = recalculatedSubTotal + tax;

    if (!process.env.MAYA_PUBLIC_KEY) {
      throw new Error("Maya key not configured");
    }

    const referenceNumber = `ORDER-${Date.now()}`;

    const payload = {
      totalAmount: {
        value: grandTotal,
        currency: "PHP",
        details: {
          discount: 0,
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
      requestReferenceNumber: referenceNumber,
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
      throw new Error(data.message ?? "Maya checkout failed");
    }

    await Order.create(
      [
        {
          status: "pending",
          items: orderItems, // ✅ clean snapshot, matches OrderItemSchema
          paymentInfo: {
            checkoutId: data.checkoutId,
            referenceNumber,
          },
          total: { subTotal: recalculatedSubTotal, tax, total: grandTotal },
          // ✅ No timeline.createdAt — timestamps:true already gives you createdAt
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      {
        checkoutId: data.checkoutId,
        redirectUrl: data.redirectUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to checkout!" },
      { status: 500 },
    );
  }
}
