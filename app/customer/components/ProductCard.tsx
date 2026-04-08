"use client";

import React, { useState } from "react";
import { BranchProduct } from "@/hooks/api/useBranchProduct";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import Image from "next/image";
import ProductDetailModal from "./ProductDetailsModal";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { ITEM_TYPES } from "@/types/products";

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
      i.label ??
      (typeof i.product === "string" ? i.product : i.product?.name) ??
      "Item";
    return i.quantity > 1 ? `${i.quantity}x ${name}` : name;
  });

// ─────────────────────────────────────────────────────────────────────────────

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  hasBranch,
  selectedBranch,
}) => {
  const { openModal } = useModalQuery();
  const [showDetail, setShowDetail] = useState(false);

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
  const isNonSolo = item.productType !== ITEM_TYPES.SOLO && item.productType != null;
  const includedItemsText = getIncludedItemsText(item.includedItems);
  const hasIncludedItems = isNonSolo && includedItemsText.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div
        className={`group h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${
          isOutOfStock ? "opacity-70" : ""
        }`}
      >
        {/* Image */}
        <div className="relative overflow-hidden aspect-square">
          <Image
            src={item.image.url}
            alt={item.name}
            height={200}
            width={200}
            quality={92}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
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
        {/* Content */}
        <div className="flex flex-col p-4">
          <div className="mb-2 space-y-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
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
          </div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-brand-color-500 font-bold text-xl">
              {item.price != null ? `₱${item.price}` : "—"}
            </span>
            <button
              onClick={() => {
                !selectedBranch
                  ? openModal(MODAL_TYPES.MAP)
                  : setShowDetail(true);
              }}
              disabled={isOutOfStock}
              className={`text-white p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                isOutOfStock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#1a1a1a] hover:bg-brand-color-500"
              }`}
            >
              {isOutOfStock ? (
                <AlertTriangle size={18} />
              ) : (
                <ShoppingBag size={18} />
              )}
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
