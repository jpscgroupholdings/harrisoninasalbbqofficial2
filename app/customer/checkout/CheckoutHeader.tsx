import { DynamicIcon } from "@/lib/DynamicIcon";
import Link from "next/link";

export const CheckoutHeader = ({ step }: { step: string }) => (
  <header className="z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <Link
        href={step === "shipping" ? "?step=customer" : "/"}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <DynamicIcon name="ArrowLeft" size={15} />
        <span>{step === "shipping" ? "Back to details" : "Back to menu"}</span>
      </Link>
      <p className="text-xl font-semibold tracking-tight text-slate-900">
        Checkout
      </p>
      {/* Spacer to center the title */}
      <div className="w-24" />
    </div>
  </header>
);
