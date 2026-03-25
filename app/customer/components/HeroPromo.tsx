"use client";

import React, { useState, useEffect } from 'react';

const HeroPromoWithImg = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const promos = [
    { id: 1, image: "/promos/promo3.jpg", alt: "Pork BBQ Promo" },
    { id: 2, image: "/promos/promobanner.jpg", alt: "Special Offer 2" },
    { id: 3, image: "/promos/promo2.jpg", alt: "Special Offer 3" },
  ];

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % promos.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + promos.length) % promos.length);

  return (
    <div className="w-full py-4 sm:py-8">
      <div className="max-w-350 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative group">
          {/* Carousel Container - Wide aspect ratio like the image */}
          <div className="relative w-full aspect-[16/6] sm:aspect-[16/7] md:aspect-[21/9] lg:aspect-[21/8] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
            {/* Slides */}
            {promos.map((promo, index) => (
              <img
                key={promo.id}
                src={promo.image}
                alt={promo.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>

          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
            {promos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all rounded-full ${
                  index === currentSlide
                    ? 'bg-white w-8 sm:w-10 h-2 sm:h-2.5'
                    : 'bg-white/60 hover:bg-white/80 w-2 sm:w-2.5 h-2 sm:h-2.5'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroPromoWithImg;