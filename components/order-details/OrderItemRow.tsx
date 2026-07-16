import {
  addMoney,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from "@/lib/money";
import { OrderItem } from "@/types/OrderTypes";
import { AppImage } from "../AppImage";
import { formatCurrency } from "@/helper/formatCurrency";

/** Order item row with image, quantity badge, modifiers, and price breakdown */
export const OrderItemRow = ({ item }: { item: OrderItem }) => {
  const modifiers = item.modifierSelections ?? [];
  const hasModifiers = modifiers.length > 0;

  // Compute upgrade total and base price for combo/set items (mirrors CartDrawer logic)
  const upgradeTotal = hasModifiers
    ? roundMoney(
        modifiers.reduce(
          (sum, group) =>
            addMoney(
              sum,
              group.items.reduce(
                (gSum, modItem) =>
                  addMoney(
                    gSum,
                    multiplyMoney(modItem.upgradePrice, modItem.quantity),
                  ),
                0,
              ),
            ),
          0,
        ),
      )
    : 0;
  const basePrice = hasModifiers
    ? subtractMoney(item.price, upgradeTotal)
    : item.price;

  return (
    <div className="flex gap-3 py-1">
      {item.image && (
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-100">
          <AppImage src={item.image} alt={item.name} loading="lazy" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="uppercase font-semibold text-gray-800 truncate">
            {item.name}
          </p>
          <div className="flex items-center gap-2 shrink-0 mr-2">
            {item.quantity > 1 && (
              <div className="flex flex-col items-center">
                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold rounded-md px-1.5 py-0.5 min-w-6">
                  ×{item.quantity}
                </span>
                {hasModifiers && (
                  <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                    {item.quantity} sets ordered
                  </span>
                )}
              </div>
            )}
            <div className="text-right">
              <p className="font-bold text-gray-800">
                {formatCurrency(multiplyMoney(item.price, item.quantity))}
              </p>
              {item.quantity > 1 && (
                <p className="text-[11px] text-gray-400">
                  {formatCurrency(item.price)} each
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-60 text-wrap">
          <p className="text-xs font-thin italic text-gray-500">
            {item.description ?? "No description"}
          </p>
        </div>

        {/* Combo/set: modifier selections + price breakdown */}
        {hasModifiers && (
          <div className="mt-2">
            <div className="space-y-1.5 border-l-2 border-orange-200 pl-3">
              {modifiers.map((group, gi) => (
                <div key={gi}>
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    {group.groupName}
                  </p>
                  {group.items.map((modItem, mi) => (
                    <div key={mi} className="flex justify-between text-xs ml-1">
                      <span className="text-gray-500">
                        {modItem.label ?? modItem.name}
                        <span className="text-gray-400">
                          {" "}
                          (×{modItem.quantity})
                        </span>
                      </span>
                      <span className="text-gray-400 shrink-0 ml-2">
                        {modItem.upgradePrice > 0
                          ? `+${formatCurrency(multiplyMoney(modItem.upgradePrice, modItem.quantity))}`
                          : "Included in price"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Price breakdown: base + upgrades = unit price */}
            <div className="mt-2 bg-gray-50 rounded-lg p-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Base price</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              {upgradeTotal > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Upgrades</span>
                  <span>+{formatCurrency(upgradeTotal)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-semibold text-gray-700">
                <span>Unit price</span>
                <span>{formatCurrency(item.price)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
