'use client'

import { animationStyle } from '@/helper/animationStyle';
import { useIntersectionAnimation, useIntersectionAnimationList } from '@/hooks/utils/useIntersectionAnimation';
import { getLucideIcon } from '@/lib/iconUtils';
import React from 'react'

const HowToFranchise = () => {

      // Franchise steps
  const franchiseSteps = [
    {
      icon: "Send",
      title: "Inquiry",
      description:
        "Submit your franchise application and express your interest in joining the Harrison House of Inasal & BBQ family.",
    },
    {
      icon: "NotebookPen",
      title: "Evaluation",
      description:
        "Our team reviews your application, conducts interviews, and assesses location viability.",
    },
    {
      icon: "BicepsFlexed",
      title: "Setup & Training",
      description:
        "Complete comprehensive training on operations, food preparation, and customer service.",
    },
    {
      icon: "Rocket",
      title: "Opening",
      description:
        "Launch your branch with full support from our team and start serving authentic Filipino BBQ.",
    },
  ];

  const {ref: franchiseRef, isVisible} = useIntersectionAnimation();
  const {ref: ctaRef, isVisible: isCTAVisible} = useIntersectionAnimation();
  const {itemRefs: pillarRefs, visibleItems: visiblePillars} = useIntersectionAnimationList(franchiseSteps.length);

  return (
      <section id="franchise-section" className="pb-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div ref={franchiseRef} className={`text-center mb-16 ${animationStyle(isVisible).className}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              HOW TO FRANCHISE
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join the Harrison House of Inasal & BBQ family and bring authentic
              Filipino BBQ to your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {franchiseSteps.map((item, index) => {
              const Icon = getLucideIcon(item.icon);
              return (
                <div
                  key={item.title}
                  ref={(el) => {pillarRefs.current[index] = el;}}
                  className={`bg-gray-50 p-6 border border-gray-200 ${animationStyle(visiblePillars[index]).className}`}
                  style={animationStyle(visiblePillars[index]).style}
                >
                  <div className="w-12 h-12 bg-brand-color-500 text-white flex items-center justify-center font-bold text-xl mb-4">
                    <Icon />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div ref={ctaRef} className={`text-center ${animationStyle(isCTAVisible).className}`}>
            <p className="text-gray-600 mb-6">
              Ready to start your franchise journey? Contact us at{" "}
              <a
                href="mailto:franchise@harrisonmanginasal.com"
                className="text-brand-color-500 font-medium hover:underline"
              >
                franchise@harrisonmanginasal.com
              </a>
            </p>
            <a
              href="mailto:franchise@harrisonmanginasal.com?subject=Franchise%20Application"
              className="inline-block bg-brand-color-500 text-white px-8 py-4 font-bold text-lg hover:bg-[#b83200] transition-colors"
            >
              Apply for Franchise
            </a>
          </div>
        </div>
      </section>
  )
}

export default HowToFranchise
