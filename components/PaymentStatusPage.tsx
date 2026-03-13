"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleCheck, CircleOff, CircleX } from "lucide-react";

export type PaymentStatusType = "success" | "failed" | "cancel";

type PaymentStatusPageProps = {
  type: PaymentStatusType;
};

type StatusConfig = {
  icon: React.ReactNode;
  title: string;
  description: string;
  pageBg: string;
  cardShadow: string;
  titleColor: string;
  primaryButton: {
    label: string;
    href: string;
    className: string;
  };
  secondaryButton: {
    label: string;
    href: string;
    className: string;
  };
};

const statusConfig: Record<PaymentStatusType, StatusConfig> = {
  success: {
    icon: <CircleCheck size={96} className="text-emerald-500" />,
    title: "Payment Successful",
    description:
      "Your order has been confirmed and is being processed. You'll receive a confirmation email shortly.",
    pageBg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    cardShadow: "shadow-[0_8px_40px_rgba(16,185,129,0.15)]",
    titleColor: "text-emerald-900",
    primaryButton: {
      label: "View My Orders",
      href: "/orders",
      className:
        "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-px",
    },
    secondaryButton: {
      label: "Back to Shop",
      href: "/",
      className: "text-gray-400 hover:text-emerald-700",
    },
  },
  failed: {
    icon: <CircleX size={96} className="text-red-500" />,
    title: "Payment Failed",
    description:
      "Something went wrong while processing your payment. Please try again or use a different payment method.",
    pageBg: "bg-gradient-to-br from-red-50 via-white to-rose-50",
    cardShadow: "shadow-[0_8px_40px_rgba(239,68,68,0.12)]",
    titleColor: "text-red-900",
    primaryButton: {
      label: "Try Again",
      href: "/cart",
      className: "bg-red-500 text-white hover:bg-red-600 hover:-translate-y-px",
    },
    secondaryButton: {
      label: "Back to Shop",
      href: "/",
      className: "text-gray-400 hover:text-red-700",
    },
  },
  cancel: {
    icon: <CircleOff size={96} className="text-gray-400" />,
    title: "Payment Cancelled",
    description:
      "You cancelled the checkout. Your cart is still saved — continue whenever you're ready.",
    pageBg: "bg-gradient-to-br from-gray-50 via-white to-slate-50",
    cardShadow: "shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
    titleColor: "text-gray-900",
    primaryButton: {
      label: "Return to Cart",
      href: "/cart",
      className:
        "bg-gray-800 text-white hover:bg-gray-900 hover:-translate-y-px",
    },
    secondaryButton: {
      label: "Back to Shop",
      href: "/",
      className: "text-gray-400 hover:text-gray-700",
    },
  },
};

export default function PaymentStatusPage({ type }: PaymentStatusPageProps) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  const checkoutId = searchParams.get("id") || searchParams.get("checkoutId");
  const referenceNumber = searchParams.get("requestReferenceNumber");

  const config = statusConfig[type];

  if (!config) return null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-8 ${config.pageBg}`}
    >
      <div
        className={`w-full max-w-md rounded-3xl bg-white px-10 py-12 text-center transition-all duration-500 ${config.cardShadow} ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Icon */}
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          {config.icon}
        </div>

        {/* Title */}
        <h1
          className={`mb-2 text-2xl font-semibold tracking-tight ${config.titleColor}`}
        >
          {config.title}
        </h1>

        {/* Description */}
        <p className="mb-7 text-sm font-light leading-relaxed text-gray-500">
          {config.description}
        </p>

        {/* Details (only for success/failed) */}
        {(checkoutId || referenceNumber) && type !== "cancel" && (
          <div className="mb-7 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left">
            {checkoutId && (
              <div className="flex items-center justify-between gap-4 py-1">
                <span className="whitespace-nowrap text-xs text-gray-400">
                  Checkout ID
                </span>
                <span className="break-all text-right font-mono text-xs font-medium text-gray-700">
                  {checkoutId}
                </span>
              </div>
            )}
            {referenceNumber && (
              <div
                className={`flex items-center justify-between gap-4 py-1 ${
                  checkoutId ? "border-t border-gray-200" : ""
                }`}
              >
                <span className="whitespace-nowrap text-xs text-gray-400">
                  Reference No.
                </span>
                <span className="break-all text-right font-mono text-xs font-medium text-gray-700">
                  {referenceNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href={config.primaryButton.href}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${config.primaryButton.className}`}
          >
            {config.primaryButton.label}
          </Link>
          <Link
            href={config.secondaryButton.href}
            className={`rounded-xl px-6 py-3 text-sm transition-all duration-200 ${config.secondaryButton.className}`}
          >
            {config.secondaryButton.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
