import {
  getPromoCardDay,
  getPromoCardDiscountRateForDay,
  PromoCardDiscountRule,
  PromoCardVoucherRule,
} from "@/lib/promoCard";
import { CustomerVoucher } from "@/models/CustomerVoucher";
import { PromoCardPurchase } from "@/models/PromoCardPurchase";
import mongoose, { ClientSession } from "mongoose";

type PromoCardBenefit = {
  discountRate: number;
  discountCode: string;
  voucherRule?: PromoCardVoucherRule;
};

type OrderForVoucherAward = {
  _id: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId | string | null;
  total?: {
    totalAmount?: number;
    subtotalAmount?: number;
  };
};

export async function getPaidPromoCardBenefit(
  customerId: string | mongoose.Types.ObjectId | null,
  session?: ClientSession,
): Promise<PromoCardBenefit | null> {
  if (!customerId) return null;

  const query = PromoCardPurchase.findOne({
    customerId,
    status: "paid",
  }).sort({ paidAt: -1, createdAt: -1 });

  if (session) query.session(session);

  const paidPromoCard = await query.lean<{
    referenceNumber: string;
    discountRate: number;
    discountRules?: PromoCardDiscountRule[];
    voucherRule?: PromoCardVoucherRule;
  }>();

  if (!paidPromoCard) return null;

  const discountRate = getPromoCardDiscountRateForDay(
    paidPromoCard.discountRules,
    getPromoCardDay(),
    paidPromoCard.discountRate,
  );

  return {
    discountRate,
    discountCode: paidPromoCard.referenceNumber,
    voucherRule: paidPromoCard.voucherRule,
  };
}

export async function awardPromoCardVoucherForOrder(
  order: OrderForVoucherAward,
  session?: ClientSession,
): Promise<void> {
  if (!order.customerId) return;

  const benefit = await getPaidPromoCardBenefit(order.customerId, session);
  const voucherRule = benefit?.voucherRule;

  if (!voucherRule?.enabled) return;

  const eligibleAmount = order.total?.totalAmount ?? 0;
  if (eligibleAmount < voucherRule.minimumPurchase) return;

  await CustomerVoucher.updateOne(
    { sourceOrderId: order._id },
    {
      $setOnInsert: {
        customerId: order.customerId,
        sourceOrderId: order._id,
        originalAmount: voucherRule.voucherAmount,
        balance: voucherRule.voucherAmount,
        minimumPurchase: voucherRule.minimumPurchase,
        status: "active",
      },
    },
    { upsert: true, session },
  );
}

export async function getCustomerVoucherBalance(
  customerId: string | mongoose.Types.ObjectId | null,
): Promise<number> {
  if (!customerId) return 0;

  const result = await CustomerVoucher.aggregate<{ balance: number }>([
    { $match: { customerId: new mongoose.Types.ObjectId(String(customerId)), status: "active" } },
    { $group: { _id: null, balance: { $sum: "$balance" } } },
  ]);

  return result[0]?.balance ?? 0;
}

export async function redeemCustomerVoucher(
  customerId: string | mongoose.Types.ObjectId | null,
  requestedAmount: number,
  session: ClientSession,
): Promise<number> {
  if (!customerId || requestedAmount <= 0) return 0;

  let remaining = Number(requestedAmount.toFixed(2));
  let redeemed = 0;

  const vouchers = await CustomerVoucher.find({
    customerId,
    status: "active",
    balance: { $gt: 0 },
  })
    .sort({ createdAt: 1 })
    .session(session);

  for (const voucher of vouchers) {
    if (remaining <= 0) break;

    const amount = Math.min(voucher.balance, remaining);
    voucher.balance = Number((voucher.balance - amount).toFixed(2));
    voucher.status = voucher.balance <= 0 ? "used" : "active";
    await voucher.save({ session });

    redeemed = Number((redeemed + amount).toFixed(2));
    remaining = Number((remaining - amount).toFixed(2));
  }

  if (redeemed < requestedAmount) {
    throw new Error("Insufficient voucher balance.");
  }

  return redeemed;
}

export async function refundCustomerVoucher(
  customerId: string | mongoose.Types.ObjectId | null,
  amount: number,
  session?: ClientSession,
): Promise<void> {
  if (!customerId || amount <= 0) return;

  await CustomerVoucher.create(
    [
      {
        customerId,
        originalAmount: amount,
        balance: amount,
        minimumPurchase: 0,
        status: "active",
      },
    ],
    session ? { session } : undefined,
  );
}
