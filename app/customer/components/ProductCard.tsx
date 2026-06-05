"use client";

import React, { useState } from "react";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import Image from "next/image";
import ProductDetailModal from "./ProductDetailsModal";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { ITEM_TYPES } from "@/types/products";
import { getStoreStatus } from "@/lib/storeStatus";
import { useSettings } from "@/hooks/api/useSettings";
import { OrderItemImage } from "./OrderItemImage";

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
  const { openModal } = useModalQuery();
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-brand-color-500 transition-shadow  ${
          isOutOfStock ? "opacity-70" : ""
        }`}
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-white relative flex items-center justify-center">
          <OrderItemImage image={item.image.url} name={item.name} />

          {/* */}
          {storeStatus && !storeStatus.isOpen && (
            <StoreClosedOverlay message={storeStatus.message} />
          )}

          {/* Stock badges */}
          {isOutOfStock ? (
            <>
              <div className="absolute inset-0 bg-black/10 z-10" />
              <div className="absolute left-3 top-3 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {getStockLabel(status, quantity)}
              </div>
            </>
          ) : isLowStock ? (
            <div className="absolute left-3 top-3 z-10 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              {getStockLabel(status, quantity)}
            </div>
          ) : null}
          {/* Best Seller badge */}
          {item.isPopular && (
            <div className="absolute left-3 top-3 z-10 bg-brand-color-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Best Seller
            </div>
          )}
          {/* Combo / Set badge */}
          {isNonSolo && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
                  isCombo
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {isCombo
                  ? "COMBO"
                  : `SET${item.paxCount ? ` · ${item.paxCount}pax` : ""}`}
              </span>
            </div>
          )}
        </div>

        {/** Content */}
        <div className="px-4 pt-3 pb-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 leading-snug text-sm md:text-base">
            {item.name}
          </h3>
          {hasIncludedItems && (
            <div className="flex flex-wrap gap-1 mt-1">
              {includedItemsText.map((text, index) => (
                <span
                  key={index}
                  className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
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
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="font-semibold text-gray-900 text-xs md:text-sm">
              ₱{item.price?.toFixed(2) ?? "—"}
            </span>
            <button
              onClick={() => {
                !selectedBranch
                  ? openModal(MODAL_TYPES.MAP)
                  : setShowDetail(true);
              }}
              disabled={isOutOfStock || !storeStatus?.isOpen}
              className="w-8 h-8 rounded-full bg-brand-color-500 hover:bg-brand-color-600 flex items-center justify-center text-white transition-colors shrink-0"
              aria-label={`Add ${item.name} to cart`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 5v14M5 12h14"
                />
              </svg>
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
