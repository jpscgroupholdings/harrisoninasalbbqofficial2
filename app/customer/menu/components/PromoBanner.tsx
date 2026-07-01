"use client";

import React, { useEffect, useState } from "react";
import { OrderItemImage } from "../../components/OrderItemImage";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

interface PromoCard {
  id: number;
  image: string;
}

interface PromoBannerProps {
  autoPlayInterval?: number;
  type?: "single" | "multi"; // single = 1 img , multi = 3 imgs
}

const PromoBanner = ({
  autoPlayInterval = 10000,
  type = "multi",
}: PromoBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Sample promo cards
  const promoCards: PromoCard[] = [
    {
      id: 1,
      image: "promos/BANNER V1.png",
    },
    {
      id: 2,
      image: "promos/BANNER V2.png",
    },
    {
      id: 3,
      image: "promos/BANNER V3.png",
    },
    {
      id: 4,
      image: "promos/BANNER V4.png",
    },
  ];

  // Check if screen is mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is md breakpoint in Tailwind
    };

    // Check on mount
    checkMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Force single view on mobile, otherwise use the type prop
  const effectiveType = isMobile ? "single" : type;
  const cardsPerView = effectiveType === "multi" ? 3 : 1;
  const totalSlides = Math.ceil(promoCards.length / cardsPerView);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, totalSlides]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (effectiveType === "single") {
    // Single full-width (shown on mobile OR when type="single")
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-orange-50 to-red-50">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {promoCards.map((card) => (
            <div key={card.id} className="min-w-full relative">
              <div className="relative h-64 sm:h-72 md:h-80 lg:h-96">
                <div className="w-full h-full object-cover">
                  <OrderItemImage
                    image={card.image}
                    name={`Promo Banner ${card.id}`}
                  />

                  <div className="absolute bg-linear-to-t from-black/30 to-transparent inset-0"/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 md:p-3 shadow-lg transition-all z-10"
          aria-label="Previous slide"
        >
          <DynamicIcon name="ChevronLeft" size={20} className="text-gray-800 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 md:p-3 shadow-lg transition-all z-10"
          aria-label="Next slide"
        >
          <DynamicIcon name="ChevronRight" size={20} className="text-gray-800 sm:w-6 sm:h-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === index
                  ? "bg-brand-color-500 w-8"
                  : "bg-white/50 w-2 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    );
  }

  // Multi-card view (only shown on tablet/desktop)
  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="min-w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                {promoCards
                  .slice(
                    slideIndex * cardsPerView,
                    (slideIndex + 1) * cardsPerView,
                  )
                  .map((card) => (
                    <div
                      key={card.id}
                      className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="relative h-64">
                        <div className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                          <OrderItemImage
                            image={card.image}
                            name={`Promo Banner ${card.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation for multi-card view */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg transition-all z-10"
            aria-label="Previous slide"
          >
            <DynamicIcon name="ChevronLeft" size={24} className="text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg transition-all z-10"
            aria-label="Next slide"
          >
            <DynamicIcon name="ChevronRight" size={24} className="text-gray-800" />
          </button>
          
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-brand-color-500 w-8"
                    : "bg-gray-300 w-2 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PromoBanner;
