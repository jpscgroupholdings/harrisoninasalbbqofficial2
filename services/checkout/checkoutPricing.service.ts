import { ClientSession } from "mongoose";
import { Branch } from "@/models/Branch";
import { CreateOrderPayload } from "@/types/OrderTypes";
import { calculateDeliveryFeeFromCoordinates } from "@/lib/deliveryFee";
import {
  AppliedProductDiscountPromotion,
  ProductDiscountResolution,
} from "@/lib/product-promotions/product-promotion.application";
import {
  calculatePromoCardDiscount,
  calculatePromoCardTotal,
  PROMO_CARD,
} from "@/lib/promoCard";
import { AppliedOrderDiscountPromotion } from "@/lib/order-promotions/order-promotion.application";

// -------------- TYPES ---------------------------
export interface TaxBreakdown {
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

  deliveryFeeAmount: number;
  deliveryDistanceKm?: number;
  deliveryBillableKm?: number;
}

// ------------------ CONSTANT -------------------------------
export const TAX_RATE = 0.12;

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

export async function fetchBranch(branchId: string, session: ClientSession) {
  const branch = await Branch.findById(branchId).session(session);
  if (!branch) throw new Error("Branch not found!");
  return branch;
}

const isBranchCoordinates = (
  coordinates: unknown,
): coordinates is [number, number] =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every(
    (coord) => typeof coord === "number" && Number.isFinite(coord),
  );

// server-side validation to ensure coordinates are in expected format before calculating delivery fee
export function resolveDeliveryFee(
  branch: Awaited<ReturnType<typeof fetchBranch>>,
  shippingAddress: CreateOrderPayload["shippingAddress"],
) {
  const branchCoordinates = branch.location?.coordinates;
  const deliveryCoordinates = shippingAddress?.coordinates;

  if (!isBranchCoordinates(branchCoordinates) || !deliveryCoordinates) {
    throw new Error("Delivery fee cannot be calculated for this order.");
  }

  return calculateDeliveryFeeFromCoordinates(
    branchCoordinates,
    deliveryCoordinates,
  );
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
  deliveryFeeAmount = 0,
  deliveryDistanceKm = 0,
  deliveryBillableKm = 0,
): TaxBreakdown {
  const productDiscountAmount = productDiscountResolution.productDiscountAmount;
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
      promoTotalAmount -
        orderDiscountAmount -
        voucherDiscountAmount +
        deliveryFeeAmount,
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
    deliveryFeeAmount,
    deliveryDistanceKm,
    deliveryBillableKm,
  };
}
