import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
import { getCustomerAuth } from "@/lib/getAuth";
import { getAuthHeader } from "@/lib/getAuthHeader";
import { connectDB } from "@/lib/mongodb";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { Branch } from "@/models/Branch";
import { Inventory } from "@/models/Inventory";
import { Order } from "@/models/Orders";
import { Product } from "@/models/Product";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";
import { Settings } from "@/models/Setting";
import { getStoreStatus } from "@/lib/storeStatus";

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const settings = await Settings.findOne().session(session);

    if (!settings) {
      throw new Error("Store settings not found.");
    }

    const storeStatus = getStoreStatus(settings.operatingHours);

    if (!storeStatus.isOpen) {
      return NextResponse.json(
        {
          error: storeStatus.message,
        },
        { status: 403 },
      );
    }

    const customer = await getCustomerAuth(request);

    let customerId = null;

    if (customer) {
      customerId = customer.id;
    }

    const body: CreateOrderPayload = await request.json();

    const MINIMUM_AMOUNT = 100;
    const TAX_RATE = 0.12;

    const {
      branchId,
      items,
      firstName,
      lastName,
      customerEmail,
      customerPhone,
      notes,
      shippingAddress,
    } = body;

    const { line1, line2, city, province, zipCode } = shippingAddress;

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch is required." },
        { status: 400 },
      );
    }
    if (!firstName || !lastName || !customerPhone) {
      return NextResponse.json(
        { error: "Customer details are required." },
        { status: 400 },
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const branch = await Branch.findById(branchId).session(session);

    if (!branch) {
      return NextResponse.json({ error: "Branch not found!" }, { status: 400 });
    }

    let totalPrice = 0;

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

      // Check inventory for SPECIFIC branch
      const inventory = await Inventory.findOne({
        productId: cartItem._id,
        branchId: branchId,
      }).session(session);

      // No inventory record = treat as out of stock
      if (!inventory) {
        throw new Error(`${product.name} is not available at this branch.`);
      }

      if (inventory.quantity === 0) {
        throw new Error(
          `${product.name} only has ${inventory.quantity} item(s) left in stock.`,
        );
      }

      if (inventory.quantity < cartItem.quantity) {
        throw new Error(
          `${product.name} only has ${inventory.quantity} item(s) left in stock.`,
        );
      }

      // Deduct stock inside the transaction
      await Inventory.findOneAndUpdate(
        { productId: cartItem._id, branchId: branchId },
        { $inc: { quantity: -cartItem.quantity } },
        { session },
      );

      totalPrice += product.price * cartItem.quantity;

      // Only fields that exist in your OrderItemSchema
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
        productId: product._id,
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

    if (totalPrice < MINIMUM_AMOUNT) {
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);
    }

    const vatableSales = parseFloat((totalPrice / (1 + TAX_RATE)).toFixed(2));
    const vatAmount = parseFloat((totalPrice - vatableSales).toFixed(2));

    if (!process.env.MAYA_PUBLIC_KEY) {
      throw new Error("Maya key not configured");
    }

    const referenceNumber = `ORDER-${Date.now()}`;

    const payload = {
      totalAmount: {
        value: totalPrice,
        currency: "PHP",
        details: {
          discount: 0,
          vatAmount,
          vatableSales,
        },
      },
      items: mayaItems,
      buyer: {
        firstName,
        lastName,

        contact: {
          email: customerEmail,
          phone: customerPhone,
        },

        shippingAddress: {
          line1,
          line2,
          city,
          state: province,
          zipCode,
          countryCode: "PH",
        },
      },
      redirectUrl: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success?referenceNumber=${referenceNumber}`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failed?referenceNumber=${referenceNumber}`,
        cancel: `${process.env.NEXT_PUBLIC_URL}/payment/cancel?referenceNumber=${referenceNumber}`,
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

    const order = await Order.create(
      [
        {
          branchId,
          customerId,
          branchSnapshot: {
            name: branch.name,
            code: branch.code,
            address: branch.address,
            contactNumber: branch.contactNumber,
          },
          status: ORDER_STATUSES.PENDING,
          items: orderItems, // clean snapshot, matches OrderItemSchema
          paymentInfo: {
            checkoutId: data.checkoutId,
            referenceNumber,
            firstName,
            lastName,
            customerEmail,
            customerPhone, // optional

            shippingAddress,
          },
          total: { vatableSales, vatAmount, totalAmount: totalPrice },
          notes, // optional
          //  No timeline.createdAt — timestamps:true already gives you createdAt
        },
      ],
      { session },
    );

    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order[0].paymentInfo.customerEmail,
      subject: `Payment Needed!`,
      react: OrderMessageEmail({ order: order[0] }),
    });

    if (emailError) {
      return NextResponse.json(
        { error: "Failed to send order summary email. Please try again." },
        { status: 500 },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      {
        referenceNumber,
        checkoutId: data.checkoutId,
        redirectUrl: data.redirectUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to checkout!",
      },
      { status: 500 },
    );
  }
}
