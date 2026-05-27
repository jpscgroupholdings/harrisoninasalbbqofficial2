import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
import { requireBetterAuth } from "@/lib/getAuth";
import { getAuthHeader } from "@/lib/getAuthHeader";
import { connectDB } from "@/lib/mongodb";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { Branch } from "@/models/Branch";
import { Inventory } from "@/models/Inventory";
import { Order } from "@/models/Orders";
import { Product } from "@/models/Product";
import { ORDER_STATUSES } from "@/types/orderConstants";
import { CreateOrderPayload } from "@/types/OrderTypes";
import mongoose, { ClientSession } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/registerModels";
import { Settings } from "@/models/Setting";
import { getStoreStatus } from "@/lib/storeStatus";
import { inngest } from "@/inngest/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MINIMUM_AMOUNT = 100;
const TAX_RATE = 0.12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResolvedCartItem {
  orderItem: {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    quantity: number;
  };
  mayaItem: {
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    code: string;
    description: string;
    amount: { value: number };
    totalAmount: { value: number; currency: string };
  };
  subtotal: number;
}

interface TaxBreakdown {
  vatableSales: number;
  vatAmount: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export async function assertStoreIsOpen(session: ClientSession): Promise<void> {
  const settings = await Settings.findOne().session(session);
  if (!settings) throw new Error("Store settings not found.");

  const storeStatus = getStoreStatus(settings.operatingHours);
  if (!storeStatus.isOpen) throw new Error(storeStatus.message);
}

export function assertValidPayload(body: CreateOrderPayload): void {
  const { branchId, firstName, lastName, customerPhone, items } = body;

  if (!branchId) throw new Error("Branch is required.");
  if (!firstName || !lastName || !customerPhone)
    throw new Error("Customer details are required.");
  if (!items || !Array.isArray(items) || items.length === 0)
    throw new Error("Cart is empty.");
}

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

export async function fetchBranch(branchId: string, session: ClientSession) {
  const branch = await Branch.findById(branchId).session(session);
  if (!branch) throw new Error("Branch not found!");
  return branch;
}

// ---------------------------------------------------------------------------
// Cart helpers
// ---------------------------------------------------------------------------

async function resolveCartItem(
  cartItem: { _id: string; quantity: number },
  branchId: string,
  session: ClientSession,
): Promise<ResolvedCartItem> {
  if (!cartItem._id || !cartItem.quantity)
    throw new Error("Invalid cart item.");

  const product = await Product.findById(cartItem._id).session(session);
  if (!product) throw new Error("Product not found!");

  const inventory = await Inventory.findOne({
    productId: cartItem._id,
    branchId,
    $expr: {
      $gte: [
        { $subtract: ["$quantity", { $sum: "$reservations.quantity" }] },
        cartItem.quantity,
      ],
    },
  }).session(session);

  if (!inventory)
    throw new Error(
      `${product.name} is out of stock or insufficient quantity.`,
    );

  return {
    orderItem: {
      productId: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image.url,
      category: product.category,
      quantity: cartItem.quantity,
    },
    mayaItem: {
      productId: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      code: String(product._id),
      description: product.description,
      amount: { value: product.price },
      totalAmount: {
        value: product.price * cartItem.quantity,
        currency: "PHP",
      },
    },
    subtotal: product.price * cartItem.quantity,
  };
}

export async function resolveCart(
  items: CreateOrderPayload["items"],
  branchId: string,
  session: ClientSession,
) {
  const resolved = await Promise.all(
    items.map((item) => resolveCartItem(item, branchId, session)),
  );

  const totalPrice = resolved.reduce((sum, r) => sum + r.subtotal, 0);
  const orderItems = resolved.map((r) => r.orderItem);
  const mayaItems = resolved.map((r) => r.mayaItem);

  return { totalPrice, orderItems, mayaItems };
}

export async function reserveInventory(
  orderItems: ResolvedCartItem["orderItem"][],
  branchId: string,
  orderId: mongoose.Types.ObjectId,
  session: ClientSession,
) {
  for (const item of orderItems) {
    const updated = await Inventory.findOneAndUpdate(
      {
        productId: item.productId,
        branchId,
        "reservations.orderId": { $ne: orderId }, // idempotent
        $expr: {
          $gte: [
            { $subtract: ["$quantity", { $sum: "$reservations.quantity" }] },
            item.quantity,
          ],
        },
      },
      { $push: { reservations: { orderId, quantity: item.quantity } } },
      { new: true, session },
    );

    // null = already reserved (retry) OR out of stock — check which
    if (!updated) {
      const existing = await Inventory.findOne({
        productId: item.productId,
        branchId,
        "reservations.orderId": orderId,
      }).session(session);

      if (!existing) {
        throw new Error(
          `${item.name} is out of stock or insufficient quantity.`,
        );
      }
      // else: already reserved for this order (retry), continue
    }
  }
}

// ---------------------------------------------------------------------------
// Tax calculation
// ---------------------------------------------------------------------------

export function computeTax(totalPrice: number): TaxBreakdown {
  const vatableSales = parseFloat((totalPrice / (1 + TAX_RATE)).toFixed(2));
  const vatAmount = parseFloat((totalPrice - vatableSales).toFixed(2));
  return { vatableSales, vatAmount, totalAmount: totalPrice };
}

// ---------------------------------------------------------------------------
// Maya checkout
// ---------------------------------------------------------------------------

function buildMayaPayload(
  body: CreateOrderPayload,
  mayaItems: ResolvedCartItem["mayaItem"][],
  tax: TaxBreakdown,
  referenceNumber: string,
) {
  const { firstName, lastName, customerEmail, customerPhone, shippingAddress } =
    body;
  const { line1, line2, city, province, zipCode } = shippingAddress ?? {};
  const { vatableSales, vatAmount, totalAmount } = tax;

  return {
    totalAmount: {
      value: totalAmount,
      currency: "PHP",
      details: { discount: 0, vatAmount, vatableSales },
    },
    items: mayaItems,
    buyer: {
      firstName,
      lastName,
      contact: { email: customerEmail, phone: customerPhone },
      ...(shippingAddress && {
        shippingAddress: {
          line1,
          line2,
          city,
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
    requestReferenceNumber: referenceNumber,
  };
}

async function createMayaCheckout(
  payload: ReturnType<typeof buildMayaPayload>,
) {
  if (!process.env.MAYA_PUBLIC_KEY) throw new Error("Maya key not configured");

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
  if (!response.ok) throw new Error(data.message ?? "Maya checkout failed");

  return data as { checkoutId: string; redirectUrl: string };
}

// ---------------------------------------------------------------------------
// Order persistence
// ---------------------------------------------------------------------------

export async function persistOrder(
  body: CreateOrderPayload,
  branch: Awaited<ReturnType<typeof fetchBranch>>,
  orderItems: ResolvedCartItem["orderItem"][],
  tax: TaxBreakdown,
  checkoutId: string,
  referenceNumber: string,
  customerId: string | null,
  session: ClientSession,
) {
  const {
    branchId,
    firstName,
    lastName,
    customerEmail,
    customerPhone,
    paymentMethod,
    notes,
    shippingAddress,
  } = body;
  const { vatableSales, vatAmount, totalAmount } = tax;

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
        items: orderItems,
        paymentInfo: {
          checkoutId,
          referenceNumber,
          firstName,
          lastName,
          customerEmail,
          customerPhone,
          paymentMethod,
          shippingAddress,
        },
        total: { vatableSales, vatAmount, totalAmount },
        notes,
      },
    ],
    { session },
  );

  return order[0];
}

// ---------------------------------------------------------------------------
// Side effects (fire-and-forget after commit)
// ---------------------------------------------------------------------------

export async function dispatchOrderCreatedEvent(
  orderId: string,
  referenceNumber: string,
  paymentMethod: string,
): Promise<void> {
  await inngest.send({
    name: "order/created",
    data: { orderId, referenceNumber, paymentMethod },
  });
}

export async function sendOrderConfirmationEmail(
  order: Awaited<ReturnType<typeof persistOrder>>,
): Promise<void> {
  const { error: emailError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: order.paymentInfo.customerEmail,
    subject: "Payment Needed!",
    react: OrderMessageEmail({ order }),
  });

  if (emailError) {
    console.error("[Order] Failed to send email:", emailError);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Guard: store open?
    await assertStoreIsOpen(session);

    // 2. Auth (optional customer)
    const customer = await requireBetterAuth(request);
    const customerId = customer?._id ?? null;

    // 3. Parse & validate body
    const body: CreateOrderPayload = await request.json();
    assertValidPayload(body);

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    // 5. Resolve cart items + reserve inventory
    const { totalPrice, orderItems, mayaItems } = await resolveCart(
      body.items,
      body.branchId,
      session,
    );

    if (totalPrice < MINIMUM_AMOUNT)
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);

    // 6. Tax breakdown
    const tax = computeTax(totalPrice);

    // 7. Maya checkout
    const referenceNumber = `ORDER-${Date.now()}`;
    const mayaPayload = buildMayaPayload(body, mayaItems, tax, referenceNumber);
    const { checkoutId, redirectUrl } = await createMayaCheckout(mayaPayload);

    // 8. Persist order
    const order = await persistOrder(
      body,
      branch,
      orderItems,
      tax,
      checkoutId,
      referenceNumber,
      customerId,
      session,
    );

    // 9. Reserve inventory now that we have orderId
    await reserveInventory(orderItems, body.branchId, order._id, session);

    const paymentMethod = order?.paymentInfo?.paymentMethod;

    await session.commitTransaction();
    session.endSession();

    // 10. Side effects (after commit — failures are non-fatal)
    await Promise.allSettled([
      dispatchOrderCreatedEvent(
        order._id.toString(),
        referenceNumber,
        paymentMethod,
      ),
      sendOrderConfirmationEmail(order),
    ]);

    return NextResponse.json(
      { referenceNumber, checkoutId, redirectUrl },
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
