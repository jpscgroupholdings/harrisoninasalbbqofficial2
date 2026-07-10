// ─── Tax Breakdown UI ─────────────────────────────────────────────────────────

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { computeTax } from "../helper/computeTax";
import { formatCurrency } from "@/helper/formatCurrency";

export const TaxBreakdown = ({ price }: { price: string }) => {
  const { taxable, tax, total } = computeTax(price);
  const hasValue = total > 0;

  return (
    <>
      <div
        className={`rounded-xl border transition-all duration-300 overflow-hidden ${
          hasValue
            ? "border-brand-color-500/20 bg-brand-color-500/5"
            : "border-gray-100 bg-gray-50/60"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-2.5 border-b text-xs font-bold uppercase tracking-widest ${
            hasValue
              ? "border-brand-color-500/10 text-brand-color-500"
              : "border-gray-100 text-gray-400"
          }`}
        >
          <DynamicIcon name="Wallet" size={13} />
          VAT Breakdown (12%)
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Taxable Amount</span>
            <span
              className={`text-sm font-bold  ${hasValue ? "text-gray-700" : "text-gray-300"}`}
            >
              {hasValue ? formatCurrency(taxable) : "₱ 0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">VAT (12%)</span>
            <span
              className={`text-sm font-bold ${hasValue ? "text-brand-color-500" : "text-gray-300"}`}
            >
              {hasValue ? formatCurrency(tax) : "₱ 0.00"}
            </span>
          </div>
          <div
            className={`h-px my-1 ${hasValue ? "bg-brand-color-500/15" : "bg-gray-100"}`}
          />
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-600">Total Price</span>
            <span
              className={`font-black ${hasValue ? "text-gray-800" : "text-gray-300"}`}
            >
              {hasValue ? formatCurrency(total) : "₱ 0.00"}
            </span>
          </div>
        </div>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] text-gray-400 leading-relaxed">
        <DynamicIcon name="Info" size={11} className="mt-0.5 shrink-0" />
        Selling price is VAT-inclusive. Tax is back-computed at 12%.
      </p>
    </>
  );
};
