// ─── Sub-components ───────────────────────────────────────────────────────────

import { DynamicIcon } from "@/components/ui/DynamicIcon";

export const ProductSectionCard = ({
  title,
  iconName,
  children,
  className = "",
}: {
  title: string;
  iconName: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}
  >
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/70">
      <span className="text-brand-color-500">
        <DynamicIcon name={iconName} size={15} />
      </span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);
