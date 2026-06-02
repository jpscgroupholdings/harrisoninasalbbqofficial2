"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { formatDate } from "@/helper/formatDate";
import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  DEFAULT_PROMO_CARD_VOUCHER_RULE,
  PROMO_CARD,
  PromoCardDay,
} from "@/lib/promoCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PromoCardForm = {
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
};

type PromoCardUsageHistory = {
  id: string;
  referenceNumber?: string;
  status: string;
  createdAt: string;
  subtotalAmount: number;
  discountAmount: number;
  voucherDiscountAmount: number;
  totalAmount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
};

type PromoCardStatus = {
  hasPaidPromoCard: boolean;
  hasPendingPromoCard: boolean;
  canRequestPromoCard: boolean;
  promoCard: {
    referenceNumber: string;
    status: "pending" | "paid" | "failed" | "expired" | "cancelled";
    firstName: string;
    lastName: string;
    customerEmail: string;
    customerPhone: string;
    purchasePrice: number;
    discountRate: number;
    createdAt: string;
    paidAt?: string;
  } | null;
  config: {
    name: string;
    discountRate: number;
    purchasePrice: number;
    sku: string;
    discountRules: {
      days: PromoCardDay[];
      discountRate: number;
    }[];
    voucherRule: {
      enabled: boolean;
      voucherAmount: number;
      minimumPurchase: number;
    };
  };
  voucherBalance: number;
  usageHistory?: PromoCardUsageHistory[];
};

const initialForm: PromoCardForm = {
  firstName: "",
  lastName: "",
  customerEmail: "",
  customerPhone: "",
};

const statusStyles: Record<
  NonNullable<PromoCardStatus["promoCard"]>["status"],
  string
> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

