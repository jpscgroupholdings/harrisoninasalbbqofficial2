"use client";

import LoadingPage from "@/components/ui/LoadingPage";
import { formatCurrency } from "@/helper/formatCurrency";
import { formatDate } from "@/helper/formatDate";
import { formatDateInputValue } from "@/helper/formatDateInputValue";
import { apiClient } from "@/lib/apiClient";
import {
  DEFAULT_ORDER_DISCOUNT_PROMOTION,
  ORDER_DISCOUNT_DAYS,
  OrderDiscountDay,
  OrderDiscountDayMode,
  OrderDiscountPromotionConfig,
  OrderDiscountType,
} from "@/lib/orderDiscountPromotion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type OrderDiscountPromotion = OrderDiscountPromotionConfig & {
  _id: string;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  createdAt?: string;
  updatedAt?: string;
};

type OrderDiscountPromotionsResponse = {
  data: OrderDiscountPromotion[];
};

type OrderDiscountPromotionMutationResponse = {
  promotion: OrderDiscountPromotion;
};

type OrderDiscountPromotionForm = {
  enabled: boolean;
  name: string;
  discountType: OrderDiscountType;
  discountValue: string;
  maximumDiscountAmount: string;
  minimumOrderAmount: string;
  startsAt: string;
  endsAt: string;
  dayMode: OrderDiscountDayMode;
  days: OrderDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions: string;
};

type PromotionPayload = {
  enabled: boolean;
  name: string;
  discountType: OrderDiscountType;
  discountValue: number;
  maximumDiscountAmount: number | null;
  minimumOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  dayMode: OrderDiscountDayMode;
  days: OrderDiscountDay[];
  startTime: string;
  endTime: string;
  maximumRedemptions: number | null;
};

function getCreateDefault(): OrderDiscountPromotionConfig {
  return {
    ...DEFAULT_ORDER_DISCOUNT_PROMOTION,
    startsAt: new Date(),
  };
}

function buildInitialForm(
  promotion: OrderDiscountPromotion | OrderDiscountPromotionConfig,
): OrderDiscountPromotionForm {
  return {
    enabled: promotion.enabled,
    name: promotion.name,
    discountType: promotion.discountType,
    discountValue: String(promotion.discountValue),
    maximumDiscountAmount:
      promotion.maximumDiscountAmount === null ||
      promotion.maximumDiscountAmount === undefined
        ? ""
        : String(promotion.maximumDiscountAmount),
    minimumOrderAmount: String(promotion.minimumOrderAmount),
    startsAt: formatDateInputValue(promotion.startsAt),
    endsAt: formatDateInputValue(promotion.endsAt),
    dayMode: promotion.dayMode,
    days: promotion.days,
    startTime: promotion.startTime,
    endTime: promotion.endTime,
    maximumRedemptions:
      promotion.maximumRedemptions === null ||
      promotion.maximumRedemptions === undefined
        ? ""
        : String(promotion.maximumRedemptions),
  };
}

function buildPayload(form: OrderDiscountPromotionForm): PromotionPayload {
  return {
    enabled: form.enabled,
    name: form.name,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maximumDiscountAmount:
      form.discountType === "percentage" && form.maximumDiscountAmount
        ? Number(form.maximumDiscountAmount)
        : null,
    minimumOrderAmount: Number(form.minimumOrderAmount || 0),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    dayMode: form.dayMode,
    days: form.dayMode === "specific_days" ? form.days : [],
    startTime: form.startTime,
    endTime: form.endTime,
    maximumRedemptions: form.maximumRedemptions
      ? Number(form.maximumRedemptions)
      : null,
  };
}

function getDiscountLabel(promotion: OrderDiscountPromotion) {
  if (promotion.discountType === "fixed") {
    return `${formatCurrency(promotion.discountValue)} off`;
  }

  return `${promotion.discountValue}% off${
    promotion.maximumDiscountAmount
      ? ` up to ${formatCurrency(promotion.maximumDiscountAmount)}`
      : ""
  }`;
}

