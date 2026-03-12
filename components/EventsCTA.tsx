"use client";

import Link from "next/link";

export default function EventsCTA() {
  return (
    <section className="relative overflow-hidden bg-gray-950 py-20 px-6">

      {/* Background image with dark overlay */}
      <img
        src="https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1600&q=80"
        alt="Party celebration"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        style={{ objectPosition: "center 40%" }}
      />

      {/* Content */}
      <div className="relative max-w-4xl mx-auto text-center">

        {/* Eyebrow */}
        <span className="inline-block text-brand-color-500 text-xs font-bold tracking-[0.3em] uppercase mb-5">
          Special Events & Catering
        </span>

        {/* Headline */}
        <h2
          className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Got a Celebration <br className="hidden md:block" />
          <span className="text-brand-color-500">Coming Up?</span>
        </h2>

        {/* Subtext */}
        <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed mb-10">
          From birthdays to corporate events, let{" "}
          <span className="text-white font-semibold">Harrison House Inasal & BBQ</span>{" "}
          bring our grilled specialties and Filipino warmth to your table.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            "🎂 Birthdays",
            "🏢 Corporate Events",
            "👨‍👩‍👧‍👦 Family Gatherings",
            "🤝 Reunions",
          ].map((item) => (
            <span
              key={item}
              className="bg-white/10 border border-white/15 text-gray-200 text-sm px-4 py-1.5 rounded-full backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/events#booking"
            className="group inline-flex items-center gap-2 bg-brand-color-600 hover:bg-brand-color-700 active:bg-brand-color-800 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-brand-color-900/40 hover:shadow-xl hover:shadow-brand-color-900/50 hover:-translate-y-0.5"
          >
            Book Your Event
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <a
            href="viber://chat?number=%2B639603349533"
            className="inline-flex items-center gap-2 bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/5 text-white font-semibold px-8 py-4 rounded-full transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 0C5.5.2.8 5 .8 10.9c0 2.4.8 4.6 2 6.4L.8 24l7-2c1.7.9 3.6 1.4 5.6 1.4 5.9 0 10.7-4.8 10.7-10.7S17.3 0 11.4 0zm5.7 15.5c-.3.8-1.5 1.5-2.1 1.6-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-1.9 1-2.2.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.4-.1.1-.3.3-.4.4-.1.1-.2.2-.1.4.5.8 1.1 1.5 1.7 2.1.7.7 1.5 1.2 2.4 1.5.2.1.4.1.5-.1.1-.2.6-.7.8-.9.2-.2.4-.2.6-.1.2.1 1.4.7 1.7.8.2.1.4.2.5.3 0 .2 0 .8-.3 1.6z" />
            </svg>
            Ask on Viber
          </a>
        </div>
      </div>
    </section>
  );
}