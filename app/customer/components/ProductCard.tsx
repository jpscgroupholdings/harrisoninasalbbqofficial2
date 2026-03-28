"use client";

import { useCart } from "@/contexts/CartContext";
import { BranchProduct } from "@/hooks/api/useBranchProduct";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { Check, ShoppingBag, AlertTriangle } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  item: BranchProduct;
  selectedBranch?: string;
}

// ── Helpers (pure, no need to live inside component) ──────────────────────────

const getStockLabel = (status: string, quantity: number): string => {
  if (status === STOCK_STATUSES.OUT_OF_STOCK) return "Out of stock";
  if (status === STOCK_STATUSES.LOW_STOCK) return `Only ${quantity} left!`;
  return `${quantity} available`;
};

const getIncludedItemsText = (
  includedItems: BranchProduct["includedItems"],
): string[] =>
  (includedItems ?? []).map((i) => {
    const name = i.label ?? (typeof i.product === "string" ? i.product : i.product?.name) ?? "Item";
    return i.quantity > 1 ? `${i.quantity}x ${name}` : name;
  });

// ─────────────────────────────────────────────────────────────────────────────

const ProductCard: React.FC<ProductCardProps> = ({ item, selectedBranch }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // ── Derived state (declared early, used throughout) ───────────────────────
  const quantity = item.quantity ?? 0;
  const status = item.status ?? "";
  const isOutOfStock = status === STOCK_STATUSES.OUT_OF_STOCK || quantity <= 0;
  const isLowStock = status === STOCK_STATUSES.LOW_STOCK;
  const isCombo = item.productType === "combo";
  const isSet = item.productType === "set";
  const isNonSolo = item.productType !== "solo";
  const includedItemsText = getIncludedItemsText(item.includedItems);
  const hasIncludedItems = isNonSolo && includedItemsText.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!selectedBranch) {
      toast.warning("Please select a branch first");
      return;
    }
    if (isOutOfStock) {
      toast.warning("This item is out of stock");
      return;
    }

    addToCart({
      _id: item._id,
      name: item.name,
      price: item.price ?? 0,
      image: item.image.url,
      category: {
        _id: item.category._id,
        name: item.category.name,
      },
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
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
                isCombo ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              {isCombo ? "COMBO" : `SET${item.paxCount ? ` · ${item.paxCount}pax` : ""}`}
            </span>
          </div>
        )}

        {/* Added confirmation overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${
            isAdded ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg">
            <Check size={18} />
            Added!
          </p>
        </div>
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
            onClick={handleAddToCart}
            disabled={isAdded || isOutOfStock}
            className={`text-white p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
              isAdded
                ? "bg-green-500"
                : isOutOfStock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#1a1a1a] hover:bg-brand-color-500"
            }`}
          >
            {isAdded ? (
              <Check size={18} />
            ) : isOutOfStock ? (
              <AlertTriangle size={18} />
            ) : (
              <ShoppingBag size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;