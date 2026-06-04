type OrderDiscountCalculationInput = {
  discountType: "fixed" | "percentage";
  discountValue: number;
  maximumDiscountAmount?: number | null;
};

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function calculateOrderDiscountAmount(
  promotion: OrderDiscountCalculationInput,
  discountableAmount: number,
) {
  if (discountableAmount <= 0) return 0;

  if (promotion.discountType === "fixed") {
    return roundMoney(Math.min(promotion.discountValue, discountableAmount));
  }

  const percentageDiscount = roundMoney(
    discountableAmount * (promotion.discountValue / 100),
  );

  return promotion.maximumDiscountAmount
    ? Math.min(percentageDiscount, promotion.maximumDiscountAmount)
    : percentageDiscount;
}
