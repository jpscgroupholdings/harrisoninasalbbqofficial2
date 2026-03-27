'use client'

import { useState, useEffect, useCallback } from "react";

const images = [
  "/images/slider3.jpg",
  "/images/Slider1.png",
  "/images/banner_slider.png",
];

export default function CarouselBanner() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const DURATION = 4000;

  const goTo = (idx: number) => setCurrent((idx + images.length) % images.length);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
    setProgress(0);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    let raf : any;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else next();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, next]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div role="region" aria-label="Image Carousel" className="relative w-full h-[30vh] md:h-[50vh] lg:h-[60vh] overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {/* Images */}
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i + 1}`}
            className="absolute inset-0 w-full h-[30vh] md:h-[50vh] lg:h-[60vh] object-content transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))}

        {/* Prev / Next */}
        <button
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm text-lg"
        >
          ‹
        </button>
        <button
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm text-lg"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-3 rounded-full bg-brand-color-200 overflow-hidden transition-all duration-300 cursor-pointer"
              style={{ width: i === current ? 28 : 12
               }}
               aria-label={`Go to slide ${i + 1}`}
               aria-current={i === current ? "true" : undefined}
            >
              {i === current && (
                <div
                  className="absolute inset-y-0 left-0 bg-brand-color-600 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}