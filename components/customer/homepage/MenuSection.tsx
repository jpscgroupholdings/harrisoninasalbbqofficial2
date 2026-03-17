"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "../../ui/ProductCard";
import { LINKS } from "@/constant/links";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import { useProducts } from "@/hooks/api/useProducts";
import { Category, Product } from "@/types/adminType";
import { useMenuCategories } from "@/components/main/CategoryCarousel";

const MenuSection = () => {
  const { data: products = [], refetch } = useProducts();
  useScrollToSection();

  const {
    data: categories,
    isPending: isCategoriesPending,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useMenuCategories();

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const filtersRef = useRef<HTMLDivElement>(null);

  // Refs map for each category section
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const computedItems = (() => {
    let items: Product[] = products;

    items = items.filter((item) => {
      if (activeCategory === "All") return true;
      return item.category.name === activeCategory;
    });
    return items;
  })();

  /** Scroll to a category section, accounting for sticky header height */
  const scrollToCategory = (categoryName: string) => {
    const el = categoryRefs.current[categoryName];
    if (!el) return;

    // Offset: sticky filter bar (~120px) + a little breathing room
    const OFFSET = 200;
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleChangeCategory = (category: string) => {
    setActiveCategory(category);
    setVisibleItems(new Set());

    // Give React a tick to re-render filtered items before scrolling
    requestAnimationFrame(() => {
      if (category === "All") {
        // Scroll to the menu section top
        const section = document.getElementById("menu-section");
        if (section) {
          const OFFSET = 80;
          const top =
            section.getBoundingClientRect().top + window.scrollY - OFFSET;
          window.scrollTo({ top, behavior: "smooth" });
        }
      } else {
        scrollToCategory(category);
      }
    });
  };

  /** Animate header and filters when component mounts or becomes visible */
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    if (filtersRef.current) observer.observe(filtersRef.current);

    return () => observer.disconnect();
  }, []);

  /** Observe product cards individually */
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "50px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(
            entry.target.getAttribute("data-index") || "0",
          );
          setVisibleItems((prev) => new Set([...prev, index]));
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll(".product-card-wrapper");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [computedItems]);

  // Group items by category for rendering
  const groupedItems = Object.entries(
    computedItems.reduce(
      (acc, item) => {
        const category = item.category.name || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, typeof computedItems>,
    ),
  );

  return (
    <section id="menu-section" className="py-4 bg-white scroll-mt-24">
      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
        {/**
         * Sticky filter bar — two stacked rows:
         *   Row 1: Category pills (full width, wraps naturally)
         */}
        <div
          ref={filtersRef}
          className="opacity-0 transition-all duration-700 delay-100 sticky top-18 md:top-20 z-30 bg-white w-full px-4 sm:px-6 lg:px-8 pb-5 pt-10 "
        >
          <div className="flex gap-2 mb-3 py-2 max-w-7xl mx-auto overflow-x-auto scrollbar-thin">
            {/* ── Loading ── */}
            {isCategoriesPending && (
              <>
                {[108, 76, 88, 64, 92].map((w, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-full bg-gray-100 animate-pulse shrink-0"
                    style={{ width: w }}
                  />
                ))}
              </>
            )}

            {/* ── Error ── */}
            {isCategoriesError && !isCategoriesPending && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-700 text-[10px] font-bold leading-none">
                    !
                  </span>
                </span>
                <span className="text-sm text-red-600">
                  Couldn't load categories
                </span>
                <button
                  onClick={() => refetchCategories()}
                  className="text-sm px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── Loaded ── */}
            {!isCategoriesPending && !isCategoriesError && (
              <>
                <button
                  onClick={() => handleChangeCategory("All")}
                  className={`text-nowrap px-4 py-2 cursor-pointer rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === "All"
                      ? "bg-brand-color-500 text-white shadow-lg shadow-brand-color-500/30"
                      : "bg-white text-gray-800 font-bold hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((category: Category) => (
                  <button
                    key={category._id}
                    onClick={() => handleChangeCategory(category.name)}
                    className={`text-nowrap px-5 py-3 cursor-pointer rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === category.name
                        ? "bg-brand-color-500 text-white shadow-lg shadow-brand-color-500/30"
                        : "bg-white text-gray-800 font-black hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/** Product Grid — grouped by category */}
        {groupedItems.length > 0 ? (
          groupedItems.map(([category, items]) => (
            <div
              key={category}
              // Attach the ref so we can scroll to this section
              ref={(el) => {
                categoryRefs.current[category] = el;
              }}
              className="max-w-7xl mx-auto mb-12"
            >
              {/* Category Header */}
              <div className="mb-10">
                <h2 className="text-[1.75rem] font-bold text-[#1a1a1a] tracking-tight">
                  {category}
                </h2>
                <div className="w-10 h-0.75 bg-brand-color-500 mt-4 rounded-full" />
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-6">
                {items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    data-index={index}
                    className={`product-card-wrapper h-full transition-all duration-500 ${
                      visibleItems.has(index)
                        ? "translate-y-0 opacity-100"
                        : "translate-y-10 opacity-0"
                    }`}
                    style={{ transitionDelay: `${(index % 12) * 50}ms` }}
                  >
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <Search size={25} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No product found
            </h3>
            <p className="text-gray-400">
              We couldn't find the product. Try to reload again
            </p>
            <button
              onClick={() => refetch()}
              className="underline mt-1 text-brand-color-500 hover:text-brand-color-600 cursor-pointer"
            >
              Reload
            </button>
          </div>
        )}

        {/** Delivery CTA */}
        <div className="max-w-7xl mx-auto bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Order Through Your Favorite Delivery App
              </h3>
              <p className="text-sm text-gray-600">
                Can't order directly? Get our food delivered via Grab or
                Foodpanda!
              </p>
            </div>
            <div className="flex w-full md:w-auto md:justify-end gap-3">
              <button
                onClick={() => window.open(`${LINKS.GRAB}`, "_blank")}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer grab-background-color text-white hover:bg-green-700 flex flex-col md:flex-row items-center gap-2 shadow-md hover:shadow-lg"
              >
                <img
                  src={"/images/grab.jpg"}
                  alt="grab logo"
                  className="w-8 h-8 scale-160 mr-2"
                  loading="lazy"
                />
                <p className="hidden md:block">Grab Food</p>
              </button>
              <button
                onClick={() => window.open(`${LINKS.FOODPANDA}`, "_blank")}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer bg-pink-600 text-white hover:bg-pink-700 flex flex-col md:flex-row items-center gap-2 shadow-md hover:shadow-lg"
              >
                <img
                  src={"/images/foodpanda_whiteoutline.png"}
                  alt="foodpanda logo"
                  className="w-8 h-8 scale-110"
                  loading="lazy"
                />
                <p className="hidden md:block">Foodpanda</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px; /* horizontal scrollbar height */
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db; /* gray-300 */
          border-radius: 9999px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af; /* gray-400 */
        }

        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
      `}</style>
    </section>
  );
};

export default MenuSection;
