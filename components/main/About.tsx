"use client";

import { animationStyle } from "@/helper/animationStyle";
import {
  useIntersectionAnimation,
  useIntersectionAnimationList,
} from "@/hooks/utils/useIntersectionAnimation";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import { getLucideIcon } from "@/lib/iconUtils";

const About = () => {
  useScrollToSection();

  const brandPillar = [
    {
      icon: "Flame",
      title: "Charcoal-Grilled",
      description:
        "We use traditional charcoal grilling methods to achieve that authentic smoky flavor in every dish.",
    },
    {
      icon: "ChefHat",
      title: "Filipino Authentic",
      description:
        "Our recipes stay true to traditional Filipino flavors, passed down and perfected over generations.",
    },
    {
      icon: "CircleCheck",
      title: "Quality Guaranteed",
      description:
        "We maintain strict quality standards from sourcing to serving, ensuring consistency in every meal.",
    },
  ];

  const { ref: brandRef, isVisible } = useIntersectionAnimation();
  const { itemRefs: brandRefPillar, visibleItems } =
    useIntersectionAnimationList(brandPillar.length);

  return (
    <>
      <section id="about-section" className="max-w-7xl mx-auto py-0 md:py-10">
        <div className="">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div ref={brandRef} className={animationStyle(isVisible).className}>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-color-500 mb-6">
                Brand Story
              </h2>
              <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
                <p>
                  Everyone has that one brother who runs the grill at every
                  gathering — steady hand, serious tongs, always cracking jokes.
                  That's Harrison.
                </p>
                <p>
                  He's not the loudest in the family, but he's the one people
                  gather around. Over the years, his inihaw became legend among
                  friends and neighbors — not because it was fancy, but because
                  it was exactly what you needed, when you needed it.
                </p>
                <p>
                  "You should open a place, Harrison," he finally did. Now, he's
                  grilling for everyone. Still with the same care. Still doing
                  the first flip.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {brandPillar.map(({ icon, title, description }, i) => {
                const Icon = getLucideIcon(icon);

                return (
                  <div
                    key={i}
                    ref={(el) => {
                      brandRefPillar.current[i] = el;
                    }}
                    className={`flex items-center gap-4 bg-white p-3 border border-gray-200 ${animationStyle(visibleItems[i]).className}`}
                    style={animationStyle(visibleItems[i]).style}
                  >
                    <div className="shrink-0 w-12 h-12 bg-brand-color-500 flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
