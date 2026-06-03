"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { formatCurrency } from "@/helper/formatCurrency";
import type { ActivePromotion } from "@/types/promotions.type";
import { useState } from "react";
import { useActivePromotions } from "../hooks/useActivePromotions";

function getDiscountLabel(promotion: ActivePromotion) {
  return promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `${formatCurrency(promotion.discountValue)} off`;
}

function getValidUntilLabel(endsAt: string | null) {
  if (!endsAt) return "No end date";

  return `Until ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(endsAt))}`;
}

export default function ActivePromotionsFloatingNotice() {
  const { data, isLoading, isError } = useActivePromotions();
  const [isOpen, setIsOpen] = useState(true);
  const promotions = data?.data ?? [];

  if (isLoading || isError || promotions.length === 0) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group fixed right-3 top-24 z-50 flex items-center gap-1.5 rounded-full border border-brand-color-500/25 bg-white px-3 py-1.5 text-xs font-bold text-brand-color-500 shadow-lg shadow-stone-900/10 transition hover:bg-brand-color-500 hover:text-white sm:right-5"
      >
        <DynamicIcon name="TicketPercent" size={15} />
        Promos
        <span className="rounded-full bg-brand-color-500 px-1.5 py-0.5 text-[10px] leading-none text-white group-hover:bg-white group-hover:text-brand-color-500">
          {promotions.length}
        </span>
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 px-3">
      <div className="pointer-events-auto mx-auto flex max-w-md flex-col gap-2 sm:ml-auto sm:mr-5">
        {promotions.map((promotion) => (
          <article
            key={promotion.id}
            className="flex w-full overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/15 ring-1 ring-black/5"
          >
            <div className="relative flex flex-1 flex-col justify-between bg-brand-color-500 p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-thin uppercase tracking-widest text-white/75">
                    {promotion.name}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold uppercase tracking-tight">
                    {getDiscountLabel(promotion)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close promotions"
                >
                  <DynamicIcon name="X" size={15} />
                </button>
              </div>

              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/65">
                    Valid
                  </p>
                  <p className="text-xs font-bold">
                    {getValidUntilLabel(promotion.endsAt)}
                  </p>
                </div>

                {promotion.maximumDiscountAmount !== null && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-white/65">
                      Capped at
                    </p>
                    <p className="text-xs font-bold">
                      {formatCurrency(promotion.maximumDiscountAmount)}
                    </p>
                  </div>
                )}
              </div>

              <div className="absolute -right-3 -top-3 hidden h-6 w-6 rounded-full bg-white md:block" />
              <div className="absolute -right-3 -bottom-3 hidden h-6 w-6 rounded-full bg-white md:block" />
            </div>

            <div className="relative flex w-4 shrink-0 items-center justify-center bg-white">
              <div className="h-full border-l-2 border-dashed border-stone-300" />
            </div>

            <div className="relative flex w-32 shrink-0 flex-col items-center justify-between bg-white p-4 text-center">
              <div className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-white md:block" />
              <div className="absolute -left-3 -bottom-3 hidden h-6 w-6 rounded-full bg-white md:block" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Min. Spend
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  {formatCurrency(promotion.minimumOrderAmount)}
                </p>
              </div>

              <div className="mt-3 flex w-full flex-col items-center">
                <img
                  src="/images/harrison_logo.png"
                  alt="Harrison"
                  className="h-8 w-8 object-contain"
                />
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-stone-300">
                  All orders
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
