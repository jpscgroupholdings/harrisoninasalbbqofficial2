"use client";

import React, { useState } from "react";
import { multiplyMoney } from "@/lib/money";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { useCart } from "@/contexts/CartContext";
import Modal from "@/components/ui/Modal";
import StarRatingDisplay from "@/components/ui/StarRating";
import ProductRecommendations from "@/app/customer/components/ProductRecommendations";
import { IconButton } from "@/components/ui/buttons";
import { formatCurrency } from "@/helper/formatter";
import { QuantityStepper } from "./QuantityStepper";
import { AppImage } from "@/components/AppImage";
import { useBreakpoint } from "@/hooks/utils/useBreakPoint";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDetailModalProps {
  item: BranchProduct;
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
  selectedBranch?: string;
  onClose: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  reviews,
  selectedBranch,
  onClose,
}) => {
  const { addToCart } = useCart();
  const { isMobile } = useBreakpoint();

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

  const handleAddToCart = () => {
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
    <Modal onClose={onClose} title="Product Details" contentClassName="p-0">
      <div className={`flex flex-col overflow-auto max-h-[75vh]`}>
        <div className="flex overflow-hidden">
          {/* scrollable content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  {item.category?.name}
                </p>
                <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 mt-1">
                  <div className="flex">
                    <StarRatingDisplay rating={reviews.averageRating} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Number(reviews.averageRating).toFixed(1)} ·{" "}
                    {Number(reviews.totalReviews)} reviews
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-bold text-brand-color-500">
                    {formatCurrency(displayUnitPrice)}
                  </span>
                  {hasProductDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(basePrice)}
                      </span>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        {activeProductDiscount!.label}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* image */}
              <div className="w-24 md:w-52 sm:flex items-start">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                  <div className="h-full">
                    <AppImage src={item.image.url} alt={item.name} />
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
              {(item.info || item.description) && (
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit mb-3">
                    {item.info && (
                      <IconButton
                        onClick={() => setActiveTab("info")}
                        variant={activeTab === "info" ? "primary" : "secondary"}
                        text="Product Info"
                        className="px-4"
                      />
                    )}
                    {item.description && (
                      <IconButton
                        onClick={() => setActiveTab("desc")}
                        variant={activeTab === "desc" ? "primary" : "secondary"}
                        text="Description"
                        className="px-4"
                      />
                    )}
                  </div>
                  {(item.info || item.description) && (
                    <p className="text-sm text-gray-500 leading-relaxed ml-2">
                      {activeTab === "info"
                        ? item.info || "No product info available."
                        : item.description || "No description available."}
                    </p>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {selectedBranch && (
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <ProductRecommendations
                    branchId={selectedBranch}
                    excludeIds={[item._id]}
                    categoryId={item.category?._id}
                    title="You may also like"
                    limit={6}
                  />
                </div>
              )}
            </div>
            {/* Footer — Add to cart */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white">
              <QuantityStepper value={mainQty} min={1} onChange={setMainQty} />
              <IconButton
                onClick={() => handleAddToCart()}
                disabled={isAdded}
                variant={isAdded ? "success" : "primary"}
                icon={{
                  name: isAdded ? "Check" : isMobile ? null : "ShoppingBag",
                  size: 16,
                }}
                text={
                  isAdded
                    ? "Added!"
                    : isMobile
                      ? `+ ${formatCurrency(total)}`
                      : `Add to Cart ${formatCurrency(total)}`
                }
                className="w-full py-3 md:py-4 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
