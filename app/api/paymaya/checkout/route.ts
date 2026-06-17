import OrderMessageEmail from "@/app/emails/OrderMessageEmail";
import { getMayaCheckoutUrl } from "@/lib/mayaConfig";
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
import {
  calculatePromoCardDiscount,
  calculatePromoCardTotal,
  PROMO_CARD,
} from "@/lib/promoCard";
import { getPromoCardConfig } from "@/lib/promoCardConfig";
import {
  getPaidPromoCardBenefit,
  redeemCustomerVoucher,
} from "@/services/promoCardBenefits";
import {
  incrementOrderDiscountRedemption,
  resolveOrderDiscountPromotion,
} from "@/lib/order-promotions/order-promotion.application";
import type {
  AppliedOrderDiscountPromotion,
} from "@/lib/order-promotions/order-promotion.application";
import {
  incrementProductDiscountRedemptions,
  resolveProductDiscountPromotions,
  type AppliedProductDiscountPromotion,
  type ProductDiscountResolution,
} from "@/lib/product-promotions/product-promotion.application";
import {
  isWithinMetroManilaDeliveryArea,
  OUTSIDE_DELIVERY_AREA_MESSAGE,
} from "@/lib/deliveryArea";

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
    info?: string;
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
    info?: string;
    amount: { value: number };
    totalAmount: { value: number; currency: string };
  };
  subtotal: number;
}

interface TaxBreakdown {
  vatableSales: number;
  vatAmount: number;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  productDiscountAmount: number;
  productDiscountPromotions: AppliedProductDiscountPromotion[];
  orderDiscountAmount: number;
  orderDiscountPromotionId?: string;
  orderDiscountPromotionName?: string;
  voucherDiscountAmount: number;
  discountCode?: string;
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
  const coordinates = body.shippingAddress?.coordinates;