function getPreviewLines(form: OrderDiscountPromotionForm) {
  const discountValue = Number(form.discountValue || 0);
  const minimumOrderAmount = Number(form.minimumOrderAmount || 0);
  const maxDiscount = Number(form.maximumDiscountAmount || 0);
  const maxRedemptions = Number(form.maximumRedemptions || 0);
  const discountLine =
    form.discountType === "percentage"
      ? `${discountValue}% off whole order${
          maxDiscount > 0
            ? `, capped at ${formatCurrency(maxDiscount)}`
            : ", no maximum cap"
        }`
      : `${formatCurrency(discountValue)} off whole order`;
  const daysLine =
    form.dayMode === "opening_days"
      ? "Every opening day"
      : form.days.length
        ? form.days.join(", ")
        : "No specific days selected";

  return [
    form.enabled ? "Promotion is active" : "Promotion is disabled",
    discountLine,
    `Minimum order: ${formatCurrency(minimumOrderAmount)}`,
    `Period: ${form.startsAt || "No start date"} to ${
      form.endsAt || "no end date"
    }`,
    `Days: ${daysLine}`,
    `Time: ${form.startTime} to ${form.endTime}`,
    maxRedemptions > 0
      ? `Maximum redemptions: ${maxRedemptions}`
      : "Maximum redemptions: no limit",
  ];
}

