"use client";

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
    <div className="max-w-7xl bg-white px-4 sm:px-6 lg:px-8 mx-auto font-sans my-10">
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
      </div>
    </div>
  );
}