  if (!branchId) throw new Error("Branch is required.");
  if (!firstName || !lastName || !customerPhone)
    throw new Error("Customer details are required.");
  if (!items || !Array.isArray(items) || items.length === 0)
    throw new Error("Cart is empty.");
  if (!coordinates) throw new Error("Pin your delivery location on the map.");
  if (!isWithinMetroManilaDeliveryArea(coordinates)) {
    throw new Error(OUTSIDE_DELIVERY_AREA_MESSAGE);
  }
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
      info: product.info,
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
      info: product.info,
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

export function computeTax(
  subtotalAmount: number,
  productDiscountResolution: ProductDiscountResolution,
  applyPromoCardDiscount = false,
  discountRate: number = PROMO_CARD.discountRate,
  discountCode: string = PROMO_CARD.sku,
  voucherDiscountAmount = 0,
  orderDiscountPromotion: AppliedOrderDiscountPromotion | null = null,
): TaxBreakdown {
  const productDiscountAmount =
    productDiscountResolution.productDiscountAmount;
  const productDiscountedSubtotal =
    productDiscountResolution.discountedSubtotalAmount;
  const promoCardDiscountAmount = applyPromoCardDiscount
    ? calculatePromoCardDiscount(productDiscountedSubtotal, discountRate)
    : 0;
  const promoTotalAmount = applyPromoCardDiscount
    ? calculatePromoCardTotal(productDiscountedSubtotal, discountRate)
    : productDiscountedSubtotal;
  const orderDiscountAmount = orderDiscountPromotion?.discountAmount ?? 0;
  const discountAmount = Number(
    (
      productDiscountAmount +
      promoCardDiscountAmount +
      orderDiscountAmount
    ).toFixed(2),
  );
  const totalAmount = Number(
    Math.max(
      promoTotalAmount - orderDiscountAmount - voucherDiscountAmount,
      0,
    ).toFixed(2),
  );
  const vatableSales = parseFloat((totalAmount / (1 + TAX_RATE)).toFixed(2));
  const vatAmount = parseFloat((totalAmount - vatableSales).toFixed(2));

  return {
    vatableSales,
    vatAmount,
    totalAmount,
    subtotalAmount,
    discountAmount,
    productDiscountAmount,
    productDiscountPromotions: productDiscountResolution.appliedPromotions,
    orderDiscountAmount,
    ...(orderDiscountPromotion && {
      orderDiscountPromotionId: orderDiscountPromotion.promotionId.toString(),
      orderDiscountPromotionName: orderDiscountPromotion.name,
    }),
    voucherDiscountAmount,
    ...(promoCardDiscountAmount > 0 && { discountCode }),
  };
}

export async function assertCanUsePromoCardDiscount(
  customerId: string | null,
  session: ClientSession,
): Promise<{ discountRate: number; discountCode: string }> {
  const promoCardConfig = await getPromoCardConfig();
  if (!promoCardConfig.enabled) {
    throw new Error(
      "Promo card is currently unavailable pending final marketing review.",
    );
  }

  if (!customerId) {
    throw new Error("Login is required to use the promo card discount.");
  }

  const paidPromoCard = await getPaidPromoCardBenefit(customerId, session);

  if (!paidPromoCard) {
    throw new Error("A paid promo card is required to use this discount.");
  }

  return {
    discountRate: paidPromoCard.discountRate,
    discountCode: paidPromoCard.discountCode,
  };
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
  const {
    vatableSales,
    vatAmount,
    totalAmount,
    discountAmount,
    voucherDiscountAmount,
  } = tax;

  return {
    totalAmount: {
      value: totalAmount,
      currency: "PHP",
      details: {
        discount: Number((discountAmount + voucherDiscountAmount).toFixed(2)),
        vatAmount,
        vatableSales,
      },
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
    getMayaCheckoutUrl(),
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
  const {
    vatableSales,
    vatAmount,
    totalAmount,
    subtotalAmount,
    discountAmount,
    productDiscountAmount,
    productDiscountPromotions,
    orderDiscountAmount,
    orderDiscountPromotionId,
    orderDiscountPromotionName,
    discountCode,
    voucherDiscountAmount,
  } = tax;

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
        status:
          paymentMethod === "maya"
            ? ORDER_STATUSES.PENDING_PAYMENT
            : ORDER_STATUSES.PENDING,
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
        total: {
          vatableSales,
          vatAmount,
          totalAmount,
          subtotalAmount,
          discountAmount,
          productDiscountAmount,
          productDiscountPromotions: productDiscountPromotions.map(
            (promotion) => ({
              promotionId: promotion.promotionId,
              name: promotion.name,
              productId: promotion.productId,
              productName: promotion.productName,
              discountAmount: promotion.discountAmount,
            }),
          ),
          orderDiscountAmount,
          orderDiscountPromotionId,
          orderDiscountPromotionName,
          discountCode,
          voucherDiscountAmount,
        },
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
    if (body.paymentMethod !== "maya") {
      throw new Error("Invalid payment method for Maya checkout.");
    }

    const promoCardDiscount =
      body.applyPromoCardDiscount === true
        ? await assertCanUsePromoCardDiscount(customerId, session)
        : null;

    // 4. Resolve branch
    const branch = await fetchBranch(body.branchId, session);

    // 5. Resolve cart items + reserve inventory
    const { totalPrice, orderItems, mayaItems } = await resolveCart(
      body.items,
      body.branchId,
      session,
    );

    // 6. Tax breakdown
    const productDiscountResolution = await resolveProductDiscountPromotions(
      orderItems,
      session,
    );
    const productDiscountedTotal =
      productDiscountResolution.discountedSubtotalAmount;
    const promoAdjustedTotal = body.applyPromoCardDiscount
      ? calculatePromoCardTotal(
          productDiscountedTotal,
          promoCardDiscount?.discountRate,
        )
      : productDiscountedTotal;
    const orderDiscountPromotion = await resolveOrderDiscountPromotion(
      productDiscountedTotal,
      promoAdjustedTotal,
      session,
    );
    const voucherDiscountAmount = await redeemCustomerVoucher(
      customerId,
      Math.min(
        Math.max(0, Number(body.voucherAmount ?? 0)),
        Math.max(
          promoAdjustedTotal - (orderDiscountPromotion?.discountAmount ?? 0),
          0,
        ),
      ),
      session,
    );
    const tax = computeTax(
      totalPrice,
      productDiscountResolution,
      body.applyPromoCardDiscount === true,
      promoCardDiscount?.discountRate,
      promoCardDiscount?.discountCode,
      voucherDiscountAmount,
      orderDiscountPromotion,
    );

    if (tax.totalAmount < MINIMUM_AMOUNT)
      throw new Error(`Minimum order amount is ₱${MINIMUM_AMOUNT}`);

    await incrementOrderDiscountRedemption(orderDiscountPromotion, session);
    await incrementProductDiscountRedemptions(
      productDiscountResolution.appliedPromotions,
      session,
    );

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
      {
        orderId: order._id.toString(),
        referenceNumber,
        checkoutId,
        redirectUrl,
        status: order.status,
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
