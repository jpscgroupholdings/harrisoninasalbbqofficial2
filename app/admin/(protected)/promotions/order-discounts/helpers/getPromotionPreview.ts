import { formatCurrency } from "@/helper/formatCurrency";
import { DEFAULT_ORDER_DISCOUNT_PROMOTION } from "@/types/promotions/order-discount.type";
import { OrderDiscountPromotionForm, PromotionPreview } from "../types";
import { formatPreviewDateTime } from "./formatPreviewDateTime";
import { getDiscountValueText } from "./getDiscountValueText";

export function getPromotionPreview(
  form: OrderDiscountPromotionForm,
): PromotionPreview {
  const minimumOrderAmount = Number(
    form.minimumOrderAmount ||
      DEFAULT_ORDER_DISCOUNT_PROMOTION.minimumOrderAmount,
  );
  const maxDiscount = Number(form.maximumDiscountAmount || 0);
  const maxRedemptions = Number(form.maximumRedemptions || 0);
  const discountValueText = getDiscountValueText(form);
  const minimumOrderText = formatCurrency(minimumOrderAmount);
  const validDays =
    form.dayMode === "opening_days"
      ? "Every day the restaurant is open"
      : form.days.length
        ? form.days.join(", ")
        : "No specific days selected";
  const openingHours =
    form.startTime === "00:00" && form.endTime === "23:59"
      ? "All opening hours"
      : `${form.startTime} to ${form.endTime}`;
  const maximumDiscountAmount =
    form.discountType === "percentage" && maxDiscount > 0
      ? formatCurrency(maxDiscount)
      : "No limit";
  const startsAt = formatPreviewDateTime(
    form.startsAt,
    form.startTime,
    "No start date selected",
  );
  const endsAt = form.endsAt
    ? formatPreviewDateTime(form.endsAt, form.endTime, "No end date selected")
    : "No end date";

  return {
    headline: `${discountValueText} off with ${minimumOrderText} min. order`,
    description: `${form.name || "Whole order discount"} starts on ${startsAt}`,
    discountTarget: "Discount off the entire order",
    discountValue: discountValueText,
    maximumDiscountAmount,
    minimumOrderAmount: minimumOrderText,
    conditions: [
      {
        value: startsAt,
        label: "Promotion start date and time",
      },
      {
        value: endsAt,
        label: "Promotion end date and time",
      },
      {
        value: validDays,
        label: "Days valid",
      },
      {
        value: openingHours,
        label: "Valid hours",
      },
      {
        value: maxRedemptions > 0 ? String(maxRedemptions) : "No limit",
        label: "Maximum number of redemptions",
      },
      {
        value: "No limit",
        label: "Maximum redemptions per customer",
      },
    ],
  };
}
