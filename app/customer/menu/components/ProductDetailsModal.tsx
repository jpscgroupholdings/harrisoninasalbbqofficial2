"use client";

import React, { useState } from "react";
import { Star, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { multiplyMoney } from "@/lib/money";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { syne } from "@/app/font";
import { OrderItemImage } from "../../components/OrderItemImage";
import StarRatingDisplay from "@/components/ui/StarRating";

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
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
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
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty while typing
    if (raw === "") {
      onChange(min);
      return;
    }

    const parsed = Number(raw);

    if (isNaN(parsed)) return;

    onChange(Math.max(min, parsed));
  };

  return (
    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden h-full">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Minus size={12} />
      </button>

      <input
        type="number"
        value={value}
        min={min}
        onChange={handleInputChange}
        className="w-10 text-center outline-none"
      />

      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  reviews,
  selectedBranch,
  onClose,
}) => {
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<"info" | "desc">("info");

  // Fire ViewContent when the product detail modal opens
  React.useEffect(() => {
    trackViewContent({
      content_ids: [item._id],
      content_type: "product",
      content_name: item.name,
      content_category: item.category?.name ?? "Menu Item",
      currency: "PHP",
      value: item.price ?? 0,
    });
  }, [item.name, item.category?.name, item.price]);
  const [mainQty, setMainQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // ── Computed ──────────────────────────────────────────────────────────────

  const basePrice = item.price ?? 0;
  const activeProductDiscount = item.activeProductDiscount;
  const hasProductDiscount =
    Boolean(activeProductDiscount) && activeProductDiscount!.discountAmount > 0;
  const displayUnitPrice = hasProductDiscount
    ? activeProductDiscount!.discountedPrice
    : basePrice;
  const total = multiplyMoney(displayUnitPrice, mainQty);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updateAddon = (
    list: AddonItem[],
    setList: React.Dispatch<React.SetStateAction<AddonItem[]>>,
    id: string,
    qty: number,
  ) => {
    setList(list.map((a) => (a._id === id ? { ...a, quantity: qty } : a)));
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
      activeProductDiscount,
      category: {
        _id: item.category._id,
        name: item.category.name,
      },
      quantity: mainQty,
    });

    // Track AddToCart pixel event with the effective unit price
    trackAddToCart({
      content_ids: [item._id],
      content_type: "product",
      content_name: item.name,
      content_category: item.category?.name ?? "Menu Item",
      currency: "PHP",
      value: displayUnitPrice,
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
      <div
        className={`${syne.className} flex flex-col overflow-auto max-h-[75vh]`}
      >
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
                       <StarRatingDisplay rating={reviews.averageRating}/>
                      </div>
                      <span className="text-xs text-gray-400">
                        {Number(reviews.averageRating).toFixed(1)} · {Number(reviews.totalReviews)} reviews
                      </span>
                    </div>
                  </div>
                </div>
                {/* Price */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-bold text-brand-color-500">
                    PHP {displayUnitPrice.toFixed(2)}
                  </span>
                  {hasProductDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        PHP {basePrice.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        {activeProductDiscount!.label}
                      </span>
                    </>
                  )}
                  <span className="hidden">₱{basePrice}</span>
                </div>
              </div>

              {/* image */}
              <div className="w-52 min-w-52 hidden sm:flex items-start">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                  <div className="h-full">
                    <OrderItemImage image={item.image.url} name={item.name} />
                  </div>
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
            </div>
            {/* Footer — Add to cart */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white">
              <QuantityStepper value={mainQty} min={1} onChange={setMainQty} />
              <button
                onClick={() =>
                  !selectedBranch
                    ? toast.warning("Please select a branch first")
                    : handleAddToCart()
                }
                disabled={isAdded}
                className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
