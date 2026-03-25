'use client'

import Image from "next/image";
import React, { useEffect, useState } from "react";

const PromoBannerV2 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
  
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

  const promoData = [
    { src: "/promos/bonding-bites.jpg", alt: "Bonding Plates promo" },
    { src: "/promos/ubeturon.jpg", alt: "Ube Turon promo" },
    {
      src: "/promos/harrison-fullplates.jpg",
      alt: "Harrison Full Plates promo",
    },
  ];

  // Promos carousel - show 1 item on mobile
  const visiblePromos = isMobile ? [promoData[promoIndex]] : promoData;

  const nextPromo = () => {
    if (promoIndex < promoData.length - 1) {
      setPromoIndex(promoIndex + 1);
    } else {
      setPromoIndex(0);
    }
  };

  const prevPromo = () => {
    if (promoIndex > 0) {
      setPromoIndex(promoIndex - 1);
    } else {
      setPromoIndex(promoData.length - 1);
    }
  };

  return (
    <div className="bg-gray-100 py-8">
      {/* Promos Section */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-[#ef4501] font-bold text-4xl">Promos</h1>
          <p className="text-[#ef4501]/80 text-lg font-[550]">
            These deals and discounts are waiting for you!
          </p>
        </div>

        {/* Desktop: Show all promos */}
        <div className="hidden md:flex items-center justify-center w-full max-w-7xl mx-auto gap-8">
          {promoData.map(({ src, alt }) => (
            <div key={src} className="relative w-full max-w-450px aspect-6/9">
              <Image
                src={src}
                fill
                alt={alt}
                className="rounded-xl object-cover"
                sizes="(max-width: 768px) 90vw, 450px"
                priority
              />
            </div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden relative">
          <div className="flex justify-center items-center">
            {visiblePromos.map(({ src, alt }) => (
              <Image
                key={src}
                src={src}
                height={300}
                width={350}
                alt={alt}
                className="rounded-xl object-cover w-full max-w-sm"
                sizes="100vw"
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevPromo}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous promo"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextPromo}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Next promo"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {promoData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPromoIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  promoIndex === idx ? "bg-white w-8" : "bg-white/50"
                }`}
                aria-label={`Go to promo ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBannerV2;
