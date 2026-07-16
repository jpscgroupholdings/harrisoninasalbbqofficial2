import { cn } from "@/lib/utils";

const paymentStatusBadge = {
  paid: {
    wrapper: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
    label: "Paid",
  },
  awaitingPayment: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    label: "Awaiting payment",
  },
  unpaid: {
    wrapper: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    label: "Unpaid",
  },
} as const;

// ─── Reusable Sub-components ──────────────────────────────────────────────────

export const PaymentStatusPill = ({
  variant,
}: {
  variant: keyof typeof paymentStatusBadge;
}) => {
  const s = paymentStatusBadge[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        s.wrapper,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};
