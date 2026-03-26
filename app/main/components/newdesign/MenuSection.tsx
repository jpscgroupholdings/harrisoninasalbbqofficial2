"use client";

import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import Link from "next/link";

const MenuSection = () => {
  const MENU_ITEMS = [
    { label: "HARRISON SISIG", price: "₱190" },
    { label: "CHICKEN LEG", price: "₱190" },
    { label: "CHICKEN PECHO", price: "₱190" },
    { label: "PORK BBQ COMBO", price: "₱190" },
    { label: "CHICKEN WINGS COMBO", price: "₱190" },
    { label: "UBE TURON", price: "₱190" },
    { label: "LIEMPO", price: "₱190" },
  ];

  const menuUrl = useSubdomainPath("/", "food");

  return (
    <section id="menu" className="space-y-24 bg-brand-color-500">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Section */}
          <div className="order-2 lg:order-1 place-self-start w-full space-y-8">
            {/* Main Quote */}
            <blockquote className="">
              <p className="text-2xl sm:text-3xl lg:text-5xl font-serif italic font-semibold text-white leading-relaxed">
                Guests' Favourites
              </p>
              <div className="w-12 h-1 rounded-full bg-white" />
            </blockquote>

            {/* Description */}
            <div className="w-full space-y-6 text-white p-4 text-xl">
              {MENU_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="whitespace-nowrap">{item.label}</span>
                  <div className="flex-1 border-b border-dotted mx-2"></div>
                  <span className="whitespace-nowrap">{item.price}</span>
                </div>
              ))}
            </div>

            <Link
              href={menuUrl}
              className="w-full flex items-center justify-center text-brand-color-500 bg-white hover:text-brand-color-600 font-bold rounded-lg py-2.5 text-xl"
            >
              Explore Our Menu
            </Link>
          </div>

          {/* Image Section */}
          <div className="relative group order-1 lg:order-2">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src="/images/harrison_homecoming.png"
                alt="Harrison's Grilled Filipino Favorites"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
