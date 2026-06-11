"use client";

import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import { formatCurrency } from "@/helper/formatCurrency";
import {
  BUNDLE_TYPE,
  DEFAULT_BUNDLE_PROMOTION_DISCOUNT,
  type BundleDiscountPromotionConfig,
  type BundleType,
} from "@/types/promotions/bundle-discount.type";
import {
  PROMOTION_DISCOUNT_DAYS,
  type PromotionDiscountDay,
  type PromotionDiscountType,
} from "@/types/promotions/promotion-constant";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  useBundleDiscountOptions,
  useSaveBundleDiscountPromotion,
} from "../../../hooks/useBundleDiscountPromotions";
import { getSelectedProducts } from "../../../helpers/getSelectedProducts";
import {
  toggleCategoryExpansion,
  toggleCategoryProducts,
  toggleProduct,
} from "../../../helpers/productSelection";
import { toggleDay } from "../../../helpers/toggleDay";
import { buildInitialPromotionForm } from "../helpers/buildInitialPromotionForm";
import { buildPromotionPayload } from "../helpers/buildPromotionPayload";
import {
  BundleDiscountPromotion,
  BundleDiscountPromotionForm,
} from "../type";

type BundleDiscountPromotionEditorProps = {
  promotion: BundleDiscountPromotion | BundleDiscountPromotionConfig;
  mode: "create" | "edit";
};

const PERCENTAGE_PRESETS = [10, 15, 20, 25, 30, 50];

const BUNDLE_TYPE_OPTIONS: {
  value: BundleType;
  label: string;
  description: string;
}[] = [
  {
    value: BUNDLE_TYPE.SAME_ITEMS,
    label: "Same item quantity",
    description: "Example: buy 2 apples and get the bundle discount.",
  },
  {
    value: BUNDLE_TYPE.ANY_ITEMS,
    label: "Any eligible items",
    description: "Example: buy any 3 selected items and get the discount.",
  },
  {
    value: BUNDLE_TYPE.COMBO_ITEMS,
    label: "Exact combo",
    description: "Example: buy 2 apples and 1 banana together.",
  },
];

function getBundleRuleCopy(form: BundleDiscountPromotionForm) {
  if (form.bundleType === BUNDLE_TYPE.COMBO_ITEMS) {
    return "Set the required quantity for each selected product.";
  }

  if (form.bundleType === BUNDLE_TYPE.SAME_ITEMS) {
    return "The same selected product must reach the required quantity.";
  }

  return "Any selected eligible products can count toward the required quantity.";
}

function normalizeSelectionForBundleType(
  form: BundleDiscountPromotionForm,
  bundleType: BundleType,
): Pick<
  BundleDiscountPromotionForm,
  "bundleType" | "productIds" | "categoryIds"
> {
  if (bundleType !== BUNDLE_TYPE.SAME_ITEMS) {
    return {
      bundleType,
      productIds: form.productIds,
      categoryIds: form.categoryIds,
    };
  }

  return {
    bundleType,
    productIds: form.productIds.slice(0, 1),
    categoryIds: [],
  };
}