function formatCurrency(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCardNumber(referenceNumber?: string) {
  const source = referenceNumber?.replace(/[^a-zA-Z0-9]/g, "") || "PENDINGCARD";
  return source
    .padEnd(16, "0")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim()
    .toUpperCase();
}

function formatRuleDays(days: PromoCardDay[]) {
  return days.length === 7 ? "Every day" : days.join(", ");
}

export default function PromoCardPage() {
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const queryClient = useQueryClient();
  const { data: promoCardStatus, isLoading: isPromoCardStatusLoading } =
    useQuery({
      queryKey: ["customer", "promo-card", "status"],
      queryFn: () =>
        apiClient.get<PromoCardStatus>("/customer/promo-card/status"),
      staleTime: 30_000,
    });
  const [form, setForm] = useState<PromoCardForm>(initialForm);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get(
      "payment",
    );

    if (paymentStatus === "success") {
      toast.success("Promo card payment submitted for verification.");
    } else if (paymentStatus === "failed") {
      toast.error("Promo card payment failed.");
    } else if (paymentStatus === "cancelled") {
      toast.warning("Promo card payment was cancelled.");
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const [firstName = "", ...lastNameParts] = (session.user.name ?? "").split(
      " ",
    );

    setForm((current) => ({
      ...current,
      firstName: current.firstName || firstName,
      lastName: current.lastName || lastNameParts.join(" "),
      customerEmail: current.customerEmail || session.user.email || "",
    }));
  }, [session?.user]);

  const currentPromoCard = promoCardStatus?.promoCard;
  const currentConfig = promoCardStatus?.config ?? {
    ...PROMO_CARD,
    discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
    voucherRule: DEFAULT_PROMO_CARD_VOUCHER_RULE,
  };
  const discountRules = currentConfig.discountRules.length
    ? currentConfig.discountRules
    : DEFAULT_PROMO_CARD_DISCOUNT_RULES;
  const usageHistory = promoCardStatus?.usageHistory ?? [];
  const hasActivePromoCard =
    currentPromoCard?.status === "paid" ||
    currentPromoCard?.status === "pending";
  const canRequestPromoCard =
    isAuthenticated && promoCardStatus?.canRequestPromoCard === true;
  const primaryDiscountPercent = useMemo(
    () => (currentConfig.discountRate * 100).toFixed(0),
    [currentConfig.discountRate],
  );
  const cardHolderName = currentPromoCard
    ? `${currentPromoCard.firstName} ${currentPromoCard.lastName}`.trim()
    : [form.firstName, form.lastName].filter(Boolean).join(" ") ||
      session?.user?.name ||
      "Card Holder";
  const statusCopy =
    currentPromoCard?.status === "paid"
      ? "Active for eligible checkout discounts and voucher redemptions."
      : currentPromoCard?.status === "pending"
        ? "Payment is pending. Maya confirmation will activate the card."
        : currentPromoCard
          ? "Previous request was not completed. You can purchase again."
          : "Purchase once to unlock configured day discounts and voucher benefits.";

  const updateField = (field: keyof PromoCardForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please log in before requesting a promo card.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/paymaya/promo-card/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error ?? "Unable to create promo card payment.");
      }

      window.location.href = data.redirectUrl;
    } catch (error) {
      toast.error("Payment link failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsPending(false);
      queryClient.invalidateQueries({
        queryKey: ["customer", "promo-card", "status"],
      });
    }
  };

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-color-500">
              Harrison member card
            </p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950 md:text-5xl">
              {currentConfig.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {statusCopy}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Promo balance
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(promoCardStatus?.voucherBalance ?? 0)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  currentPromoCard
                    ? statusStyles[currentPromoCard.status]
                    : "bg-white/10 text-white"
                }`}
              >
                {currentPromoCard?.status ?? "Not purchased"}
              </span>
            </div>

            <div className="mt-10">
              <p className="wrap-break-word font-mono text-lg tracking-wider sm:text-2xl sm:tracking-widest">
                {formatCardNumber(currentPromoCard?.referenceNumber)}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Card holder
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {cardHolderName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Paid date
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(currentPromoCard?.paidAt, "Not yet paid")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {discountRules.map((rule, index) => (
              <div
                key={`${rule.days.join("-")}-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <DynamicIcon
                  name="BadgePercent"
                  size={22}
                  className="text-brand-color-500"
                />
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {(rule.discountRate * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-slate-500">
                  {formatRuleDays(rule.days)}
                </p>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <DynamicIcon
                name="CreditCard"
                size={22}
                className="text-brand-color-500"
              />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatCurrency(currentConfig.purchasePrice)}
              </p>
              <p className="text-sm text-slate-500">Card price</p>
            </div>
            {currentConfig.voucherRule.enabled && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <DynamicIcon
                  name="WalletCards"
                  size={22}
                  className="text-brand-color-500"
                />
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {formatCurrency(currentConfig.voucherRule.voucherAmount)}
                </p>
                <p className="text-sm text-slate-500">
                  Voucher for orders from{" "}
                  {formatCurrency(currentConfig.voucherRule.minimumPurchase)}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">
              {hasActivePromoCard ? "Card details" : "Purchase promo card"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {hasActivePromoCard
                ? `Card number ${currentPromoCard?.referenceNumber}`
                : `Unlock up to ${primaryDiscountPercent}% off on eligible days.`}
            </p>
          </div>

          {isAuthenticated && !hasActivePromoCard && (
            <form onSubmit={handleSubmit} className="grid gap-3">
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                required
                placeholder="First name"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              />
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                required
                placeholder="Last name"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              />
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  updateField("customerEmail", event.target.value)
                }
                required
                placeholder="Email address"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              />
              <input
                value={form.customerPhone}
                onChange={(event) =>
                  updateField("customerPhone", event.target.value)
                }
                required
                placeholder="Phone number"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-color-500"
              />

              <button
                type="submit"
                disabled={
                  isPending || isPromoCardStatusLoading || !canRequestPromoCard
                }
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-color-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c13500] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? (
                  <>
                    Creating payment
                    <DynamicIcon
                      name="Loader2"
                      size={16}
                      className="animate-spin"
                    />
                  </>
                ) : (
                  <>
                    Pay with Maya
                    <DynamicIcon name="ArrowRight" size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {!isAuthenticated && (
            <Link
              href="/promo-card?modal=login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Login to purchase
            </Link>
          )}

          {isAuthenticated && hasActivePromoCard && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="shrink-0 text-slate-500">
                  Registered email
                </span>
                <span className="min-w-0 truncate font-semibold text-slate-800">
                  {currentPromoCard?.customerEmail}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="shrink-0 text-slate-500">Phone</span>
                <span className="min-w-0 truncate font-semibold text-slate-800">
                  {currentPromoCard?.customerPhone}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="shrink-0 text-slate-500">Purchase price</span>
                <span className="min-w-0 truncate font-semibold text-slate-800">
                  {formatCurrency(currentPromoCard?.purchasePrice ?? 0)}
                </span>
              </div>
            </div>
          )}
        </aside>
      </section>

      {isAuthenticated && (
        <section className="mx-auto max-w-6xl px-4 pb-12 lg:px-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Promo purchase history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Orders where this card discount or voucher balance was used.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
              {usageHistory.length} orders
            </span>
          </div>

          {usageHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <DynamicIcon
                name="ReceiptText"
                size={32}
                className="mx-auto text-slate-400"
              />
              <p className="mt-3 font-semibold text-slate-800">
                No promo-card orders yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your discounted orders will appear here after checkout.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {usageHistory.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-slate-500">
                        {order.referenceNumber ?? order.id}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 divide-y divide-slate-100">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${item.name}-${index}`}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Qty {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-slate-500">Subtotal</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.subtotalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Promo savings</p>
                      <p className="font-semibold text-emerald-700">
                        -
                        {formatCurrency(
                          order.discountAmount + order.voucherDiscountAmount,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Paid total</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
