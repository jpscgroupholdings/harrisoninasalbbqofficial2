"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../../ui/ProductCard";
import PromoBanner from "./PromoBanner";
import { LINKS } from "@/constant/links";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import { useProducts } from "@/hooks/api/useProducts";
import { Category, Product } from "@/types/adminType";
import { InputField } from "@/components/ui/InputField";
import { useMenuCategories } from "@/components/main/CategoryCarousel";

const MenuSection = ({
  variant = "full",
}: {
  variant?: "landing" | "full";
}) => {
  const { data: products = [], refetch } = useProducts();
  useScrollToSection();

  const { data: categories } = useMenuCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "default" | "price-low" | "price-high" | "name"
  >("default");

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const headerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const computedItems = (() => {
    let items: Product[] = products;

    // Landing page logic
    if (variant === "landing") {
      items = items
        .filter((item) => item.price > 300 && item.description)
        .slice(0, 7);
    }

    // Full menu logic
    if (variant === "full") {
      items = items
        .filter((item) => {
          if (activeCategory === "All") return true;
          if (activeCategory === "Best Sellers") return item.isPopular;
          return item.category.name === activeCategory;
        })
        .filter((item) => {
          if (!searchQuery) return true;
          return (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "price-low":
              return a.price - b.price;
            case "price-high":
              return b.price - a.price;
            case "name":
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
    }

    return items;
  })();

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

    if (headerRef.current) observer.observe(headerRef.current);
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
  }, [computedItems]); // Re-run when filtered items change

  const handleChangeCategory = (category: string) => {
    setActiveCategory(category);
    setVisibleItems(new Set()); // Reset visible items when category changes
  };

  return (
    <section id="menu-section" className="py-4 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/** Section Header */}
        <div
          ref={headerRef}
          className="text-center mb-12 opacity-0 transition-all duration-700"
        >
          <p className="text-brand-color-500 font-semibold text-xl uppercase tracking-widest">
            Our Menu
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Favourite Dishes
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From our signature Chicken Inasal to mouthwatering BBQ, every dish
            is grilled with love and tradition.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
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
                />
                <p className="hidden md:block">Grab Food</p>
              </button>
              <button
                onClick={() => window.open(`${LINKS.FOODPANDA}`, "_blank")}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer bg-pink-600 text-white hover:bg-pink-700 flex flex-col md:flex-row items-center gap-2 shadow-md hover:shadow-lg"
              >
                <img
                  src={"/images/foodpanda_whiteoutline.png"}
                  alt="grab logo"
                  className="w-8 h-8 scale-110"
                />{" "}
                <p className="hidden md:block">Foodpanda</p>
              </button>
            </div>
          </div>
        </div>

        {/** Filters button, sort, search */}
        {variant === "full" && (
          <>
            {/** Filters bar */}
            <div
              ref={filtersRef}
              className="flex flex-col items-start lg:flex-row gap-4 mb-8 opacity-0 transition-all duration-700 delay-100"
            >
              {/** Category Pills */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {categories?.map((category: Category) => (
                  <button
                    key={category._id}
                    onClick={() => handleChangeCategory(category.name)}
                    className={`px-4 py-2 cursor-pointer rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === category.name
                        ? "bg-brand-color-500 text-white shadow-lg shadow-brand-color-500/30"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              {/** Search and sort */}
              <div className="flex gap-3 lg:ml-auto">
                {/** Search */}
                <InputField
                  type="text"
                  placeholder="Search Menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={18} />}
                  className="rounded-xl text-sm min-w-2xs"
                  rightElement={
                    searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    )
                  }
                />
                {/** Sort dropdown */}
                <div className="relative text-gray-600">
                  <select
                    name=""
                    id=""
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-brand-color-500 focus:ring-2 focus:ring-brand-color-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="default">Sort By: </option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                  <SlidersHorizontal
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                  />
                </div>
              </div>
            </div>
            {/** Results count*/}
            <div className="text-gray-500 text-sm">
              Showing {computedItems.length}{" "}
              {computedItems.length === 1 ? "item" : "items"}
              {activeCategory !== "All" && ` in ${activeCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          </>
        )}

        {/** Promo banners like specials, buy 1 take 1 */}
        <PromoBanner type="multi" />

        {/** Product Grid */}
        {computedItems.length > 0 ? (
          variant === "landing" ? (
            // Landing page: Single grid without category grouping
            <>
              <div className="mb-10">
                <h2 className="text-[1.75rem] font-bold text-[#1a1a1a] tracking-tight">
                  Customer Favourites 🔥
                </h2>
                <div className="w-10 h-0.75 bg-brand-color-500 mt-4 rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {computedItems.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    data-index={index}
                    className={`product-card-wrapper h-full transition-all duration-500 ${
                      visibleItems.has(index)
                        ? "translate-y-0 opacity-100"
                        : "translate-y-10 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <ProductCard item={item} />
                  </div>
                ))}

                {/* CTA */}
                <div
                  className="mt-12 md:pt-0 flex items-center justify-center transition-all duration-500 opacity-0 translate-y-10"
                  style={{ transitionDelay: `${computedItems.length * 50}ms` }}
                  ref={(el) => {
                    if (el && !el.classList.contains("animated")) {
                      setTimeout(() => {
                        el.classList.add(
                          "translate-y-0",
                          "opacity-100",
                          "animated",
                        );
                        el.classList.remove("translate-y-10", "opacity-0");
                      }, 100);
                    }
                  }}
                >
                  <a
                    aria-label="View full menu"
                    href="/menu"
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-brand-color-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:shadow-brand-color-500/30 transition-all duration-300 hover:scale-105 overflow-hidden"
                  >
                    {/* Animated background gradient */}
                    <span className="absolute inset-0 bg-linear-to-r from-[#ff4500] to-brand-color-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content */}
                    <span className="relative z-10">View Full Menu</span>
                    <ArrowRight
                      size={22}
                      className="relative transition-transform duration-300 group-hover:translate-x-1"
                    />

                    {/* Shine effect */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            // Full menu: Grouped by category
            Object.entries(
              computedItems.reduce(
                (acc, item) => {
                  const category = item.category.name || "Uncategorized";
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
                },
                {} as Record<string, typeof computedItems>,
              ),
            ).map(([category, items], categoryIndex) => (
              <div key={category} className="mb-12">
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
          )
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
      </div>

      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
};

export default MenuSection;