export default function BundleDiscountPromotionEditor({
  promotion,
  mode,
}: BundleDiscountPromotionEditorProps) {
  const router = useRouter();
  const options = useBundleDiscountOptions();
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [form, setForm] = useState<BundleDiscountPromotionForm>(() =>
    buildInitialPromotionForm(promotion),
  );
  const initialForm = useMemo(
    () => buildInitialPromotionForm(promotion),
    [promotion],
  );
  const categories = options.data?.data ?? [];
  const selectedProducts = getSelectedProducts(categories, form.productIds);
  const isSameItemBundle = form.bundleType === BUNDLE_TYPE.SAME_ITEMS;
  const isComboBundle = form.bundleType === BUNDLE_TYPE.COMBO_ITEMS;
  const comboQuantityTotal = form.productIds.reduce((total, productId) => {
    const quantity = Number(form.productQuantities[productId] ?? 1);
    return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
  const requiredQuantity = Number(form.requiredQuantity);
  const hasValidQuantityRule = isComboBundle
    ? comboQuantityTotal >= 2
    : Number.isInteger(requiredQuantity) && requiredQuantity >= 2;
  const hasChanges =
    mode === "create" || JSON.stringify(form) !== JSON.stringify(initialForm);
  const goBackToList = () => router.push("/promotions/bundle-discounts");
  const savePromotion = useSaveBundleDiscountPromotion({
    onSuccess: goBackToList,
  });

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
                ? "Create Bundle Discount"
                : "Edit Bundle Discount"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Choose how the bundle qualifies, then set the discount and
              schedule.
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

        <div className="grid gap-3 md:grid-cols-3">
          {BUNDLE_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                form.bundleType === option.value
                  ? "border-brand-color-500 bg-brand-color-50"
                  : "border-stone-200 hover:border-brand-color-500"
              }`}
            >
              <input
                type="radio"
                name="bundleType"
                checked={form.bundleType === option.value}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    ...normalizeSelectionForBundleType(current, option.value),
                  }))
                }
                className="sr-only"
              />
              <span className="block text-sm font-bold text-stone-800">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
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
              }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label={
              form.discountType === "percentage"
                ? "Discount percentage"
                : "Discount amount"
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

          {form.discountType === "percentage" && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Percentage presets
              </p>
              <div className="flex flex-wrap gap-2">
                {PERCENTAGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        discountValue: String(preset),
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      form.discountValue === String(preset)
                        ? "border-brand-color-500 bg-brand-color-500 text-white"
                        : "border-stone-200 text-stone-600 hover:border-brand-color-500"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isComboBundle && (
          <div className="mt-4">
            <InputField
              label="Required quantity"
              type="number"
              min={2}
              step={1}
              value={form.requiredQuantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  requiredQuantity: event.target.value,
                }))
              }
              subLabel={getBundleRuleCopy(form)}
              required
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-800">Products</h2>
          <p className="mt-1 text-sm text-stone-500">
            {getBundleRuleCopy(form)}
          </p>
        </div>

        {options.isLoading ? (
          <p className="text-sm text-stone-500">Loading products...</p>
        ) : options.isError ? (
          <p className="text-sm font-semibold text-red-600">
            Failed to load products.
          </p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-stone-500">No products available.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const categoryProductIds = category.products.map(
                (product) => product._id,
              );
              const selectedCount = categoryProductIds.filter((id) =>
                form.productIds.includes(id),
              ).length;
              const allSelected =
                !isSameItemBundle && selectedCount === category.products.length;
              const isExpanded = expandedCategoryIds.includes(category._id);

              return (
                <div
                  key={category._id}
                  className="rounded-lg border border-stone-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <label
                      className={`flex items-center gap-3 ${
                        isSameItemBundle
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        disabled={isSameItemBundle}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            ...toggleCategoryProducts({
                              category,
                              checked: event.target.checked,
                              productIds: current.productIds,
                              categoryIds: current.categoryIds,
                            }),
                          }))
                        }
                        className="h-4 w-4 accent-brand-color-500"
                      />
                      <span>
                        <span className="block text-sm font-bold text-stone-800">
                          {category.name}
                        </span>
                        <span className="block text-xs text-stone-500">
                          {isSameItemBundle
                            ? "Select one item below"
                            : `${selectedCount} / ${category.products.length} selected`}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategoryIds((current) =>
                          toggleCategoryExpansion(current, category._id),
                        )
                      }
                      className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-brand-color-500"
                    >
                      {isExpanded ? "Hide items" : "Show items"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-3 border-t border-stone-100 p-3 md:grid-cols-2 xl:grid-cols-3">
                      {category.products.map((product) => {
                        const isSelected = form.productIds.includes(
                          product._id,
                        );

                        return (
                          <div
                            key={product._id}
                            className="rounded-lg border border-stone-100 p-3 hover:border-brand-color-500"
                          >
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setForm((current) => ({
                                    ...current,
                                    productIds: isSameItemBundle
                                      ? isSelected
                                        ? []
                                        : [product._id]
                                      : toggleProduct(
                                          current.productIds,
                                          product._id,
                                        ),
                                    categoryIds: isSameItemBundle
                                      ? []
                                      : current.categoryIds,
                                  }))
                                }
                                className="h-4 w-4 accent-brand-color-500"
                              />
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-stone-100" />
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-stone-800">
                                  {product.name}
                                </span>
                                <span className="block text-xs text-stone-500">
                                  {formatCurrency(product.price) ?? "--"}
                                </span>
                              </span>
                            </label>

                            {isComboBundle && isSelected && (
                              <div className="mt-3">
                                <InputField
                                  label="Combo quantity"
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={
                                    form.productQuantities[product._id] ?? "1"
                                  }
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      productQuantities: {
                                        ...current.productQuantities,
                                        [product._id]: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-800">Promotion Period</h2>
          <p className="mt-1 text-sm text-stone-500">
            If no end date is saved, the API defaults it to 180 days after the
            start date.
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
              {PROMOTION_DISCOUNT_DAYS.map((day: PromotionDiscountDay) => {
                const isSelected = form.days.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        days: toggleDay(current.days, day),
                      }))
                    }
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
              {form.name || DEFAULT_BUNDLE_PROMOTION_DISCOUNT.name}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-600">
              {form.discountType === "percentage"
                ? `${form.discountValue || 0}% off bundle`
                : `${formatCurrency(Number(form.discountValue) || 0)} off bundle`}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase text-stone-400">
              {form.enabled ? "Promotion is enabled" : "Promotion is disabled"}
            </p>
          </div>

          <div className="grid gap-4 border-t border-stone-200 pt-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Bundle type
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {
                  BUNDLE_TYPE_OPTIONS.find(
                    (option) => option.value === form.bundleType,
                  )?.label
                }
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Requirement
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {isComboBundle
                  ? `${comboQuantityTotal} combo items`
                  : `${form.requiredQuantity || 0} required items`}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">
                Products
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {selectedProducts.length} selected
              </p>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="border-t border-stone-200 pt-4">
              <p className="text-xs font-bold uppercase text-stone-400">
                Selected products
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProducts.slice(0, 12).map((product) => (
                  <span
                    key={product._id}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700"
                  >
                    {product.name}
                    {isComboBundle
                      ? ` x${form.productQuantities[product._id] ?? 1}`
                      : ""}
                  </span>
                ))}
                {selectedProducts.length > 12 && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                    +{selectedProducts.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-stone-400">
          This saves bundle configuration only. Checkout application still needs
          backend pricing logic before customers receive this discount.
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
            disabled={
              savePromotion.isPending ||
              !hasChanges ||
              form.productIds.length === 0 ||
              !hasValidQuantityRule
            }
            className="rounded-lg bg-brand-color-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c13500] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {savePromotion.isPending ? "Saving..." : "Create promotion"}
          </button>
        </div>
      </div>
    </form>
  );
}
