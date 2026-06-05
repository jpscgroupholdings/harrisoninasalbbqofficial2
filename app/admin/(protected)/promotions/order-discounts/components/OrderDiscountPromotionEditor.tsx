"use client";

import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import {
  DEFAULT_ORDER_DISCOUNT_PROMOTION,
  type OrderDiscountPromotionConfig,
} from "@/types/promotions/order-discount.type";
import {
  PROMOTION_DISCOUNT_DAYS,
  type PromotionDiscountDay,
  type PromotionDiscountType,
} from "@/types/promotions/promotion-constant";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useSaveOrderDiscountPromotion } from "../../hooks/useOrderDiscountPromotions";
import { buildInitialPromotionForm } from "../helpers/buildInitialPromotionForm";
import { buildPromotionPayload } from "../helpers/buildPromotionPayload";
import { getPromotionPreview } from "../helpers/getPromotionPreview";
import {
  OrderDiscountPromotion,
  OrderDiscountPromotionForm,
} from "../types";

type OrderDiscountPromotionEditorProps = {
  promotion: OrderDiscountPromotion | OrderDiscountPromotionConfig;
  mode: "create" | "edit";
};

export function OrderDiscountPromotionEditor({
  promotion,
  mode,
}: OrderDiscountPromotionEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<OrderDiscountPromotionForm>(() =>
    buildInitialPromotionForm(promotion),
  );
  const initialForm = useMemo(
    () => buildInitialPromotionForm(promotion),
    [promotion],
  );
  const preview = getPromotionPreview(form);
  const hasChanges =
    mode === "create" || JSON.stringify(form) !== JSON.stringify(initialForm);
  const showPercentageCap = form.discountType === "percentage";
  const promotionId = "_id" in promotion ? promotion._id : null;

  const goBackToList = () => router.push("/promotions/order-discounts");
  const savePromotion = useSaveOrderDiscountPromotion({
    mode,
    promotionId,
    onSuccess: goBackToList,
  });

  const toggleDay = (day: PromotionDiscountDay) => {
    setForm((current) => {
      const hasDay = current.days.includes(day);

      return {
        ...current,
        days: hasDay
          ? current.days.filter((candidate) => candidate !== day)
          : [...current.days, day],
      };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    savePromotion.mutate(buildPromotionPayload(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-800">
              {mode === "create"
                ? "Create Order Discount"
                : "Edit Order Discount"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Configure discount value, eligibility rules, schedule, and
              redemption limit.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-brand-color-500"
            />
            Enabled
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Promotion Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            required
          />

          <SelectField
            label="Discount Type"
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed Amount" },
            ]}
            value={form.discountType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                discountType: event.target.value as PromotionDiscountType,
                maximumDiscountAmount:
                  event.target.value === "percentage"
                    ? current.maximumDiscountAmount
                    : "",
              }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InputField
            label={
              form.discountType === "percentage"
                ? "Discount percentage"
                : "Discount Amount"
            }
            type="number"
            min={0.01}
            max={form.discountType === "percentage" ? 100 : undefined}
            step={0.01}
            value={form.discountValue}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                discountValue: event.target.value,
              }))
            }
            required
          />

          {showPercentageCap && (
            <InputField
              label="Maximum discount amount"
              type="number"
              min={0}
              step={0.01}
              value={form.maximumDiscountAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  maximumDiscountAmount: event.target.value,
                }))
              }
              placeholder="No limit"
            />
          )}

          <InputField
            label="Minimum order amount"
            type="number"
            min={DEFAULT_ORDER_DISCOUNT_PROMOTION.minimumOrderAmount}
            step={0.01}
            value={form.minimumOrderAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minimumOrderAmount: event.target.value,
              }))
            }
            required
          />
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-800">Promotion Period</h2>
          <p className="mt-1 text-sm text-stone-500">
            Set when this discount is visible and eligible.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Start Date"
            type="date"
            value={form.startsAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startsAt: event.target.value,
              }))
            }
            required
          />

          <InputField
            label="End Date"
            type="date"
            value={form.endsAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                endsAt: event.target.value,
              }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="Start time"
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startTime: event.target.value,
              }))
            }
            required
          />
          <InputField
            label="End time"
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                endTime: event.target.value,
              }))
            }
            required
          />
        </div>

        <div className="mt-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3">
              <input
                type="radio"
                name="day-mode"
                checked={form.dayMode === "opening_days"}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    dayMode: "opening_days",
                  }))
                }
                className="mt-1 h-4 w-4 accent-brand-color-500"
              />
              <span>
                <span className="block text-sm font-semibold text-stone-800">
                  Every opening day
                </span>
                <span className="block text-xs text-stone-500">
                  Follows the current store operating schedule.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3">
              <input
                type="radio"
                name="day-mode"
                checked={form.dayMode === "specific_days"}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    dayMode: "specific_days",
                  }))
                }
                className="mt-1 h-4 w-4 accent-brand-color-500"
              />
              <span>
                <span className="block text-sm font-semibold text-stone-800">
                  Specific days
                </span>
                <span className="block text-xs text-stone-500">
                  Choose one or more weekdays.
                </span>
              </span>
            </label>
          </div>

          {form.dayMode === "specific_days" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PROMOTION_DISCOUNT_DAYS.map((day) => {
                const isSelected = form.days.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? "border-brand-color-500 bg-brand-color-500 text-white"
                        : "border-stone-200 text-stone-600 hover:border-brand-color-500"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5">
          <InputField
            label="Maximum redemptions"
            type="number"
            min={1}
            step={1}
            value={form.maximumRedemptions}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maximumRedemptions: event.target.value,
              }))
            }
            placeholder="No limit"
          />
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-stone-800">Preview</h2>

        <div className="mt-4 space-y-5 rounded-lg border border-stone-200 bg-stone-50 p-5">
          <div>
            <p className="text-lg font-bold text-stone-900">
              {preview.headline}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-600">
              {preview.description}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase text-stone-400">
              {form.enabled ? "Promotion is active" : "Promotion is disabled"}
            </p>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-xs font-bold uppercase text-stone-400">
              Discount target
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-800">
              {preview.discountTarget}
            </p>
          </div>

          <div className="grid gap-4 border-t border-stone-200 pt-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Discount value
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {preview.discountValue}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Maximum discount amount
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {preview.maximumDiscountAmount}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Minimum order required
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {preview.minimumOrderAmount}
              </p>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-xs font-bold uppercase text-stone-400">
              Discount conditions
            </p>
            <div className="mt-3 space-y-3">
              {preview.conditions.map((condition) => (
                <div key={condition.label}>
                  <p className="text-sm font-semibold text-stone-800">
                    {condition.value}
                  </p>
                  <p className="text-xs text-stone-500">{condition.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-stone-400">
          This saves promotion rules only. Checkout application is a separate
          backend pricing step.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goBackToList}
            className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-bold text-stone-700 transition-colors hover:border-brand-color-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={savePromotion.isPending || !hasChanges}
            className="rounded-lg bg-brand-color-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c13500] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {savePromotion.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create promotion"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
