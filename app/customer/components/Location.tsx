"use client";

import { useState, useRef } from "react";
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  Utensils,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { LINKS } from "@/constant/links";

const LocationsSection = () => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);

  const locations = [
    {
      id: 1,
      name: "King's Court",
      status: "open",
      hours: "10:00 AM - 10:00 PM",
      foodType: "Grill Fried Up",
      city: "Makati City",
      address: "TVS SCS Philippines Corporation",
      fullAddress:
        "5/F King's Court Building 2, 2129 Chino Roces Avenue, Brgy Pio del Pilar, Makati City, Metro Manila",
      phone: "+63 2 8765 4321",
      mapLink: "https://maps.app.goo.gl/iKy7TX6hLx6XnooH9",
      coordinates: { lat: 14.5547, lng: 121.0244 },
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7267539!2d121.0134854!3d14.5576121!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90c5888257f:0xf5a4b1009273b664!2sKings%20Court%20Building%201!5e0!3m2!1sen!2sph!4v1234567890!5m2!1sen!2sph",
      description:
        "Our newest branch now open! Come visit us and taste the tradition at King's Court.",
      isNew: true,
    },
    {
      id: 2,
      name: "Century City Mall",
      status: "open",
      hours: "10:00 AM - 12:00 AM",
      foodType: "Grill Fried Up",
      city: "Makati City",
      address: "Century City Mall, Kalayaan Ave, Poblacion",
      fullAddress: "G/F Kalayaan Ave, Makati City, Metro Manila",
      phone: "+63 2 1234 5678",
      mapLink: "https://maps.app.goo.gl/izGJTfTXctnDjc6q9",
      coordinates: { lat: 14.5648, lng: 121.0509 },
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.587323602867!2d121.0278133!3d14.565576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9006ced35e7%3A0xf8984118b68af276!2sHarrison%20House%20of%20Inasal%20%26%20bbq!5e0!3m2!1sen!2sph!4v1769667586148!5m2!1sen!2sph",
      description:
        "Experience authentic Filipino grilled favorites at our flagship location in Century City Mall.",
    },
  ];

  const total = locations.length;

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

  function DeliveryButton({
    label = "Logo",
    href = "/",
    imgSrc = "/images/harrison_logo.png",
    bgColor = "bg-white",
    imgSize = "h-12 w-12",
    hoverTextColor = "group-hover:text-gray-900",
  }) {
    return (
      <button
        onClick={() => window.open(href, "_blank")}
        className="group flex flex-col items-center gap-3 transition-all hover:scale-105"
      >
        <div
          className={`h-20 w-20 rounded-full overflow-hidden flex items-center justify-center shadow-sm ${bgColor}`}
        >
          <img
            src={imgSrc}
            alt={label}
            className={`object-contain ${imgSize}`}
          />
        </div>
        <span
          className={`font-semibold text-gray-800 transition ${hoverTextColor}`}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <section
      id="location-section"
      className="w-full bg-linear-to-b from-white to-gray-50 py-16 lg:pt-24"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-brand-color-500/10 text-brand-color-500 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            Our Locations
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find Us in Makati
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
              {locations.map((location) => (
                <div key={location.id} className="min-w-full px-2">
                  <div className="grid lg:grid-cols-2 gap-8 items-center py-8">
                    {/* Map */}
                    <div className="relative">
                      <div className="relative h-112.5 rounded-2xl overflow-hidden shadow-xl border border-gray-200 group">
                        <iframe
                          src={location.embedUrl}
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
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-linear-to-br from-brand-color-500 to-[#ff4500] rounded-lg flex items-center justify-center shadow-lg p-1">
                                <img
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
                                  {location.isNew && (
                                    <span className="bg-linear-to-r from-brand-color-500 to-[#ff4500] text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                      NEW
                                    </span>
                                  )}
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
                    </div>

                    {/* Details */}
                    <div className="flex flex-col space-y-6">
                      {/* Status Badge */}
                      <div className="inline-flex items-center gap-2 rounded-xl shadow-md border border-gray-200 w-fit py-2 px-4 bg-white">
                        <div className="relative flex items-center">
                          <span className="flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-green-600">
                          {location.status === "open"
                            ? "Open Now"
                            : "Opening Soon"}
                        </p>
                        {location.isNew && (
                          <span className="bg-linear-to-r from-brand-color-500 to-[#ff4500] text-white text-xs font-bold px-2 py-1 rounded-full ml-1">
                            NOW OPEN!
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-3">
                        <h3 className="text-4xl lg:text-5xl leading-tight font-bold text-gray-900">
                          {location.name}
                        </h3>
                        <p className="text-gray-600 text-base leading-relaxed">
                          {location.description}
                        </p>
                      </div>

                      {/* Location Details */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-4 group">
                          <div className="shrink-0 w-10 h-10 bg-brand-color-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-color-500 transition-colors">
                            <MapPin
                              size={20}
                              className="text-brand-color-500 group-hover:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">
                              Address
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {location.address}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {location.fullAddress}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                          <div className="shrink-0 w-10 h-10 bg-brand-color-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-color-500 transition-colors">
                            <Clock
                              size={20}
                              className="text-brand-color-500 group-hover:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">
                              Operating Hours
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {location.hours}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                          <div className="shrink-0 w-10 h-10 bg-brand-color-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-color-500 transition-colors">
                            <Utensils
                              size={20}
                              className="text-brand-color-500 group-hover:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">
                              Cuisine
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {location.foodType}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                          <div className="shrink-0 w-10 h-10 bg-brand-color-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-color-500 transition-colors">
                            <Phone
                              size={20}
                              className="text-brand-color-500 group-hover:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">
                              Contact
                            </p>
                            <a
                              href={`tel:${location.phone}`}
                              className="text-gray-900 font-semibold hover:text-brand-color-500 transition-colors"
                            >
                              {location.phone}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="pt-4 mx-auto">
                        <a
                          href={location.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-[#c13500] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                        >
                          <Navigation
                            size={20}
                            className="group-hover:rotate-45 transition-transform duration-300"
                          />
                          Get Directions
                          <ChevronRight
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
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:border-brand-color-500 hover:text-brand-color-500 transition-colors"
            aria-label="Previous location"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:border-brand-color-500 hover:text-brand-color-500 transition-colors"
            aria-label="Next location"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots + Counter */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex gap-2">
            {locations.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-brand-color-500"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to location ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      {/* <div className="mt-16 p-16 text-center w-full border-t border-gray-300">
        <h3 className="text-3xl font-bold text-gray-900 mb-3">
          Can't visit us? We deliver to your doorstep!
        </h3>
        <p className="text-gray-600 mb-8 text-lg">
          Order your favorite Harrison's dishes directly or through trusted
          delivery platforms.
        </p>
        <div className="flex flex-wrap justify-center gap-10">
          <DeliveryButton
            label="Harrison's Menu"
            href={LINKS.MENU}
            imgSrc="/images/harrison_logo.png"
            bgColor="bg-brand-color-500"
            imgSize="h-14 w-14"
            hoverTextColor="group-hover:text-brand-color-500"
          />
          <DeliveryButton
            label="Grab"
            href={LINKS.GRAB}
            imgSrc="/images/grab.jpg"
            bgColor="bg-[#009B3D]"
            imgSize="h-12 w-12 scale-170"
            hoverTextColor="group-hover:text-green-600"
          />
          <DeliveryButton
            label="Foodpanda"
            href={LINKS.FOODPANDA}
            imgSrc="/images/foodpanda.png"
            bgColor="bg-[#D6005F]"
            imgSize="h-12 w-12 scale-150"
            hoverTextColor="group-hover:text-pink-600"
          />
        </div>
      </div> */}
    </section>
  );
};

export default LocationsSection;