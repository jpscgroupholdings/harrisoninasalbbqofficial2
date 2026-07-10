import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { formatCurrency } from "@/helper/formatCurrency";
import { ModifierGroupUI } from "@/types/products";

interface ComboPricePreviewProps {
  price: string;
  modifierGroups: ModifierGroupUI[];
}

const ComboPricePreview = ({ price, modifierGroups }: ComboPricePreviewProps) => {
  return (
    <div className="px-4 py-3 bg-brand-color-500/5 border border-brand-color-500/20 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-color-500">
        <DynamicIcon name="Calculator" size={13} />
        Price Preview
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Base combo price</span>
        <span className="font-bold text-gray-800">
          {formatCurrency(parseFloat(price))}
        </span>
      </div>
      {modifierGroups.map((group, gi) => (
        <div key={gi} className="space-y-1">
          <span className="text-xs font-semibold text-gray-500">
            {group.name || `Group ${gi + 1}`}
          </span>
          {group.items.map((item, ii) => {
            const upgradePrice = item.price ?? item._price ?? 0;
            const soloPrice = item._price ?? 0;
            const isDiscounted = upgradePrice < soloPrice && soloPrice > 0;
            return (
              <div
                key={ii}
                className="flex items-center justify-between text-xs pl-2"
              >
                <span className="text-gray-600 truncate">
                  {item._name || `Item ${ii + 1}`}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={
                      isDiscounted
                        ? "text-green-600 font-semibold"
                        : "text-gray-700"
                    }
                  >
                    +{formatCurrency(upgradePrice)}
                  </span>
                  {isDiscounted && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                      saves {formatCurrency(soloPrice - upgradePrice)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <div className="h-px bg-brand-color-500/15" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Customer total (if all items selected)
        </span>
        <span className="text-sm font-bold text-brand-color-500">
          {formatCurrency(
            parseFloat(price) +
              modifierGroups.reduce(
                (sum, g) =>
                  sum +
                  g.items.reduce((is, i) => is + (i.price ?? i._price ?? 0), 0),
                0,
              ),
          )}
        </span>
      </div>
    </div>
  );
};

export default ComboPricePreview;
