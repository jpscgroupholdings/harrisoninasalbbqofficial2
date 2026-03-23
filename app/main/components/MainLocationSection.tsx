'use client';

import { LINKS } from "@/constant/links";
import { animationStyle } from "@/helper/animationStyle";
import { useIntersectionAnimation, useIntersectionAnimationList } from "@/hooks/utils/useIntersectionAnimation";
import { MapPin } from "lucide-react";

const MainLocationSection = () => {
  // Locations data
  const locations = [
    {
      id: 1,
      name: "Harrison Main Branch",
      address: "G/F Kalayaan Ave, Makati City, Metro Manila",
      mapUrl: LINKS.MAIN_BRANCH_LINK,
    },
    {
      id: 2,
      name: `King's Court`,
      address: `5/F King's Court Building 2, 2129 Chino Roces Avenue, Brgy Pio del Pilar, Makati City, Metro Manila`,
      mapUrl: LINKS.KINGS_COURT_LINK,
    },
  ];

  const {ref: locationRef, isVisible} = useIntersectionAnimation();
  const {itemRefs: mapRef, visibleItems} = useIntersectionAnimationList(locations.length);

  return (
    <>
      <section id="locations-section" className="py-20 px-4 bg-white w-full">
        <div className="max-w-7xl mx-auto">
          <div ref={locationRef} className={`text-center mb-16 ${animationStyle(isVisible).className}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              OUR LOCATIONS
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find a Harrison House of Inasal & BBQ branch near you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location, index) => (
              <div
                key={index}
                ref={(el) => {mapRef.current[index] =  el;}}
                className={`bg-white p-6 border border-gray-200 ${animationStyle(visibleItems[index]).className}`}
                style={animationStyle(visibleItems[index]).style}
              >
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-brand-color-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {location.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{location.address}</p>
                  </div>
                </div>
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gray-100 text-gray-800 py-2 font-medium text-center hover:bg-gray-200 transition-colors"
                >
                  View on Map
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default MainLocationSection;
