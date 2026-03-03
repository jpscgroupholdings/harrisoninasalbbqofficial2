"use client";

import { animationStyle } from "@/helper/animationStyle";
import { useBreakpoint } from "@/hooks/utils/useBreakPoint";
import {
  useIntersectionAnimation,
  useIntersectionAnimationList,
} from "@/hooks/utils/useIntersectionAnimation";
import { useProducts } from "@/hooks/api/useProducts";
import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import Link from "next/link";
import { useState } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const SIGNATURE_LIMIT = 4;
const MOBILE_VISIBLE = 2;
const TABLET_VISIBLE = 3;

// ── Sub-components ───────────────────────────────────────────────────────────
const ProductCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg animate-pulse">
    <div className="aspect-square bg-gray-200 rounded-t-lg" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex items-center justify-between mt-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="w-9 h-9 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

const ProductsError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load products</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">
      We couldn't fetch our signature products right now. Please check your connection and try again.
    </p>
    <button
      onClick={onRetry}
      className="bg-brand-color-500 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-color-600 transition-colors rounded"
    >
      Try Again
    </button>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const ProductMain = () => {
  const { data: menuData = [], isLoading, isError, refetch } = useProducts();
  const { isMobile, isTablet } = useBreakpoint();
  const orderUrl = useSubdomainPath("/menu", "food");

  const menuList = menuData
    .filter((item) => item.isSignature)
    .slice(0, SIGNATURE_LIMIT);

  const isCarousel = isMobile || isTablet;
  const visibleCount = isTablet ? TABLET_VISIBLE : MOBILE_VISIBLE;

  // ── Carousel state ──
  const [productIndex, setProductIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(true);
  

  const navigate = (direction: "next" | "prev") => {
    setCardsVisible(false);
    setTimeout(() => {
      setProductIndex((i) =>
        (i + (direction === "next" ? 1 : -1) + menuList.length) % menuList.length
      );
      setCardsVisible(true);
    }, 150);
  };

  // Wrap-aware sliding window — same for mobile and tablet
  const visibleProducts = isCarousel
    ? Array.from({ length: visibleCount }, (_, i) =>
        menuList[(productIndex + i) % menuList.length]
      )
    : menuList;

  // One dot per item (sliding window, so each position is unique)
  const handleDotClick = (idx: number) => {
    setCardsVisible(false);
    setTimeout(() => { setProductIndex(idx); setCardsVisible(true); }, 150);
  };

  // ── Scroll-triggered animations (desktop only) ──
  const { ref: headerRef, isVisible: isHeaderVisible } =
    useIntersectionAnimation({ threshold: 0.2, triggerOnce: false });

  const { itemRefs: cardRefs, visibleItems: visibleCards } =
    useIntersectionAnimationList<HTMLElement>(menuList.length);

  // ── Shared card renderer ──
  const renderProductCard = (
    product: (typeof menuList)[number],
    index: number,
    options: { carousel?: boolean; ref?: (el: HTMLElement | null) => void } = {},
  ) => (
    <div
      key={`${product._id}-${index}`}
      ref={options.ref}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-brand-color-500 transition-shadow ${
        options.carousel
          ? `shrink-0 ${
              isTablet ? "w-[calc(33.333%-11px)]" : "w-[calc(50%-8px)]"
            } ${animationStyle(cardsVisible).className}`
          : animationStyle(visibleCards[index], index * 120).className
      }`}
      style={
        options.carousel
          ? animationStyle(cardsVisible, index * 60).style
          : undefined
      }
    >
      <div className="aspect-square overflow-hidden bg-white flex items-center justify-center">
        <img src={product.image.url} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 leading-snug text-sm md:text-base">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-semibold text-gray-900 text-xs md:text-sm">
            ₱{product.price?.toFixed(2) ?? "—"}
          </span>
          <Link
            href={orderUrl}
            className="w-8 h-8 rounded-full bg-brand-color-500 hover:bg-brand-color-600 flex items-center justify-center text-white transition-colors shrink-0"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section id="products-main-section" className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={headerRef}
          className={`flex items-center justify-between mb-6 ${animationStyle(isHeaderVisible).className}`}
        >
          <h2 className="text-2xl font-bold text-gray-900">Bestsellers</h2>
          <a href={orderUrl} className="text-sm font-semibold text-brand-color-500 hover:underline">
            View All
          </a>
        </div>

        {/* Error */}
        {isError && !isLoading && <ProductsError onRetry={refetch} />}

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <div className="hidden lg:grid grid-cols-4 gap-4">
              {Array.from({ length: SIGNATURE_LIMIT }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
            <div className="hidden md:flex lg:hidden gap-4 overflow-hidden">
              {Array.from({ length: TABLET_VISIBLE }).map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(33.333%-11px)]"><ProductCardSkeleton /></div>
              ))}
            </div>
            <div className="flex md:hidden gap-4 overflow-hidden">
              {Array.from({ length: MOBILE_VISIBLE }).map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(50%-8px)]"><ProductCardSkeleton /></div>
              ))}
            </div>
          </>
        )}

        {/* Products */}
        {!isLoading && !isError && (
          <div className="relative">
            {/* Desktop grid */}
            <div className="hidden lg:grid grid-cols-4 gap-4">
              {menuList.map((product, index) =>
                renderProductCard(product, index, {
                  ref: (el) => { cardRefs.current[index] = el; },
                }),
              )}
            </div>

            {/* Mobile / Tablet carousel */}
            <div className="lg:hidden relative">
              <div className="flex gap-4 overflow-hidden">
                {visibleProducts.map((product, index) =>
                  renderProductCard(product, index, { carousel: true }),
                )}
              </div>

              {/* Prev — always visible, wraps around */}
              <button
                onClick={() => navigate("prev")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                aria-label="Previous products"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next — always visible, wraps around */}
              <button
                onClick={() => navigate("next")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                aria-label="Next products"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots — one per item */}
              {menuList.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {menuList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={`h-2 rounded-full transition-all ${
                        productIndex === idx ? "bg-brand-color-500 w-8" : "bg-gray-300 w-2"
                      }`}
                      aria-label={`Go to product ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductMain;