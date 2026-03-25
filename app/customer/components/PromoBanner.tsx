'use client'

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PromoCard {
  id: number;
  image: string;
  title: string;
  description: string;
  discount?: string;
}

interface PromoBannerProps {
  autoPlayInterval?: number;
  type?: "single" | "multi"; // single = 1 img , multi = 3 imgs
}

const PromoBanner = ({
  autoPlayInterval = 5000,
  type = "multi",
}: PromoBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Sample promo cards
  const promoCards: PromoCard[] = [
    {
      id: 1,
      image: "images/140.png",
      title: "Grilled Specials",
      description: "20% off all grilled items",
      discount: "20% OFF",
    },
    {
      id: 2,
      image: "images/141.png",
      title: "Buy 1 Take 1",
      description: "Selected beverages only",
      discount: "BUY 1 TAKE 1",
    },
    {
      id: 3,
      image: "images/142.png",
      title: "Weekend Deals",
      description: "Free delivery above ₱500",
      discount: "FREE DELIVERY",
    },
    {
      id: 4,
      image: "images/143.png",
      title: "Combo Meals",
      description: "Save up to ₱150",
      discount: "SAVE ₱150",
    },
    {
      id: 5,
      image: "images/144.png",
      title: "Family Bundles",
      description: "Perfect for sharing",
      discount: "30% OFF",
    },
    {
      id: 6,
      image: "images/145.png",
      title: "New Arrivals",
      description: "Try our latest dishes",
      discount: "NEW",
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
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24">
            
                    <span className="inline-block bg-brand-color-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm mb-3 sm:mb-4 w-fit">
                     Our Menu
                    </span>
                  
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
                    Favourite Dishes
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 mb-3 sm:mb-4 md:mb-6 max-w-2xl">
                   From our signature Chicken Inasal to mouthwatering BBQ, every dish is grilled with love and tradition.
                  </p>
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
          <ChevronLeft size={20} className="text-gray-800 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 md:p-3 shadow-lg transition-all z-10"
          aria-label="Next slide"
        >
          <ChevronRight size={20} className="text-gray-800 sm:w-6 sm:h-6" />
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
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
                        {card.discount && (
                          <div className="absolute top-4 right-4 bg-brand-color-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            {card.discount}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {card.title}
                          </h3>
                          <p className="text-sm text-white/90 mb-3">
                            {card.description}
                          </p>
                          <button className="bg-white hover:bg-gray-100 text-brand-color-500 px-4 py-2 rounded-full font-semibold text-sm transition-colors">
                            View Details
                          </button>
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
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-gray-800" />
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