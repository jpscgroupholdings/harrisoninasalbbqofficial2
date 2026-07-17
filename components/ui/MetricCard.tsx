import React from "react";
import { DynamicIcon } from "./DynamicIcon";

export interface MetricCardProps {
  title: string;
  value?: string | number;
  icon?: string;
  iconColor?: string;
  /** Top-right badge, purely informational — not necessarily a trend (e.g. "5 sold", "12 reviews") */
  badge?: string;
  /** Optional badge tone; defaults to neutral so it's not always "good news" green */
  badgeTone?: "positive" | "negative" | "neutral";
  /** Optional content rendered under the value — ratings, secondary text, etc. */
  subtitle?: React.ReactNode;
}

const toneClasses = {
  positive: "text-emerald-600 bg-emerald-50",
  negative: "text-red-600 bg-red-50",
  neutral: "text-stone-600 bg-stone-100",
};

/**
 * Dashboard-style metric card: colored icon box, title, large
 * value, and optional change badge. Has hover shadow + icon
 * scale transitions. Use for KPI/metric displays where an icon
 * visual is needed — not for simpler stat cards (use StatCard).
 */
const MetricCard = ({
  title,
  value,
  icon,
  iconColor,
  badge,
  badgeTone = "neutral",
  subtitle,
}: MetricCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 group">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        {icon && (
          <div
            className={`w-10 h-10 md:w-12 md:h-12 rounded ${iconColor} text-white flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <DynamicIcon name={icon} />
          </div>
        )}

        {badge && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${toneClasses[badgeTone]}`}
          >
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-stone-500 text-xs md:text-sm font-medium mb-1 md:mb-2">{title}</h3>
      <p className="text-xl md:text-2xl xl:text-3xl font-semibold text-stone-800 break-words">{value}</p>
      {subtitle && <div className="mt-2">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
