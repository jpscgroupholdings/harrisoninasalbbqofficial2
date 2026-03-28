"use client";

import React, { useState } from "react";
import { X, Star, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { BranchProduct } from "@/hooks/api/useBranchProduct";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import ProductCard from "./ProductCard";
import { syne } from "@/app/font";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddonItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CommonlyBoughtItem {
  _id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface ProductDetailModalProps {
  item: BranchProduct;
  selectedBranch?: string;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const QuantityStepper = ({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}) => (
  <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <Minus size={12} />
    </button>
    <span className="text-sm font-medium min-w-5 text-center text-gray-800">
      {value}
    </span>
    <button
      onClick={() => onChange(value + 1)}
      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <Plus size={12} />
    </button>
  </div>
);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_COMPLIMENTS: AddonItem[] = [
  { _id: "comp-1", name: "Steamed Rice", price: 50, quantity: 1 },
  { _id: "comp-2", name: "Atchara", price: 50, quantity: 1 },
  { _id: "comp-3", name: "Atchara", price: 50, quantity: 1 },
];

const MOCK_BEVERAGES: AddonItem[] = [
  { _id: "bev-1", name: "Coke 250ml", price: 40, quantity: 0 },
  { _id: "bev-2", name: "Iced Tea", price: 35, quantity: 0 },
];

const MOCK_COMMONLY_BOUGHT: CommonlyBoughtItem[] = [
  { _id: "cb-1", name: "Liempo", price: 120, selected: false },
  { _id: "cb-2", name: "Bangus", price: 110, selected: false },
  { _id: "cb-3", name: "Sinigang", price: 95, selected: false },
  { _id: "cb-4", name: "Kare-kare", price: 130, selected: false },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  selectedBranch,
  onClose,
}) => {
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<"info" | "desc">("info");
  const [mainQty, setMainQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [compliments, setCompliments] = useState<AddonItem[]>(MOCK_COMPLIMENTS);
  const [beverages, setBeverages] = useState<AddonItem[]>(MOCK_BEVERAGES);
  const [commonlyBought, setCommonlyBought] =
    useState<CommonlyBoughtItem[]>(MOCK_COMMONLY_BOUGHT);

  // ── Computed ──────────────────────────────────────────────────────────────

  const basePrice = item.price ?? 0;

  const addonTotal = [
    ...compliments.map((c) => c.price * c.quantity),
    ...beverages.map((b) => b.price * b.quantity),
    ...commonlyBought.filter((c) => c.selected).map((c) => c.price),
  ].reduce((sum, val) => sum + val, 0);

  const total = basePrice * mainQty + addonTotal;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updateAddon = (
    list: AddonItem[],
    setList: React.Dispatch<React.SetStateAction<AddonItem[]>>,
    id: string,
    qty: number,
  ) => {
    setList(list.map((a) => (a._id === id ? { ...a, quantity: qty } : a)));
  };

  const toggleCommonlyBought = (id: string) => {
    setCommonlyBought((prev) =>
      prev.map((c) => (c._id === id ? { ...c, selected: !c.selected } : c)),
    );
  };

  const handleAddToCart = () => {
    if (!selectedBranch) {
      toast.warning("Please select a branch first");
      return;
    }

    addToCart({
      _id: item._id,
      name: item.name,
      price: basePrice,
      image: item.image.url,
      category: {
        _id: item.category._id,
        name: item.category.name,
      },
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1500);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      onClose={onClose}
      title="Product Details"
      subTitle="Recommended items to go with this product"
      contentClassName="p-0"
    >
      <div className={`${syne.className} flex flex-col overflow-auto max-h-[75vh]`}>
        <div className="flex overflow-hidden">
          {/* scrollable content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      {item.category?.name}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={
                              s <= 4
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        4.2 · 32 reviews
                      </span>
                    </div>
                  </div>
                </div>
                {/* Price */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-bold text-brand-color-500">
                    ₱{basePrice}
                  </span>
                </div>
              </div>

              {/* image */}
              <div className="w-52 min-w-52 hidden sm:flex items-start">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                  <Image
                    src={item.image.url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    quality={90}
                  />
                  {item.isPopular && (
                    <div className="absolute top-3 left-3 bg-brand-color-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      Best Seller
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Tabs */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit mb-3">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                      activeTab === "info"
                        ? "bg-brand-color-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Product Info
                  </button>
                  <button
                    onClick={() => setActiveTab("desc")}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === "desc"
                        ? "bg-brand-color-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Description
                  </button>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {activeTab === "info"
                    ? item.info || "No product info available."
                    : item.description || "No description available."}
                </p>
              </div>
              {/* Meal Compliments */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">
                    Meal Compliments
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Select up to 5
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {compliments.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-brand-color-500">
                          + ₱{c.price}
                        </span>
                        <QuantityStepper
                          value={c.quantity}
                          min={0}
                          onChange={(qty) =>
                            updateAddon(compliments, setCompliments, c._id, qty)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Commonly Bought With */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">
                    Commonly Bought With
                  </p>
                  <span className="text-[10px] text-gray-400">
                    What others add
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonlyBought.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => toggleCommonlyBought(c._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                        c.selected
                          ? "border-brand-color-500 bg-brand-color-500/10 text-brand-color-500"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {c.name}
                      <span
                        className={
                          c.selected ? "text-brand-color-500" : "text-gray-400"
                        }
                      >
                        +₱{c.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Beverages */}
              <div className="px-5 py-4">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">
                    Add Beverages
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Select up to 3
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {beverages.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{b.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-brand-color-500">
                          + ₱{b.price}
                        </span>
                        <QuantityStepper
                          value={b.quantity}
                          onChange={(qty) =>
                            updateAddon(beverages, setBeverages, b._id, qty)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer — Add to cart */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white">
              <QuantityStepper value={mainQty} min={1} onChange={setMainQty} />
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAdded
                    ? "bg-green-500 text-white"
                    : "bg-brand-color-500 hover:bg-brand-color-600 text-white"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Add to cart · ₱{total}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
