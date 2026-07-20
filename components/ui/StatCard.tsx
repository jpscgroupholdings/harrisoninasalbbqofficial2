// components/ui/StatCard.tsx
import { formatCurrency } from "@/helper/formatter";
import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value?: string | number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  percentChange?: number;
  /** Explicit false when there's no valid previous period to compare (avoids showing 0%/NaN%) */
  hasPreviousData?: boolean;
  /** Override text for the change line, e.g. "5 sold this week" instead of a %. */
  changeText?: string;
  /** Custom content rendered below the value (e.g. rating distribution bars) */
  children?: ReactNode;
}

function ChangeLine({
  percentChange,
  hasPreviousData,
  changeText,
}: Pick<StatCardProps, "percentChange" | "hasPreviousData" | "changeText">) {
  if (hasPreviousData === false) {
    return <p className="text-sm text-stone-400 font-medium mt-2">No prior period to compare</p>;
  }

  if (percentChange === undefined && !changeText) return null;

  if (percentChange === 0 && !changeText) {
    return <p className="text-sm text-stone-400 font-semibold mt-2">No change from previous period</p>;
  }

  const isPositive = (percentChange ?? 0) > 0;
  const color =
    percentChange === undefined
      ? "text-stone-500"
      : isPositive
        ? "text-emerald-600"
        : "text-amber-600";
  const sign = percentChange !== undefined && isPositive ? "+" : "";
  const text = changeText ?? `${sign}${percentChange}% from previous period`;

  return <p className={`text-sm ${color} font-semibold mt-2`}>{text}</p>;
}

export function StatCard({
  label,
  value,
  isCurrency,
  isPercentage,
  percentChange,
  hasPreviousData,
  changeText,
  children,
}: StatCardProps) {
  const displayValue =
    value === undefined
      ? null
      : isCurrency
        ? formatCurrency(Number(value))
        : isPercentage
          ? `${value}%`
          : typeof value === "number"
            ? value.toLocaleString()
            : value;

  return (
    <div className="bg-white rounded-xl p-6 border border-stone-100">
      <p className="text-sm text-stone-500 mb-2">{label}</p>
      {displayValue !== null && (
        <p className="text-2xl font-bold text-stone-800">{displayValue}</p>
      )}
      {children}
      <ChangeLine
        percentChange={percentChange}
        hasPreviousData={hasPreviousData}
        changeText={changeText}
      />
    </div>
  );
}