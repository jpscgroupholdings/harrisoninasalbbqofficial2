"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ProductCard from "../../ui/ProductCard";
import { LINKS } from "@/constant/links";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import { useProducts } from "@/hooks/api/useProducts";
import { Category, Product } from "@/types/adminType";
import { useMenuCategories } from "@/app/main/components/CategoryCarousel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubcategoryGroup {
  subcategoryName: string | null;
  items: Product[];
}

interface CategoryGroup {
  categoryName: string;
  subcategoryGroups: SubcategoryGroup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupProducts(products: Product[]): CategoryGroup[] {
  const categoryMap = new Map<string, Map<string | null, Product[]>>();

  for (const product of products) {
    const catName = product.category?.name ?? "Uncategorized";
    const subName = product.subcategory?.name ?? null;

    if (!categoryMap.has(catName)) categoryMap.set(catName, new Map());
    const subMap = categoryMap.get(catName)!;
    if (!subMap.has(subName)) subMap.set(subName, []);
    subMap.get(subName)!.push(product);
  }

  return Array.from(categoryMap.entries()).map(([categoryName, subMap]) => ({
    categoryName,
    subcategoryGroups: Array.from(subMap.entries()).map(
      ([subcategoryName, items]) => ({ subcategoryName, items }),
    ),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const contentRef = useRef<HTMLDivElement>(null);

  // ── Filter + group ──────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    if (activeCategory !== "All" && p.category?.name !== activeCategory)
      return false;
    if (
      activeSubcategory &&
      (p.subcategory?.name ?? null) !== activeSubcategory
    )
      return false;
    return true;
  });

  const groupedItems = groupProducts(filteredProducts);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const scrollToContent = () => {
    if (!contentRef.current) return;
    const top =
      contentRef.current.getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleSelectCategory = (categoryName: string) => {
    setActiveCategory(categoryName);
    setActiveSubcategory(null);

    scrollToContent();

    if (categoryName === "All") {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories((prev) => {
        const next = new Set<string>();
        if (!prev.has(categoryName)) next.add(categoryName);
        return next;
      });
    }
  };

  const handleSelectSubcategory = (subcategoryName: string | null) => {
    setActiveSubcategory(subcategoryName);

    scrollToContent();
  };

  // ── Card visibility observer ──────────────────────────────────────────────

  // ── Sidebar helpers ───────────────────────────────────────────────────────

  const getSubcategoriesForCategory = (categoryName: string): string[] => {
    const subs = new Set<string>();
    products
      .filter((p) => p.category?.name === categoryName)
      .forEach((p) => {
        if (p.subcategory?.name) subs.add(p.subcategory.name);
      });
    return Array.from(subs);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  let globalIndex = 0;

  const ProductGrid = ({ items }: { items: Product[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-4 md:gap-5">
      {items.map((item) => {
        const index = globalIndex++;
        return (
          <div
            key={item._id}
            data-index={index}
            id={item._id}
            className={`product-card-wrapper h-full transition-all duration-500`}
            style={{ transitionDelay: `${(index % 8) * 60}ms` }}
          >
            <ProductCard item={item} />
          </div>
        );
      })}
    </div>
  );

  const GroupedContent = () => (
    <>
      {groupedItems.length > 0 ? (
        <div className="space-y-12">
          {groupedItems.map(({ categoryName, subcategoryGroups }) => (
            <div key={categoryName}>
              {/* Category header — only when All is selected */}
              {activeCategory === "All" && (
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                    {categoryName}
                  </h2>
                  <div className="w-8 h-0.5 bg-brand-color-500 mt-3 rounded-full" />
                </div>
              )}

              <div className="space-y-9">
                {subcategoryGroups.map(({ subcategoryName, items }) => (
                  <div key={subcategoryName ?? "__none__"}>
                    {subcategoryName && (
                      <div className="flex items-center gap-3 mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 shrink-0">
                          {subcategoryName}
                        </h3>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )}
                    <ProductGrid items={items} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search size={32} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-base font-semibold text-gray-500 mb-1">
            No products found
          </h3>
          <p className="text-sm text-gray-400">Try a different category</p>
          <button
            onClick={() => refetch()}
            className="underline mt-2 text-sm text-brand-color-500 hover:text-brand-color-600 cursor-pointer"
          >
            Reload
          </button>
        </div>
      )}
    </>
  );

  const DeliveryCTA = () => (
    <div className="bg-slate-50 rounded-2xl p-6 mt-12 border border-slate-100">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Order Through Your Favorite Delivery App
          </h3>
          <p className="text-sm text-gray-500">
            Can't order directly? Get our food delivered via Grab or Foodpanda!
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(`${LINKS.GRAB}`, "_blank")}
            className="px-5 py-2.5 rounded-xl font-semibold grab-background-color text-white hover:bg-green-700 flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <img
              src="/images/grab.jpg"
              alt="grab"
              className="w-6 h-6 scale-125"
              loading="lazy"
            />
            <span className="text-sm">Grab Food</span>
          </button>
          <button
            onClick={() => window.open(`${LINKS.FOODPANDA}`, "_blank")}
            className="px-5 py-2.5 rounded-xl font-semibold bg-pink-600 text-white hover:bg-pink-700 flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <img
              src="/images/foodpanda_whiteoutline.png"
              alt="foodpanda"
              className="w-6 h-6"
              loading="lazy"
            />
            <span className="text-sm">Foodpanda</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section id="menu-section" className="bg-white scroll-mt-24">
      {/* ══════════════════════════════════════════════
          MOBILE — horizontal pill bar + content
      ══════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* Sticky pill bar */}
        <div className="sticky top-18 z-30 bg-white border-b border-gray-100 pt-8 pb-2">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            <button
              onClick={() => handleSelectCategory("All")}
              className={`text-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                activeCategory === "All"
                  ? "bg-brand-color-500 text-white shadow-md shadow-brand-color-500/30"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All
            </button>

            {isCategoriesPending &&
              [80, 96, 72, 88].map((w, i) => (
                <div
                  key={i}
                  className="h-9 rounded-full bg-gray-100 animate-pulse shrink-0"
                  style={{ width: w }}
                />
              ))}

            {!isCategoriesPending &&
              !isCategoriesError &&
              categories?.map((cat: Category) => (
                <button
                  key={cat._id}
                  onClick={() => handleSelectCategory(cat.name)}
                  className={`text-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                    activeCategory === cat.name
                      ? "bg-brand-color-500 text-white shadow-md shadow-brand-color-500/30"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>

          {/* Subcategory pills (only when category has subcategories) */}
          {activeCategory !== "All" &&
            (() => {
              const subs = getSubcategoriesForCategory(activeCategory);
              if (subs.length === 0) return null;
              return (
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pt-4">
                  <button
                    onClick={() => handleSelectSubcategory(null)}
                    className={`text-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      activeSubcategory === null
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSelectSubcategory(sub)}
                      className={`text-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        activeSubcategory === sub
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              );
            })()}
        </div>

        {/* Mobile product content */}
        <div className="px-4 py-6">
          <GroupedContent />
          <DeliveryCTA />
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP — sticky sidebar + content
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex max-w-360 mx-auto gap-8 py-8 relative mt-12">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 sticky top-52 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
          <div className="space-y-2 pr-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pb-3">
              Browse Menu
            </p>

            {/* All */}
            <button
              onClick={() => handleSelectCategory("All")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeCategory === "All"
                  ? "bg-brand-color-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              All Categories
            </button>

            {/* Skeletons */}
            {isCategoriesPending &&
              [1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-xl bg-gray-100 animate-pulse"
                />
              ))}

            {/* Error */}
            {isCategoriesError && !isCategoriesPending && (
              <div className="px-3 py-2 text-xs text-red-500">
                Failed to load.{" "}
                <button
                  onClick={() => refetchCategories()}
                  className="underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Categories */}
            {!isCategoriesPending &&
              !isCategoriesError &&
              categories?.map((cat: Category) => {
                const isActive = activeCategory === cat.name;
                const isExpanded = expandedCategories.has(cat.name);
                const subcategories = getSubcategoriesForCategory(cat.name);
                const hasSubcategories = subcategories.length > 0;

                return (
                  <div key={cat._id}>
                    <button
                      onClick={() => handleSelectCategory(cat.name)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? "bg-brand-color-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {hasSubcategories && (
                        <ChevronDown
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${
                            isActive ? "text-white/70" : "text-gray-400"
                          }`}
                        />
                      )}
                    </button>

                    {/* Subcategory list */}
                    {hasSubcategories && isExpanded && (
                      <div className="ml-3 my-2 border-l-2 border-gray-100 pl-3 space-y-2">
                        <button
                          onClick={() => handleSelectSubcategory(null)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeSubcategory === null
                              ? "text-brand-color-500 bg-brand-color-500/10"
                              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          All
                        </button>
                        {subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => handleSelectSubcategory(sub)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              activeSubcategory === sub
                                ? "text-brand-color-500 bg-brand-color-500/10"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>

        {/* Content */}
        <div ref={contentRef} className="flex-1 min-w-0">
          <GroupedContent />
          <DeliveryCTA />
        </div>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
      `}</style>
    </section>
  );
};

export default MenuSection;
