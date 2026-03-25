"use client";

import { ChefHat, Flame, Star } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// ─── Product Data ───────────────────────────────────────────
const products = [
  {
    id: 1,
    tag: "Signature",
    title: "Chicken Inasal",
    description:
      "Our flagship. Slow-grilled over hardwood charcoal with a secret Visayan marinade passed down through generations. The skin cracks, the meat stays impossibly juicy.",
    price: "₱189",
    details: [
      "Halved, not quartered",
      "Charcoal-grilled 40 mins",
      "Served with garlic rice & sawsawan",
    ],
    image: "/images/140.png", // replace with your actual image
    color: "#ef4501",
  },
  {
    id: 2,
    tag: "Fan Favourite",
    title: "Pork BBQ",
    description:
      "Sweet, sticky, smoky. Our pork skewers are marinated overnight in a brown-sugar glaze and kissed by open flame until caramelised perfection.",
    price: "₱149",
    details: [
      "3-piece skewer",
      "Overnight marinated",
      "Served with vinegar dipping sauce",
    ],
    image: "/images/porkbbq.jpg",
    color: "#c43600",
  },
  {
    id: 3,
    tag: "New",
    title: "Beef Inihaw",
    description:
      "Bold. Beefy. Unapologetic. Thick-cut beef ribs grilled over live coals with a soy-calamansi glaze that balances savory and bright in every bite.",
    price: "₱249",
    details: [
      "Thick-cut ribs",
      "Soy-calamansi glaze",
      "Served with garlic rice & atchara",
    ],
    image: "images/153.png",
    color: "#a83000",
  },
];

const StickyScrollProducts = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const contentPanels = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection observer - fires per content panel
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    contentPanels.current.forEach((panel, i) => {
      if (!panel) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(i);
        },
        {
          root: null,
          rootMargin: "-40% 0px -40% 0px",
          threshold: 0,
        },
      );

      obs.observe(panel);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const active = products[activeIndex];

  return (
    <section className="relative bg-gray-50 min-h-screen">
      {/** Sticky + scroll layot */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row">
        {/**Left - sticky image panel */}
        <div className="lg:w-1/2 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] flex items-center justify-center">
          <div className="relative w-full max-w-lg mx-auto">
            {/** Section header — now inside the sticky panel */}
            <div className="mb-8">
              <span className="text-sm font-semibold text-[#ef4501] uppercase tracking-widest">
                Check this out!
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-2">
                Grilled to <span className="text-[#ef4501]">perfection.</span>
              </h2>
            </div>

            {/**Image stack - crossfade between products */}
            <div className="relative z-10 aspect-square">
              {products.map((product, i) => (
                // Make the product container absolute inset-0 to stack to each, just adjust the opacity when scroll
                <div
                  key={product.id}
                  className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
                  style={{
                    opacity: i === activeIndex ? 1 : 0,
                    transform: i === activeIndex ? "scale(1)" : "scale(0.92)",
                  }}
                >
                  {/** Placeholder image frame */}
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-[#1a1a1a] flex items-center justify-center">
                    <object
                      data={product.image}
                      type="image/jpeg"
                      className="w-full h-full"
                      style={{ objectFit: "cover" }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <Flame size={56} className="text-[#ef4501] mb-3" />
                        <span className="text-gray-600 text-sm font-[550]">
                          No image found
                        </span>
                      </div>
                    </object>
                  </div>
                </div>
              ))}
            </div>

            {/** Dot indicator */}
            <div className="relative z-10 flex justify-center gap-2 mt-6">
              {Array.from({ length: products.length }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {setActiveIndex(i);  contentPanels.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });}}
                  className="transition-all duration-300 cursor-pointer"
                >
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: i === activeIndex ? "32px" : "8px",
                      opacity: i === activeIndex ? "1" : "0.25",
                      backgroundColor:
                        i === activeIndex ? "#ef4501" : "#1a1a1a",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/** Right - Scrolling content panels */}
        <div className="lg:w-1/2 lg:pl-16 py-10 lg:py-0">
          {products.map((product, i) => (
            <div
              key={product.id}
              ref={(el) => {
                contentPanels.current[i] = el;
              }}
              className="lg:h-screen flex flex-col justify-center py-20 lg:py-0"
            >
                  {/** Scroll hint — only shows when this panel is NOT the active one */}
                <div
                  className={`flex items-center gap-1.5 mb-3 transition-all duration-500 ${
                    i === activeIndex
                      ? "opacity-0 h-0 mb-0 overflow-hidden"
                      : "opacity-100 h-auto"
                  }`}
                >
                  <span className="text-md text-[#ef4501] font-medium uppercase tracking-widest">
                    ↑↓ Scroll to view the correct product details
                  </span>
                </div>
              <div
                className="transition-all duration-500"
                style={{
                  opacity: i === activeIndex ? 1 : 0.35,
                  transform:
                    i === activeIndex ? "translateX(0)" : "translateX(12px)",
                }}
              >
              
                {/** Tag */}
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${product.color}22`,
                    color: product.color,
                  }}
                >
                  <Star size={10} fill="currentColor" />
                  {product.tag}
                </span>

                {/** Title / price row */}
                <div className="flex items-baseline gap-4 mt-4">
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
                    {product.title}
                  </h3>
                  <span className="text-xl font-semibold text-[#ef4501]">
                    {product.price}
                  </span>
                </div>

                {/** Divider */}
                <div
                  className="w-10 h-0.5 rounded-full mt-4 mb-5 transition-colors duration-700"
                  style={{ backgroundColor: product.color }}
                />

                {/** Description */}
                <p className="text-gray-600 text-base lg:text-lg leading-relaxed max-w-md">
                  {product.description}
                </p>

                {/** Detail chips */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {product.details.map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      <ChefHat size={11} className="text-[#ef4501]" />
                      {d}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <button className="group relative overflow-hidden mt-8 bg-[#ef4501] text-white font-semibold px-7 py-3 rounded-full shadow-lg shadow-[#ef4501]/20 hover:shadow-[#ef4501]/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500" />
                  <span className="relative z-10">Add to Order</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StickyScrollProducts;
