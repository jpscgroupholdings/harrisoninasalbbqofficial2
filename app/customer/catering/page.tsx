"use client";

import BrandLogo from "@/components/BrandLogo";
import EventForm from "@/components/EventForm";
import { Building, Cake, Handshake, PartyPopper, User, Users, VenetianMask } from "lucide-react";

export default function CateringPage() {
  return (
    <div className="bg-white">

      {/* HERO SECTION */}
      <section className="relative h-130 overflow-hidden">
        {/* Unsplash party/celebration image */}
        <img
          src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1600&q=80"
          alt="Celebration party"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ filter: "brightness(0.55) saturate(1.1)" }}
        />

        {/* Warm linear overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

    

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <div className="mb-4">
              <BrandLogo />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
          >
            Celebrate With <br className="hidden md:block" />
            <span className="text-brand-color-500">Unforgettable Flavors</span>
          </h1>
          <p className="max-w-xl text-gray-200 text-lg leading-relaxed">
            Let our grilled specialties and signature party trays make your
            special moments truly memorable.
          </p>
          <a
            href="#booking"
            className="mt-8 inline-block bg-brand-color-600 hover:bg-brand-color-700 text-white font-semibold px-8 py-3 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Book Your Event →
          </a>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-brand-color-600 text-xs font-bold tracking-widest uppercase">
            What We Cater
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            Planning a Celebration?
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            We bring the warmth, taste, and spirit of Filipino hospitality to
            every gathering — big or small.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: <Cake />, label: "Birthdays" },
            { icon: <Building />, label: "Corporate Events" },
            { icon: <Users />, label: "Family Gatherings" },
            { icon: <PartyPopper />, label: "Parties & Celebrations" },
            { icon: <Handshake />, label: "Reunions" },
            { icon: <VenetianMask />, label: "Special Occasions" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-white border border-brand-color-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-color-300 transition-all"
            >
              <span className="text-2xl text-gray-700">{icon}</span>
              <span className="text-gray-700 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-brand-color-400 text-xs font-bold tracking-widest uppercase">
              Moments We've Made Special
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
              Event Highlights
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl h-72">
              <img
                src="https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=900&q=80"
                alt="Party celebration"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-4 left-5 text-white font-semibold text-sm tracking-wide">
                🎉 Birthday Celebrations
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl h-72">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"
                alt="Catering spread"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-4 left-5 text-white font-semibold text-sm tracking-wide">
                🍖 Full Catering Spreads
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl h-56">
              <img
                src="https://images.unsplash.com/photo-1519671282429-b44660ead0a7?w=600&q=80"
                alt="Corporate event"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-4 left-5 text-white font-semibold text-sm tracking-wide">
                🏢 Corporate Events
              </span>
            </div>

            <div className="md:col-span-2 relative overflow-hidden rounded-2xl h-56">
              <img
                src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&q=80"
                alt="Group celebration"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-4 left-5 text-white font-semibold text-sm tracking-wide">
                👨‍👩‍👧‍👦 Family & Group Gatherings
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section id="booking" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <span className="text-red-600 text-xs font-bold tracking-widest uppercase">
            Get In Touch
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            Request Event Booking
          </h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">
            Fill out the form below and our team will reach out with all the
            details to make your event a success.
          </p>
        </div>

        <EventForm />
      </section>
    </div>
  );
}