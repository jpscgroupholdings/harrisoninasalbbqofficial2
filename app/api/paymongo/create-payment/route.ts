import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { Product } from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  return NextResponse.json({ success: "Running" });
}

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();
    session.startTransaction();

    const MINIMUM_AMOUNT = 100;
    const TAX_RATE = 0.12;

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    // NEVER trust frontend price or subtotal
    let recalculatedSubTotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      if (!cartItem._id || !cartItem.quantity) {
        throw new Error("Invalid cart item.");
      }

      const product = await Product.findById(cartItem._id).session(session);

      if (!product) {
        throw new Error(`Product not found.`);
      }

      // 🔥 Atomic stock deduction (prevents race condition)
      const updateResult = await Product.updateOne(
        {
          _id: cartItem._id,
          stock: { $gte: cartItem.quantity },
        },
        {
          $inc: { stock: -cartItem.quantity },
        },
        { session },
      );

      if (updateResult.modifiedCount === 0) {
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
    const total = recalculatedSubTotal + tax;

    const secretKey = process.env.SK_TEST_KEY_PAYMONGO;

    if (!secretKey) {
      throw new Error("PayMongo secret key not configured");
    }

    // Create PayMongo Link
    const description = `Order - ${validatedItems
      .map((i) => i.name)
      .join(", ")}`;

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(secretKey + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(total * 100), // cents
            description,
          },
        },
      }),
    });

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      throw new Error("Failed to create PayMongo link");
    }

    const { id, attributes } = paymongoData.data;

    // Create Order
    const order = await Order.create(
      [
        {
          status: "pending",
          items: validatedItems,
          paymentInfo: {
            paymentLinkId: id,
            checkoutUrl: attributes.checkout_url,
            referenceNumber: attributes.reference_number,
          },
          total: {
            subTotal: recalculatedSubTotal,
            tax,
            total,
          },
          timeline: {
            createdAt: new Date(),
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      orderId: order[0]._id,
      checkoutUrl: attributes.checkout_url,
      referenceNumber: attributes.reference_number,
      status: order[0].status,
      total,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
