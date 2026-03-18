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
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLucideIcon } from "@/lib/iconUtils";

// ── Constants ────────────────────────────────────────────────────────────────
const SIGNATURE_LIMIT = 4;
const MOBILE_VISIBLE = 2;
const TABLET_VISIBLE = 3;

const HARRISONS_EXP = [
  { icon: "Flame", description: "Freshly grilled meals, made daily" },
  { icon: "Beef", description: "Bold flavors that satisfy" },
  {
    icon: "UtensilsCrossed",
    description: "Generous servings, sulit every time",
  },
  { icon: "Laugh", description: "Friendly and welcoming atmosphere" },
];

const SERVICES = [
  {
    icon: "Store",
    label: "Dine-in / Take-out",
  },
  {
    icon: "Truck",
    label: "Delivery",
  },
  {
    icon: "PartyPopper",
    label: "Events",
  },
  {
    icon: "Utensils",
    label: "Bulk Order",
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────
const ProductCardSkeleton = () => (
  <div className="bg-brand-color-50 border border-brand-color-100 rounded-lg animate-pulse aspect-square flex items-center justify-center">
    <div className="w-20 h-20 bg-brand-color-200 rounded" />
  </div>
);

const ProductsError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Failed to load products
    </h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">
      We couldn't fetch our signature products right now. Please check your
      connection and try again.
    </p>
    <button
      onClick={onRetry}
      className="bg-brand-color-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-color-700 transition-colors rounded"
    >
      Try Again
    </button>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const WhatWeServe = () => {
  const { data: menuData = [], isLoading, isError, refetch } = useProducts();
  const { isMobile, isTablet } = useBreakpoint();
  const orderUrl = useSubdomainPath("/", "food");

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
      setProductIndex(
        (i) =>
          (i + (direction === "next" ? 1 : -1) + menuList.length) %
          menuList.length,
      );
      setCardsVisible(true);
    }, 150);
  };

  // Wrap-aware sliding window
  const visibleProducts = isCarousel
    ? Array.from(
        { length: visibleCount },
        (_, i) => menuList[(productIndex + i) % menuList.length],
      )
    : menuList;

  const handleDotClick = (idx: number) => {
    setCardsVisible(false);
    setTimeout(() => {
      setProductIndex(idx);
      setCardsVisible(true);
    }, 150);
  };

  // ── Scroll-triggered animations ──
  const { ref: headerRef, isVisible: isHeaderVisible } =
    useIntersectionAnimation({ threshold: 0.2, triggerOnce: false });

  const { itemRefs: cardRefs, visibleItems: visibleCards } =
    useIntersectionAnimationList<HTMLElement>(menuList.length);

  // ── Product card renderer ──
  const renderProductCard = (
    product: (typeof menuList)[number],
    index: number,
    options: {
      carousel?: boolean;
      ref?: (el: HTMLElement | null) => void;
    } = {},
  ) => (
    <div
      key={`${product._id}-${index}`}
      ref={options.ref}
      className={`bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-brand-color-300 transition-all ${
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
      <div className="aspect-square overflow-hidden bg-gray-50 flex items-center justify-center min-h-50">
        {product.image?.url ? (
          <img
            src={product.image.url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-brand-color-400 text-sm font-semibold italic">
            {"{Photo}"}
          </span>
        )}
      </div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
        <h3 className="font-bold text-brand-color-600 text-sm md:text-base">
          {product.name}
        </h3>
        <div className="mt-auto">
          <Link
            href={orderUrl}
            className="block w-full bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold py-2 px-4 text-center text-sm rounded transition-colors"
            aria-label={`Order ${product.name}`}
          >
            ORDER NOW
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section id="what-we-serve" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-color-500 mb-4">
            Grilled Favorites You'll Love
          </h2>
          <p className="text-gray-700 text-base md:text-lg max-w-2xl mx-auto">
            Our menu is built around comfort, flavor, and sharing. Made for
            everyday cravings and meaningful meals.
          </p>
        </div>

        {/* Error state */}
        {isError && !isLoading && <ProductsError onRetry={refetch} />}

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <div className="hidden lg:grid grid-cols-4 gap-4 mb-12">
              {Array.from({ length: SIGNATURE_LIMIT }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden md:flex lg:hidden gap-4 overflow-hidden mb-12">
              {Array.from({ length: TABLET_VISIBLE }).map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(33.333%-11px)]">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
            <div className="flex md:hidden gap-4 overflow-hidden mb-12">
              {Array.from({ length: MOBILE_VISIBLE }).map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(50%-8px)]">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Products section */}
        {!isLoading && !isError && menuList.length > 0 && (
          <div className="relative mb-16">
            {/* Desktop grid */}
            <div className="hidden lg:grid grid-cols-4 gap-4">
              {menuList.map((product, index) =>
                renderProductCard(product, index, {
                  ref: (el) => {
                    cardRefs.current[index] = el;
                  },
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

              {/* Navigation arrows */}
              <button
                onClick={() => navigate("prev")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full p-2 shadow-lg transition-colors z-10"
                aria-label="Previous products"
              >
                <ChevronLeft />
              </button>

              <button
                onClick={() => navigate("next")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full p-2 shadow-lg transition-colors z-10"
                aria-label="Next products"
              >
                <ChevronRight />
              </button>

              {/* Pagination dots */}
              {menuList.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {menuList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={`h-2 rounded-full transition-all ${
                        productIndex === idx
                          ? "bg-brand-color-500 w-8"
                          : "bg-gray-300 w-2"
                      }`}
                      aria-label={`Go to product ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Two-column section below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-8 border-t border-brand-color-100">
          {/* The Harrison's Experience */}
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-brand-color-500">
              The Harrison's Experience
            </h3>
            <p className="text-gray-700 leading-relaxed">
              At Harrison's, it's not just about the food—it's about the
              experience.
            </p>
            <ul className="space-y-3">
              {HARRISONS_EXP.map((item, index) => {
                const Icon = getLucideIcon(item.icon);
                return (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <Icon className="text-xl shrink-0 text-brand-color-500" />
                    <span>{item.description}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-gray-600 pt-4 leading-relaxed">
              We bring people together through food—whether it's a quick lunch,
              family dinner, or barkada hangout.
            </p>
          </div>

          {/* How to Enjoy Harrison's */}
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-brand-color-500">
              How to Enjoy Harrison's
            </h3>
            <p className="text-gray-700">Enjoy your favorites your way:</p>
            <ul className="space-y-3">
              {SERVICES.map((item, index) => {
                const Icon = getLucideIcon(item.icon);

                return (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <Icon className="text-brand-color-500 text-xl shrink-0" />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-gray-600 pt-4 leading-relaxed">
              Just like leading grill brands that make food accessible
              nationwide, we aim to bring Harrison's closer to you—anytime,
              anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeServe;
