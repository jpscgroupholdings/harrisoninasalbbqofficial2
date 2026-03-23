'use client'

import { animationStyle } from "@/helper/animationStyle";
import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import { useIntersectionAnimation } from "@/hooks/utils/useIntersectionAnimation";
import Link from "next/link";

const CTA = () => {
      const orderUrl = useSubdomainPath("/", "food");
    const {ref: ctaRef, isVisible: isCTAVisible} = useIntersectionAnimation();
  return (
    <section
      ref={ctaRef}
      className={`py-20 px-4 bg-brand-color-500/90 ${animationStyle(isCTAVisible).className}`}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Craving something grilled and comforting?
        </h2>
        <p className="text-xl text-white/90 mb-10">
          Come by, order your favorites, and make it a meal worth sharing.
        </p>
        <Link
          href={orderUrl}
          className="w-48 h-14 py-4 px-6 bg-white text-brand-color-500 hover:text-brand-color-600 font-bold text-2xl hover:bg-gray-100 transition-colors"
        >
          Order Now
        </Link>
      </div>
    </section>
  );
};

export default CTA;
