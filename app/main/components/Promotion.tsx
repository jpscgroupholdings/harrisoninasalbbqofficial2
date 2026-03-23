"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Slide Data ───────────────────────────────────────────────────────────────

interface Slide {
  id: number;
  tag: string;
  headline: string;
  subheadline: string;
  description: string;
  cta: string;
  imageSrc: string | null; // null = placeholder
  imageAlt: string;
  align: "left" | "right";
}

const SLIDES: Slide[] = [
  {
    id: 1,
    tag: "House Special",
    headline: "Sulit Chicken\nPecho",
    subheadline: "Only ₱209",
    description:
      "Grilled to golden perfection over live charcoal. Juicy, smoky, and served with garlic rice — the inasal experience you keep coming back for.",
    cta: "Order Now",
    imageSrc: "/images/175.png",
    imageAlt: "Chicken Pecho Inasal",
    align: "right",
  },
  {
    id: 2,
    tag: "JuicyLicious",
    headline: "Leg Quarter\nInasal",
    subheadline: "Only ₱189",
    description:
      "Marinated overnight in our signature blend of calamansi, lemongrass & annatto. Fall-off-the-bone tender, every single time.",
    cta: "See the Menu",
    imageSrc: "/images/176.png",
    imageAlt: "Leg Quarter Inasal",
    align: "left",
  },
  {
    id: 3,
    tag: "Gather & Celebrate",
    headline: "Group Sets\nFor Every Occasion",
    subheadline: "From ₱599",
    description:
      "Birthday? Reunion? Balikbayan? Bring everyone together over a feast that feeds the body and the soul. Good food is always better shared.",
    cta: "View Group Sets",
    imageSrc: "/images/177.png",
    imageAlt: "Group Set Platter",
    align: "right",
  },
];

// ─── Placeholder image component ─────────────────────────────────────────────

const ImagePlaceholder = ({
  label,
  align,
}: {
  label: string;
  align: "left" | "right";
}) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/40 rounded-2xl border-2 border-dashed border-orange-200">
    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4501"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
    <p className="text-xs font-semibold text-orange-300 text-center px-4">
      {label}
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Promotion = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const goTo = useCallback(
    (index: number, dir: "next" | "prev" = "next") => {
      if (isAnimating) return;
      setDirection(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating],
  );

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, "next");
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, "prev");
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div id="promotions" className="w-full bg-white py-12 my-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-orange-600 mb-4">
          Make Every Meal a Moment
        </h2>
        <p className="text-gray-700 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Some meals are everyday. Some feel a little more special. At
          Harrison's, we make space for both.
        </p>
      </div>

      {/* Slide wrapper */}
      <div
        className={`
          relative max-w-6xl mx-auto rounded-3xl overflow-hidden bg-gray-50
          transition-all duration-500
          min-h-80 md:min-h-100
        `}
      >
        {/* Content */}
        <div
          className={`
            relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-0
            px-8 md:px-14 py-10 md:py-12
            transition-all duration-300
            ${
              isAnimating
                ? direction === "next"
                  ? "opacity-0 translate-x-4"
                  : "opacity-0 -translate-x-4"
                : "opacity-100 translate-x-0"
            }
            ${slide.align === "right" ? "md:flex-row" : "md:flex-row-reverse"}
          `}
        >
          {/* Text side */}
          <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
            {/* Tag */}
            <span
              className={`inline-flex self-center md:self-start items-center gap-1.5 text-xs font-bold text-white uppercase tracking-widest px-3 py-1 rounded-full bg-brand-color-500`}
            >
              <span className="w-1 h-1 rounded-full bg-white/60" />
              {slide.tag}
            </span>

            {/* Headline */}
            <h2
              className="font-extrabold text-[#1a1a1a] leading-[1.05] tracking-tight"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                whiteSpace: "pre-line",
              }}
            >
              {slide.headline}
            </h2>

            {/* Price bubble */}
            <div className="flex items-center gap-2 self-center md:self-start">
              <span
                className={`text-sm font-black px-4 py-1.5 rounded-full text-white bg-brand-color-500 shadow-md`}
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {slide.subheadline}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs self-center md:self-start">
              {slide.description}
            </p>

            {/* CTA */}
            <a
              href="#menu-section"
              className={`
                self-center md:self-start mt-2
                inline-flex items-center gap-2
                px-6 py-3 rounded-full text-white text-sm font-bold
                bg-brand-color-500
                shadow-lg hover:shadow-xl hover:scale-105
                transition-all duration-200 cursor-pointer
              `}
            >
              {slide.cta}
              <ArrowRight size={16}/>
            </a>
          </div>

          {/* Image side */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-70 md:max-w-90 aspect-square">
              {slide.imageSrc ? (
                <Image
                  src={slide.imageSrc}
                  alt={slide.imageAlt}
                  fill
                  className="object-cover rounded-2xl shadow-xl"
                  priority={slide.id === 1}
                />
              ) : (
                <ImagePlaceholder
                  label={`Upload "${slide.imageAlt}" here`}
                  align={slide.align}
                />
              )}
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronRight size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i, i > current ? "next" : "prev")}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === current
                ? "w-6 h-2.5 bg-brand-color-500"
                : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Bottom tagline */}
      <div className="text-center mt-12 space-y-1">
        <p className="text-2xl font-bold uppercase tracking-widest text-brand-color-500">
          Because every reason to gather is worth celebrating!
        </p>
        <p className="text-xl text-gray-500">
          Craving something grilled and comforting?{" "}
          <span className="font-semibold text-gray-700">
            Come by, order your favorites, and make it a meal worth sharing.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Promotion;
