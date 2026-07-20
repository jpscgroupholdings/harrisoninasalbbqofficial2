"use client";

import { useState, useRef } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useBranches } from "@/hooks/api/useBranch";
import { buildEmbedUrl, buildMapLink } from "@/lib/google-maps";
import { IconButton } from "./ui/buttons";
import { AppImage } from "./AppImage";

const LocationsSection = () => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);

  const { data: branches = [] } = useBranches();

  const total = branches?.length ?? 0;

  const goTo = (index: number) => {
    setCurrent((index + total) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  };

  return (
    <section
      id="location-section"
      className="w-full bg-linear-to-b from-white to-gray-50 py-16 lg:pt-24"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-2">
          <span className="inline-block bg-brand-color-500/10 text-brand-color-500 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            Our Locations
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find Us in
          </h2>
          <h2 className="text-brand-color-500 text-2xl mb-4">
            (Makati - Paranaque - Santolan)
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Visit our branches and experience authentic Filipino grilled
            favorites. Choose your nearest location below.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-7xl mx-auto">
          {/* Track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {branches?.map((location) => (
                <div key={location._id} className="min-w-full px-2">
                  <div className="items-center py-8">
                    {/* Map */}
                    <div className="relative">
                      <div className="relative h-112.5 rounded-2xl overflow-hidden shadow-xl border border-gray-200 group">
                        <iframe
                          src={buildEmbedUrl(
                            location.location.coordinates[1],
                            location.location.coordinates[0],
                          )}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="grayscale-[0.2] contrast-[1.1] transition-all duration-300 group-hover:grayscale-0"
                        />

                        {/* Info Card Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="bg-white rounded-xl shadow-2xl p-5 border-2 border-brand-color-500/20 transform transition-all duration-300 hover:scale-105 pointer-events-auto">
                            {/* Opening Soon Badge */}
                            {location.openingSoon && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 bg-amber-900 rounded-full animate-pulse" />
                                  Opening Soon
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-linear-to-br from-brand-color-500 to-[#ff4500] rounded-lg flex items-center justify-center shadow-lg p-1">
                                <AppImage
                                  src="/images/harrison_logo.png"
                                  alt="Harrison's Logo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-900 text-base">
                                    Harrison's Inasal
                                  </h3>
                                </div>
                                <p className="text-gray-700 font-semibold text-sm mb-1">
                                  {location.name}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {location.address}
                                </p>
                              </div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                              <div className="relative">
                                <div className="w-8 h-8 bg-brand-color-500 rounded-full border-4 border-white shadow-lg" />
                                <div className="absolute inset-0 w-8 h-8 bg-brand-color-500 rounded-full animate-ping opacity-50" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-12 border-t-brand-color-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pt-4 mx-auto">
                        <a
                          href={buildMapLink(
                            location.location.coordinates[1],
                            location.location.coordinates[0],
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-[#c13500] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                        >
                          <DynamicIcon
                            name="Navigation"
                            size={20}
                            className="group-hover:rotate-45 transition-transform duration-300"
                          />
                          Get Directions
                          <DynamicIcon
                            name="ChevronRight"
                            size={20}
                            className="group-hover:translate-x-1 transition-transform duration-300"
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next Arrows */}
          <IconButton
            onClick={() => goTo(current - 1)}
            aria-label="Previous location"
            icon={{ name: "ChevronLeft", size: 20 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
            variant="secondary"
          />

          <IconButton
            onClick={() => goTo(current + 1)}
            aria-label="Next location"
            icon={{ name: "ChevronRight", size: 20 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
          />
        </div>

        {/* Dots + Counter */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex gap-2">
            {branches?.map((branch, i) => (
              <IconButton
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to ${branch.name}`}
                data-tooltip-id="app-tooltip"
                data-tooltip-content={branch.name}
                variant={i === current ? "primary" : "secondary"}
                className={`mx-px h-2 p-1 rounded-full ${i === current ? "w-8" : "w-4 border border-gray-200"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {current + 1} / {total}
          </span>
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
