"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useBreakpoint } from "@/hooks/utils/useBreakPoint";

const VISIBLE_COUNT = 6;

// hooks/useMenuCategories.ts
export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["categories", "menu"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    staleTime: 60000,
  });
};

const CategoryCarousel = () => {
  const { data: categories = [] } = useMenuCategories();
  const [startIndex, setStartIndex] = useState(0);
  const { isMobile } = useBreakpoint();

  const visibleItems = useMemo(() => {
    const total = categories.length;
    if(!total) return [];

    const count = isMobile ? 3 : VISIBLE_COUNT;

    return Array.from(
      { length: Math.min(count, total) },
      (_, i) => categories[(startIndex + i) % total],
    );
  }, [categories, startIndex, isMobile]);

  const next = () => setStartIndex((prev) => (prev + 1) % categories.length);
  const prev = () =>
    setStartIndex((prev) => (prev - 1 + categories.length) % categories.length);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Menu</h2>
          <a
            href="/menu"
            className="text-sm font-semibold text-brand-color-500 hover:underline"
          >
            View All
          </a>
        </div>

        {/* Carousel */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={prev}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-color-500 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Items */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 flex-1">
            {visibleItems?.map((category, i) => (
              <button
                key={`${category._id}-${startIndex}-${i}`}
                className="group text-left focus:outline-none flex flex-col items-center"
              >
                {/* Image — transparent bg, no box */}
                <div className="w-full aspect-square flex items-center justify-center mb-2 overflow-hidden">
                  <Image
                    src={category.image?.url ?? "/images/harrison_logo.png"}
                    alt={category.name}
                    height={100}
                    width={100}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-brand-color-500 transition-colors leading-tight text-center">
                  {category.name}
                </p>
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-color-500 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;
