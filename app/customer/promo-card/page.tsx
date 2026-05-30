"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_PROMO_CARD_DISCOUNT_RULES,
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

type PromoCardStatus = {
  hasPaidPromoCard: boolean;
  hasPendingPromoCard: boolean;
  canRequestPromoCard: boolean;
  promoCard: {
    referenceNumber: string;
    status: "pending" | "paid" | "failed" | "expired" | "cancelled";
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
  };
};

const initialForm: PromoCardForm = {
  firstName: "",
  lastName: "",
  customerEmail: "",
  customerPhone: "",
};

export default function PromoCardPage() {
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const queryClient = useQueryClient();
  const { data: promoCardStatus, isLoading: isPromoCardStatusLoading } =
    useQuery({
      queryKey: ["customer", "promo-card", "status"],
      queryFn: () =>
        apiClient.get<PromoCardStatus>("/customer/promo-card/status"),
      enabled: isAuthenticated,
      staleTime: 30_000,
    });
  const canRequestPromoCard =
    isAuthenticated && promoCardStatus?.canRequestPromoCard === true;
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

  const discountPercent = useMemo(
    () =>
      ((promoCardStatus?.config.discountRate ?? PROMO_CARD.discountRate) * 100)
        .toFixed(0),
    [promoCardStatus?.config.discountRate],
  );

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

  const currentPromoCard = promoCardStatus?.promoCard;
  const currentConfig = promoCardStatus?.config ?? {
    ...PROMO_CARD,
    discountRules: DEFAULT_PROMO_CARD_DISCOUNT_RULES,
  };
  const hasActivePromoCard =
    currentPromoCard?.status === "paid" ||
    currentPromoCard?.status === "pending";
  const statusCopy =
    currentPromoCard?.status === "paid"
      ? "Your promo card is active. You can apply the 30% discount at checkout."
      : currentPromoCard?.status === "pending"
        ? "Your promo-card payment is pending. Complete payment or wait for Maya confirmation."
        : currentPromoCard
          ? "Your last promo-card request was not completed. You may request again."
          : "You do not have a promo card yet.";

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid min-h-[70vh] max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-color-500">
            Upcoming promo
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-950 md:text-5xl">
            {currentConfig.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Purchase the promo card online and enjoy {discountPercent}% discount
            on eligible customer orders. This is the temporary launch rule while
            we add automatic promo membership verification.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <DynamicIcon name="BadgePercent" size={22} className="text-brand-color-500" />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {discountPercent}%
              </p>
              <p className="text-sm text-slate-500">Order discount</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <DynamicIcon name="CreditCard" size={22} className="text-brand-color-500" />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                ₱{currentConfig.purchasePrice.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">Promo card price</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <DynamicIcon name="ShieldCheck" size={22} className="text-brand-color-500" />
              <p className="mt-3 text-2xl font-bold text-slate-950">Maya</p>
              <p className="text-sm text-slate-500">Online payment</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="self-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          {isAuthenticated && currentPromoCard && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-color-500 text-white">
                  <DynamicIcon name="BadgePercent" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Current promo card
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {statusCopy}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold uppercase text-slate-600">
                      {currentPromoCard.status}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 font-mono text-slate-500">
                      {currentPromoCard.referenceNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">
              {hasActivePromoCard ? "Promo card status" : "Purchase promo card"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {hasActivePromoCard
                ? "You cannot request another promo card while one is pending or active."
                : "Pay online through Maya or contact us to request assistance. Activation is verified by staff during this launch phase."}
            </p>
          </div>

          {!hasActivePromoCard && (
            <div className="grid gap-3">
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
            </div>
          )}

          {!hasActivePromoCard && (
            <button
              type="submit"
              disabled={
                isPending || isPromoCardStatusLoading || !canRequestPromoCard
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-color-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c13500] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? (
                <>
                  Creating payment
                  <DynamicIcon name="Loader2" size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Pay with Maya
                  <DynamicIcon name="ArrowRight" size={16} />
                </>
              )}
            </button>
          )}

          {!isAuthenticated && (
            <Link
              href="/promo-card?modal=login"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Login to request
            </Link>
          )}

          {isAuthenticated && !hasActivePromoCard && (
            <a
              href="mailto:support@harrisoninasal.com?subject=Promo%20Card%20Request"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-color-500 hover:text-brand-color-500"
            >
              Request assistance
            </a>
          )}
        </form>
      </section>
    </main>
  );
}
