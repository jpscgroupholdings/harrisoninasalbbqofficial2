import { StatCard } from "@/components/ui/StatCard";
import type { StatCardProps } from "@/components/ui/StatCard";
import { InventoryCounts } from "@/hooks/api/useBranchInventory";

interface Props {
  counts: InventoryCounts;
}

/**
 * Summary cards for branch inventory counts.
 * Each card shows a count with no prior-period comparison
 * since these are point-in-time snapshots.
 */
export default function InventorySummaryCards({ counts }: Props) {
  const cards: StatCardProps[] = [
    { label: "Total Items", value: counts.total },
    { label: "In Stock", value: counts.inStock },
    { label: "Low Stock", value: counts.lowStock },
    { label: "Out of Stock", value: counts.outOfStock },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
