"use client";

import About from "./About";
import {
  useIntersectionAnimation,
  useIntersectionAnimationList,
} from "@/hooks/utils/useIntersectionAnimation";
import { animationStyle } from "@/helper/animationStyle";
import Image from "next/image";

// ── What We Bring data ───────────────────────────────────────────────────────
const tablePillars = [
  {
    number: "01",
    audience: "For Diners",
    headline: "Comfort food with character.",
    body: "We serve everyday grilled favorites that feel like they came from your own family's ihawan — only better timed, better marinated, and always with care.",
  },
  {
    number: "02",
    audience: "For Families & Communities",
    headline: "Warmth and welcome, for every generation.",
    body: "From grandparents to grandkids, Harrison is everyone's favorite — with kid-friendly meals, comfort classics, and a place that feels like home. Perfect for reunions, kwentuhan, and everyday bonding.",
  },
  {
    number: "03",
    audience: "For Franchise Partners",
    headline: "Character-first, story-strong, brand-ready.",
    body: "With a clear identity, loyal following, and scalable story, Harrison offers a differentiated position in the inasal/BBQ space with emotional staying power.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function MissionVision() {
  const { ref: missionvisionRef, isVisible: isMissionVisionVisible } =
    useIntersectionAnimation();

  // "What We Bring" section
  const { ref: bringHeaderRef, isVisible: isBringHeaderVisible } =
    useIntersectionAnimation();
  const { itemRefs: pillarRefs, visibleItems: visiblePillars } =
    useIntersectionAnimationList<HTMLDivElement>(tablePillars.length);

  const fade = animationStyle; // alias for brevity

  return (
    <div className="max-w-7xl bg-white px-4 sm:px-6 lg:px-8 mx-auto font-sans mt-0 lg:mt-10">
      <div className="mx-auto space-y-12">
        <section
          ref={missionvisionRef}
          className={`${animationStyle(isMissionVisionVisible).className}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col md:flex-row lg:flex-col">
              {/** Mission */}
              <div className="flex-1 flex flex-col justify-center py-10 border-b border-stone-200">
                <p className="text-xs tracking-widest text-brand-color-500 uppercase mb-4">
                  Our Purpose
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Mission
                </h2>
                <p className="text-base leading-relaxed text-stone-500 max-w-sm">
                  To serve proudly Filipino grilled food that brings people
                  together — always marinated with care, grilled to perfection,
                  and served with a smile as warm as Harrison himself.
                </p>
              </div>
              {/** Vision */}
              <div className="flex-1 flex flex-col justify-center py-20">
                <p className="text-xs tracking-widest text-brand-color-500 uppercase mb-4">
                  Our Future
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Vision</h2>
                <p className="text-base leading-relaxed text-stone-500 max-w-sm">
                  To become the Philippines' most loved inasal and BBQ
                  destination, known for its homey flavor, genuine hospitality,
                  and the everyday joy that comes with being welcomed to
                  Harrison's table.
                </p>
              </div>
            </div>
            <div className="relative w-full h-75 md:h-100 lg:h-auto">
              <Image
                src="/images/mission-vission-banner.jpg"
                alt=""
                fill
                className="object-cover lg:sticky lg:top-0"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </section>

        {/* About the company */}
        <About />

        {/* ── WHAT WE BRING TO THE TABLE ───────────────────────────────────── */}
        <section className="space-y-12">
          {/* Header with image */}
          <div
            ref={bringHeaderRef}
            className={`relative overflow-hidden rounded-3xl h-64 lg:h-72 ${fade(isBringHeaderVisible).className}`}
            style={fade(isBringHeaderVisible).style}
          >
            <img
              src="/images/grilled.jpg"
              alt="Harrison's table spread"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-stone-900/80 via-stone-900/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-16 space-y-2">
              <p className="text-brand-color-500 font-bold tracking-[0.2em] uppercase text-sm">
                For Everyone
              </p>
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                What We Bring
                <br />
                to the Table
              </h2>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid lg:grid-cols-3 gap-6">
            {tablePillars.map((p, i) => (
              <div
                key={i}
                ref={(el) => {
                  pillarRefs.current[i] = el;
                }}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${fade(visiblePillars[i], i * 120).className}`}
                style={fade(visiblePillars[i], i * 120).style}
              >
                <div className="p-8 space-y-4">
                  <p className="text-5xl font-black text-brand-brown-100">
                    {p.number}
                  </p>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1 text-brand-color-500">
                      {p.audience}
                    </p>
                    <h3 className="text-brand-brown-800 font-black text-xl leading-tight">
                      {p.headline}
                    </h3>
                  </div>
                  <p className="text-brand-brown-600 text-base leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
