"use client";

import React, { useState } from "react";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { ShoppingBag } from "lucide-react";
import ProductDetailModal from "./ProductDetailsModal";
import { toast } from "sonner";
import { ITEM_TYPES } from "@/types/products";
import { getStoreStatus } from "@/lib/storeStatus";
import { useSettings } from "@/hooks/api/useSettings";
import { OrderItemImage } from "../../components/OrderItemImage";
import { formatCurrency } from "@/helper/formatCurrency";

interface ProductCardProps {
  item: BranchProduct;
  hasBranch?: boolean;
  selectedBranch?: string;
}
// ── Helpers (pure, no need to live inside component) ──────────────────────────
const getStockLabel = (status: string, quantity: number | null): string => {
  if (status === STOCK_STATUSES.OUT_OF_STOCK) return "Out of stock";
  if (status === STOCK_STATUSES.LOW_STOCK) return `Only ${quantity} left!`;
  return `${quantity} available`;
};

const getProductDiscountLabel = (
  discount: BranchProduct["activeProductDiscount"],
): string | null => {
  if (!discount || discount.discountAmount <= 0) return null;

  if (discount.discountType === "percentage") {
    return `${discount.discountValue}% OFF`;
  }

  return `${formatCurrency(discount.discountAmount)} OFF`;
};

const getIncludedItemsText = (
  includedItems: BranchProduct["includedItems"],
): string[] =>
  (includedItems ?? []).map((i) => {
    const name =
      i.label ||
      (typeof i.product === "string" ? "" : i.product?.name) ||
      i.snapshotName ||
      "Unavailable item";
    return i.quantity > 1 ? `${i.quantity}x ${name}` : name;
  });

const StoreClosedOverlay = ({ message }: { message: string }) => {
  // Split message into headline + detail (simple heuristic)
  const [headline, ...rest] = message.split(". ");
  const detail = rest.join(". ");

  return (
    <>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white/95 rounded-xl shadow-lg px-4 py-3 max-w-[90%]">
          {/* Headline */}
          <p className="text-sm font-bold text-red-600">{headline}</p>

          {/* Optional detail */}
          {detail && (
            <p className="text-[11px] text-gray-600 mt-1 leading-tight">
              {detail}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  hasBranch,
  selectedBranch,
}) => {
  const { data: operatingSched } = useSettings();
  const [showDetail, setShowDetail] = useState(false);

  const storeStatus = operatingSched
    ? getStoreStatus(operatingSched.operatingHours)
    : null;

  // ── Derived state (declared early, used throughout) ───────────────────────
  // Stock info is only meaningful when a branch is selected
  const quantity = hasBranch ? (item.quantity ?? 0) : null;
  const status = hasBranch ? (item.status ?? "") : "";
  const isOutOfStock =
    hasBranch &&
    (status === STOCK_STATUSES.OUT_OF_STOCK || (quantity ?? 1) <= 0);
  const isLowStock = hasBranch && status === STOCK_STATUSES.LOW_STOCK;
  const isCombo = item.productType === ITEM_TYPES.COMBO;
  const isSet = item.productType === ITEM_TYPES.SET;
  const isNonSolo =
    item.productType !== ITEM_TYPES.SOLO && item.productType != null;
  const includedItemsText = getIncludedItemsText(item.includedItems);
  const hasIncludedItems = isNonSolo && includedItemsText.length > 0;
  const activeProductDiscount = item.activeProductDiscount;
  const hasProductDiscount =
    Boolean(activeProductDiscount) && activeProductDiscount!.discountAmount > 0;
  const displayPrice = hasProductDiscount
    ? activeProductDiscount!.discountedPrice
    : item.price;
  const productDiscountLabel = getProductDiscountLabel(activeProductDiscount);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <div
        className={`group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-color-500 hover:shadow-md ${
          isOutOfStock ? "opacity-70" : ""
        }`}
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-white relative flex items-center justify-center">
          <OrderItemImage image={item.image.url} name={item.name} />

          {storeStatus && !storeStatus.isOpen && (
            <StoreClosedOverlay message={storeStatus.message} />
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/10 z-10" />
          )}

          <div className="absolute left-3 top-3 z-20 flex max-w-[70%] flex-col items-start gap-1.5">
            {isOutOfStock ? (
              <div className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                {getStockLabel(status, quantity)}
              </div>
            ) : isLowStock ? (
              <div className="rounded-full bg-yellow-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                {getStockLabel(status, quantity)}
              </div>
            ) : item.isPopular ? (
              <div className="rounded-full bg-brand-color-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                Best Seller
              </div>
            ) : null}
          </div>

          {hasProductDiscount && productDiscountLabel && (
            <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-1">
              <span className="rounded-full bg-green-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                {productDiscountLabel}
              </span>
            </div>
          )}

          {/* Combo / Set badge */}
          {isNonSolo && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                  isCombo
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {isCombo
                  ? "COMBO"
                  : `SET${item.paxCount ? ` - ${item.paxCount}pax` : ""}`}
              </span>
            </div>
          )}
        </div>

        {/** Content */}
        <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-gray-900 md:text-base">
            {item.name}
          </h3>
          {hasIncludedItems && (
            <div className="flex flex-wrap gap-1 mt-1">
              {includedItemsText.map((text, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600"
                >
                  {text}
                </span>
              ))}
            </div>
          )}

          {isSet && item.paxCount && (
            <p className="text-[11px] font-semibold text-emerald-600">
              Good for {item.paxCount} pax
            </p>
          )}
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <div className="min-w-0">
              <span className="block text-base font-bold leading-none text-gray-950 md:text-lg">
                {formatCurrency(displayPrice)}
              </span>

              {hasProductDiscount &&
                item.price != null &&
                activeProductDiscount && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] text-gray-400 line-through">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-[11px] font-semibold text-green-600">
                      Save{" "}
                      {formatCurrency(activeProductDiscount.discountAmount)}
                    </span>
                  </div>
                )}
            </div>
            <span className="hidden">PHP {item.price?.toFixed(2) ?? "--"}</span>
            <button
              type="button"
              onClick={() => {
                !selectedBranch
                  ? toast.warning("Please select a branch first")
                  : setShowDetail(true);
              }}
              disabled={isOutOfStock || !storeStatus?.isOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-color-500 text-white transition-colors hover:bg-brand-color-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              aria-label={`Add ${item.name} to cart`}
            >
              <ShoppingBag size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {showDetail && (
        <ProductDetailModal
          item={item}
          selectedBranch={selectedBranch}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
};

export default ProductCard;
