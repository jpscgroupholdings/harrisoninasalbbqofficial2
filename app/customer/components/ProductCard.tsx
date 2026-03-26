"use client";

import { useCart } from "@/contexts/CartContext";
import { Product } from "@/types/adminType";
import { Check, Plus, ShoppingBag, AlertTriangle } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface ProductCardProps {
  item: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
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
    setTimeout(() => setIsAdded(false), 500);
  };

  const getStockStatus = () => {
    if (item.stock <= 0) return { status: "out", label: "Out of Stock" };
    if (item.stock <= 5)
      return { status: "low", label: `Only ${item.stock} left!` };
    return { status: "available", label: `${item.stock} available` };
  };

  const stockStatus = getStockStatus();
  const subcategoryName = item.subcategory?.name ?? null;

  // Build included items display string
  const includedItems = item.includedItems ?? [];
  const hasIncludedItems =
    item.productType !== "solo" && includedItems.length > 0;

  const includedItemsText = includedItems.map((i) => {
    const name =
      i.label ??
      (typeof i.product === "object" ? i.product.name : null) ??
      "Item";
    return i.quantity > 1 ? `${i.quantity}x ${name}` : name;
  });

  return (
    <div
      className={`group h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${
        item.stock <= 0 ? "opacity-70" : ""
      }`}
    >
      {/** Image container */}
      <div className="relative overflow-hidden aspect-square">
        <Image
          src={item.image.url}
          alt={item.name}
          height={200}
          width={200}
          quality={92}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/** Stock Status Badges */}
        {item.stock <= 0 ? (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
              <AlertTriangle className="inline mr-1" size={16} />
              SOLD OUT
            </div>
          </div>
        ) : item.stock <= 5 ? (
          <div className="absolute left-3 top-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
            {stockStatus.label}
          </div>
        ) : null}

        {/** Best Seller Badge */}
        {item.isPopular && item.stock > 0 && (
          <div className="absolute left-3 top-3 bg-brand-color-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
            Best Seller
          </div>
        )}

        {/** Combo / Set badge */}
        {item.productType !== "solo" && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
                item.productType === "combo"
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-500 text-white"
              }`}
            >
              {item.productType === "combo"
                ? "COMBO"
                : `SET${item.paxCount ? ` · ${item.paxCount}pax` : ""}`}
            </span>
          </div>
        )}

        {/** Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={handleAddToCart}
            disabled={isAdded || item.stock === 0}
            className={`${
              isAdded
                ? "bg-green-500 scale-110"
                : item.stock === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-brand-color-500 hover:bg-[#c13500]"
            } text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transform transition-all duration-300 hover:scale-105 shadow-lg`}
          >
            {isAdded ? (
              <>
                <Check size={18} />
                Added!
              </>
            ) : item.stock === 0 ? (
              "Out of Stock"
            ) : (
              <>
                <Plus size={18} />
                Add To Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/** Content */}
      <div className="flex flex-col p-4">
        <div className="mb-2 space-y-1">
          {/* Name */}
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {item.name}
          </h3>

          {/* Included items — combo / set only */}
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

          {/* Pax count for sets */}
          {item.productType === "set" && item.paxCount && (
            <p className="text-[11px] font-semibold text-emerald-600">
              Good for {item.paxCount} pax
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-brand-color-500 font-bold text-xl">
            {item.price !== null ? `₱${item.price}` : "—"}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isAdded || item.stock === 0}
            className={`${
              isAdded
                ? "bg-green-500"
                : item.stock === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#1a1a1a] hover:bg-brand-color-500"
            } text-white p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg`}
          >
            {isAdded ? (
              <Check size={18} />
            ) : item.stock === 0 ? (
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