function OrderDiscountPromotionEditor({
  promotion,
  mode,
  onClose,
}: {
  promotion: OrderDiscountPromotion | OrderDiscountPromotionConfig;
  mode: "create" | "edit";
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OrderDiscountPromotionForm>(() =>
    buildInitialForm(promotion),
  );
  const initialForm = useMemo(
    () => buildInitialForm(promotion),
    [promotion],
  );
  const previewLines = getPreviewLines(form);
  const hasChanges =
    mode === "create" || JSON.stringify(form) !== JSON.stringify(initialForm);
  const showPercentageCap = form.discountType === "percentage";
  const promotionId = "_id" in promotion ? promotion._id : null;

  const savePromotion = useMutation({
    mutationFn: (payload: PromotionPayload) =>
      mode === "create"
        ? apiClient.post<OrderDiscountPromotionMutationResponse>(
            "/admin/order-discount-promotions",
            payload,
          )
        : apiClient.patch<OrderDiscountPromotionMutationResponse>(
            `/admin/order-discount-promotions/${promotionId}`,
            payload,
          ),
    onSuccess: async () => {
      toast.success(
        mode === "create"
          ? "Order discount promotion created."
          : "Order discount promotion updated.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "order-discount-promotions"],
      });
      onClose();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to save order discount promotion.");
    },
  });

  const toggleDay = (day: OrderDiscountDay) => {
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
    savePromotion.mutate(buildPayload(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-800">
              {mode === "create" ? "Create Order Discount" : "Edit Order Discount"}
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
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              Promotion name
            </span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              Discount type
            </span>
            <select
              value={form.discountType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  discountType: event.target.value as OrderDiscountType,
                  maximumDiscountAmount:
                    event.target.value === "percentage"
                      ? current.maximumDiscountAmount
                      : "",
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              {form.discountType === "percentage"
                ? "Discount percentage"
                : "Discount amount"}
            </span>
            <input
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
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>

          {showPercentageCap && (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-700">
                Maximum discount amount
              </span>
              <input
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
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
                placeholder="No limit"
              />
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              Minimum order amount
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.minimumOrderAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  minimumOrderAmount: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-800">
            Promotion Period
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Set when this discount is visible and eligible.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              Start date
            </span>
            <input
              type="date"
              value={form.startsAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              End date
            </span>
            <input
              type="date"
              value={form.endsAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endsAt: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              Start time
            </span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">
              End time
            </span>
            <input
              type="time"
              value={form.endTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              required
            />
          </label>
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
              {ORDER_DISCOUNT_DAYS.map((day) => {
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

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-semibold text-stone-700">
            Maximum redemptions
          </span>
          <input
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
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
            placeholder="No limit"
          />
        </label>
      </div>

      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-stone-800">Preview</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {previewLines.map((line) => (
            <div
              key={line}
              className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700"
            >
              {line}
            </div>
          ))}
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
            onClick={onClose}
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

type PromotionStatus =
  | "active"
  | "disabled"
  | "ended"
  | "redeemed_out"
  | "scheduled";

const promotionStatusStyles: Record<PromotionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  disabled: "bg-stone-100 text-stone-600",
  ended: "bg-red-100 text-red-700",
  redeemed_out: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
};

const promotionStatusLabels: Record<PromotionStatus, string> = {
  active: "Active",
  disabled: "Disabled",
  ended: "Ended",
  redeemed_out: "Redeemed out",
  scheduled: "Scheduled",
};

function getPromotionStatus(
  promo: OrderDiscountPromotion,
  now = new Date(),
): PromotionStatus {
  if (!promo.enabled) return "disabled";
  if (promo.maximumRedemptions && promo.redemptionCount >= promo.maximumRedemptions) {
    return "redeemed_out";
  }
  if (promo.endsAt && new Date(promo.endsAt) < now) return "ended";
  if (new Date(promo.startsAt) > now) return "scheduled";
  return "active";
}

function PromotionList({
  promotions,
  onCreate,
  onEdit,
}: {
  promotions: OrderDiscountPromotion[];
  onCreate: () => void;
  onEdit: (promotion: OrderDiscountPromotion) => void;
}) {
  const queryClient = useQueryClient();
  const deletePromotion = useMutation({
    mutationFn: (promotionId: string) =>
      apiClient.delete<{ success: boolean }>(
        `/admin/order-discount-promotions/${promotionId}`,
      ),
    onSuccess: async () => {
      toast.success("Order discount promotion deleted.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "order-discount-promotions"],
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to delete order discount promotion.");
    },
  });

  const handleDelete = (promotion: OrderDiscountPromotion) => {
    const confirmed = window.confirm(
      `Delete "${promotion.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;
    deletePromotion.mutate(promotion._id);
  };

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-800">
            Created Discounts
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Manage whole-order discount promotions.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-brand-color-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c13500]"
        >
          Create discount
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-stone-700">
            No order discount promotions yet.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Create one to configure a whole-order discount.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase text-stone-500">
                <th className="px-3 py-3 font-bold">Name</th>
                <th className="px-3 py-3 font-bold">Discount</th>
                <th className="px-3 py-3 font-bold">Minimum</th>
                <th className="px-3 py-3 font-bold">Schedule</th>
                <th className="px-3 py-3 font-bold">Redemptions</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => {
                const status = getPromotionStatus(promotion);

                return (
                  <tr
                    key={promotion._id}
                    className="border-b border-stone-100 last:border-0"
                  >
                  <td className="px-3 py-4">
                    <p className="font-bold text-stone-800">
                      {promotion.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDate(promotion.startsAt)} - {" "}
                      {formatDate(promotion.endsAt, "No end Date")}
                    </p>
                  </td>
                  <td className="px-3 py-4 font-medium text-stone-700">
                    {getDiscountLabel(promotion)}
                  </td>
                  <td className="px-3 py-4 text-stone-600">
                    {formatCurrency(promotion.minimumOrderAmount)}
                  </td>
                  <td className="px-3 py-4 text-stone-600">
                    <p>
                      {promotion.dayMode === "opening_days"
                        ? "Opening days"
                        : promotion.days.join(", ")}
                    </p>
                    <p className="text-xs text-stone-500">
                      {promotion.startTime} - {promotion.endTime}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-stone-600">
                    {promotion.redemptionCount} /{" "}
                    {promotion.maximumRedemptions ?? "No limit"}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${promotionStatusStyles[status]}`}
                    >
                      {promotionStatusLabels[status]}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(promotion)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-brand-color-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletePromotion.isPending}
                        onClick={() => handleDelete(promotion)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OrderDiscountPromotionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "order-discount-promotions"],
    queryFn: () =>
      apiClient.get<OrderDiscountPromotionsResponse>(
        "/admin/order-discount-promotions",
      ),
  });
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [selectedPromotion, setSelectedPromotion] =
    useState<OrderDiscountPromotion | null>(null);
  const promotions = data?.data ?? [];

  if (isLoading) return <LoadingPage />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-stone-800">
          Order Discounts
        </h1>
        <p className="text-stone-500">
          Create and manage whole-order discounts with schedule, minimum order,
          caps, and redemption limits.
        </p>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">
          Failed to load order discount promotions.
        </p>
      ) : (
        <PromotionList
          promotions={promotions}
          onCreate={() => {
            setSelectedPromotion(null);
            setEditorMode("create");
          }}
          onEdit={(promotion) => {
            setSelectedPromotion(promotion);
            setEditorMode("edit");
          }}
        />
      )}

      {editorMode && (
        <OrderDiscountPromotionEditor
          key={selectedPromotion?._id ?? "create"}
          mode={editorMode}
          promotion={selectedPromotion ?? getCreateDefault()}
          onClose={() => {
            setEditorMode(null);
            setSelectedPromotion(null);
          }}
        />
      )}
    </section>
  );
}
