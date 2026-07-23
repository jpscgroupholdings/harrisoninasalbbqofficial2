"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import {
  useRecommendations,
  RecommendationProduct,
} from "@/hooks/api/useRecommendations";
import { ITEM_TYPES } from "@/types/products";
import { formatCurrency } from "@/helper/formatter";
import { AppImage } from "@/components/AppImage";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/buttons";

type RecommendationLayout = "scroll" | "grid" | "column";

interface ProductRecommendationsProps {
  branchId: string | null;
  excludeIds?: string[];
  categoryId?: string | null;
  title?: string;
  limit?: number;
  /** Layout mode: "scroll" (horizontal row), "grid" (responsive wrap), "column" (vertical stack) */
  layout?: RecommendationLayout;
}

// ─── Card variants ────────────────────────────────────────────────────────────

/** Shared card logic — price computation and navigation */
const useCardActions = () => {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleAddToCart = (product: RecommendationProduct) => {
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price ?? 0,
      image: product.image.url,
      activeProductDiscount: product.activeProductDiscount,
      category: product.category,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleNavigate = (product: RecommendationProduct) => {
    router.push(`/products/${product._id}`);
  };

  return { handleAddToCart, handleNavigate };
};

/** Vertical card (image top, info bottom) — used in scroll and grid layouts */
const VerticalCard = ({
  product,
  onAddToCart,
  onNavigate,
}: {
  product: RecommendationProduct;
  onAddToCart: (product: RecommendationProduct) => void;
  onNavigate: (product: RecommendationProduct) => void;
}) => {
  const basePrice = product.price ?? 0;
  const hasDiscount =
    product.activeProductDiscount &&
    product.activeProductDiscount.discountAmount > 0;
  const displayPrice = hasDiscount
    ? product.activeProductDiscount!.discountedPrice
    : basePrice;
  const isComboOrSet =
    product.productType === ITEM_TYPES.COMBO ||
    product.productType === ITEM_TYPES.SET;

  return (
    <button
      onClick={
        isComboOrSet
          ? () => onNavigate(product)
          : (e) => {
              e.stopPropagation();
              onAddToCart(product);
            }
      }
      className="flex flex-1 h-full w-full flex-col rounded-xl border border-slate-100 bg-white overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
    >
      {/* Image — capped height so it stays proportional in wide containers */}
      <div
        onClick={() => onNavigate(product)}
        className="relative w-full h-32 sm:h-36 md:h-40 overflow-hidden"
      >
        <AppImage src={product.image.url} alt={product.name} />
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            {product.activeProductDiscount!.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
        <p className="text-left text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {product.name}
        </p>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-brand-color-500">
              {formatCurrency(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(basePrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

/** Horizontal card (image left, info right) — used in column layout */
const HorizontalCard = ({
  product,
  onAddToCart,
  onNavigate,
}: {
  product: RecommendationProduct;
  onAddToCart: (product: RecommendationProduct) => void;
  onNavigate: (product: RecommendationProduct) => void;
}) => {
  const basePrice = product.price ?? 0;
  const hasDiscount =
    product.activeProductDiscount &&
    product.activeProductDiscount.discountAmount > 0;
  const displayPrice = hasDiscount
    ? product.activeProductDiscount!.discountedPrice
    : basePrice;
  const isComboOrSet =
    product.productType === ITEM_TYPES.COMBO ||
    product.productType === ITEM_TYPES.SET;

  return (
    <button
      onClick={
        isComboOrSet
          ? () => onNavigate(product)
          : (e) => {
              e.stopPropagation();
              onAddToCart(product);
            }
      }
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 hover:shadow-sm transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ">
        <AppImage src={product.image.url} alt={product.name} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-left text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
          {product.name}
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-bold text-brand-color-500">
            {formatCurrency(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-slate-400 line-through">
              {formatCurrency(basePrice)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const VerticalSkeleton = () => (
  <div className="flex flex-col rounded-xl border border-slate-100 bg-white overflow-hidden animate-pulse">
    <div className="w-full h-32 sm:h-36 md:h-40 bg-slate-100" />
    <div className="px-3 pt-2.5 pb-3 space-y-2">
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 bg-slate-100 rounded w-14" />
        <div className="w-7 h-7 rounded-full bg-slate-100" />
      </div>
    </div>
  </div>
);

const HorizontalSkeleton = () => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 animate-pulse">
    <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-16" />
    </div>
    <div className="w-7 h-7 rounded-full bg-slate-100 shrink-0" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Reusable product recommendation section.
 * Shows popular products computed from completed orders.
 *
 * Layout modes:
 * - "scroll" — horizontal scrollable row (default, good for full-width + mobile)
 * - "grid"   — responsive CSS grid wrap (good for sidebars and medium sections)
 * - "column" — vertical stack of horizontal cards (good for narrow sidebars)
 */
const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  branchId,
  excludeIds = [],
  categoryId,
  title = "You may also like",
  limit = 6,
  layout = "scroll",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { handleAddToCart, handleNavigate } = useCardActions();

  const { data, isLoading } = useRecommendations({
    branchId,
    excludeIds,
    categoryId: categoryId || undefined,
    limit,
  });

  const recommendations = data?.data ?? [];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!isLoading && recommendations.length === 0) {
    return null;
  }

  const Card = layout === "column" ? HorizontalCard : VerticalCard;
  const Skeleton = layout === "column" ? HorizontalSkeleton : VerticalSkeleton;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {layout === "scroll" && (
          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              icon={{ name: "ChevronLeft", size: 12 }}
              variant="ghost"
              className="rounded-full"
            />
            <IconButton
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              icon={{ name: "ChevronRight", size: 12 }}
              variant="ghost"
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Cards container */}
      {layout === "scroll" && (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-36 shrink-0">
                  <Skeleton />
                </div>
              ))
            : recommendations.map((product) => (
                <div key={product._id} className="w-36 shrink-0">
                  <Card
                    product={product}
                    onAddToCart={handleAddToCart}
                    onNavigate={handleNavigate}
                  />
                </div>
              ))}
        </div>
      )}

      {layout === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
            : recommendations.map((product) => (
                <Card
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onNavigate={handleNavigate}
                />
              ))}
        </div>
      )}

      {layout === "column" && (
        <>
          {/* Mobile: 2-col grid with vertical cards */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <VerticalSkeleton key={i} />
                ))
              : recommendations.map((product) => (
                  <VerticalCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onNavigate={handleNavigate}
                  />
                ))}
          </div>

          {/* Desktop: stacked horizontal cards */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <HorizontalSkeleton key={i} />
                ))
              : recommendations.map((product) => (
                  <HorizontalCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onNavigate={handleNavigate}
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductRecommendations;
