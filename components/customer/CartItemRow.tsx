"use client";

import React, { useState } from "react";
import { getCartKey } from "@/contexts/CartContext";
import { AppImage } from "@/components/AppImage";
import { IconButton } from "@/components/ui/buttons";
import { SummaryRow } from "@/components/ui/SummaryRow";
import { QuantityStepper } from "@/app/customer/menu/components/QuantityStepper";
import { formatCurrency } from "@/helper/formatter";
import {
  addMoney,
  clampMoneyMin,
  minMoney,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from "@/lib/money";
import type { CartItem } from "@/types/MenuTypes";

interface CartItemRowProps {
  item: CartItem;
  onRemove: (cartKey: string) => void;
  onUpdate: (cartKey: string, qty: number) => void;
  /** When provided, shows an edit (pencil) button for combo/set items */
  onEdit?: (item: CartItem, cartKey: string) => void;
}

/**
 * Renders a single cart item with full detail for combo/set products:
 * modifier breakdown, price decomposition, discount labels, quantity stepper,
 * and line total. Used in both the CartDrawer and the checkout CartList.
 */
const CartItemRow = ({ item, onRemove, onUpdate, onEdit }: CartItemRowProps) => {
  const cartKey = getCartKey(item);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const hasModifiers = (item.modifierSelections?.length ?? 0) > 0;

  // Compute upgrade total from modifier selections (per-unit, before ×quantity)
  const upgradeTotal = hasModifiers
    ? roundMoney(
        item.modifierSelections!.reduce(
          (sum, group) =>
            addMoney(
              sum,
              group.items.reduce(
                (gSum, modItem) =>
                  addMoney(gSum, multiplyMoney(modItem.upgradePrice, modItem.quantity)),
                0,
              ),
            ),
          0,
        ),
      )
    : 0;

  // For combo/set: basePrice = total unit price minus upgrade total
  const basePrice = hasModifiers ? subtractMoney(item.price, upgradeTotal) : item.price;

  // Line total (unit price × quantity)
  const lineTotal = multiplyMoney(item.price, item.quantity);

  // Discount handling
  const unitDiscount = item.activeProductDiscount?.discountAmount ?? 0;
  const lineDiscount = minMoney(multiplyMoney(unitDiscount, item.quantity), lineTotal);
  const discountedLineTotal = clampMoneyMin(subtractMoney(lineTotal, lineDiscount));
  const hasProductDiscount = lineDiscount > 0;

  const canToggleDetails = hasModifiers || hasProductDiscount;

  return (
    <div className="py-3 first:pt-0">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <AppImage
            src={item.image}
            alt={item.name || "Product_Image"}
            loading="lazy"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Header: name + actions */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                {item.name}
              </p>
              {item.category?.name && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {item.category.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {hasModifiers && onEdit && (
                <IconButton
                  icon={{ name: "Pencil", className: "text-green-500 hover:text-green-600" }}
                  title="Edit selections"
                  onClick={() => onEdit(item, cartKey)}
                  variant="ghost"
                  className="hover:bg-green-100 rounded-none cursor-pointer p-1.5"
                />
              )}
              <IconButton
                onClick={() => onRemove(cartKey)}
                icon={{ name: "Trash2", size: 13 }}
                title="Remove item"
                variant="ghost"
                className="hover:bg-red-100 text-red-500 rounded-none cursor-pointer p-1.5"
              />
            </div>
          </div>

          {/* Show/Hide details toggle */}
          {canToggleDetails && (
            <IconButton
              type="button"
              onClick={() => setShowBreakdown((prev) => !prev)}
              variant="underline"
              text={showBreakdown ? "Hide details" : "Show details"}
              className="px-0 text-xs text-gray-600"
            />
          )}

          {/* Modifier selections by group */}
          {hasModifiers && showBreakdown && (
            <div className="mt-2 space-y-1.5">
              {item.modifierSelections!.map((group) => (
                <div key={group.groupId}>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">
                    {group.groupName}
                  </p>
                  {group.items.map((modItem) => (
                    <div
                      key={modItem.productId}
                      className="flex justify-between text-xs ml-2"
                    >
                      <span className="text-gray-500">
                        {modItem.label ?? modItem.name}
                        {modItem.quantity > 1 && ` (×${modItem.quantity})`}
                      </span>
                      <span className="text-gray-400">
                        {modItem.upgradePrice > 0
                          ? `+${formatCurrency(multiplyMoney(modItem.upgradePrice, modItem.quantity))}`
                          : "₱0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Discount label */}
          {item.activeProductDiscount && (
            <p className="mt-1 text-[11px] font-semibold text-green-600">
              {item.activeProductDiscount.label}
            </p>
          )}
        </div>
      </div>

      {/* Price breakdown panel (visible when details are expanded) */}
      {canToggleDetails && showBreakdown && (
        <div className="my-2 space-y-0.5 bg-brand-color-50 rounded-lg p-2 ml-19">
          {hasModifiers ? (
            <div className="space-y-2">
              <SummaryRow
                title="Base price"
                subTitle={formatCurrency(basePrice)}
                className={{ parent: "text-xs" }}
              />
              <SummaryRow
                title="Upgrades"
                subTitle={`+${formatCurrency(upgradeTotal)}`}
                className={{ parent: "text-xs" }}
              />
              <div className="border-t border-gray-200 pt-1 mt-1">
                <SummaryRow
                  title="Unit price"
                  subTitle={formatCurrency(item.price)}
                />
              </div>
            </div>
          ) : hasProductDiscount ? (
            <>
              <SummaryRow
                title="Unit price"
                subTitle={formatCurrency(item.price)}
                className={{ subTitle: "line-through" }}
              />
              <SummaryRow
                title="Discounted"
                subTitle={formatCurrency(item.activeProductDiscount!.discountedPrice)}
                className={{ parent: "text-green-600" }}
              />
            </>
          ) : (
            <SummaryRow
              title="Unit price"
              subTitle={formatCurrency(item.price)}
            />
          )}
        </div>
      )}

      {/* Quantity stepper + line total */}
      <div className="flex items-center justify-between mt-2 ml-19">
        <QuantityStepper
          value={item.quantity}
          min={1}
          onChange={(value) => onUpdate(cartKey, value)}
          className="max-w-30"
        />

        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-brand-color-500">
            {formatCurrency(hasProductDiscount ? discountedLineTotal : lineTotal)}
          </span>
          {hasProductDiscount && (
            <span className="text-[11px] text-slate-400 line-through">
              {formatCurrency(lineTotal)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;
