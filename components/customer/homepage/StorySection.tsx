"use client";

import React, { useEffect, useState } from "react";
import { Flame, Heart, Users, Award } from "lucide-react";
import { useScrollToSection } from "@/hooks/utils/useScrollToSection";

const StorySection: React.FC = () => {
  useScrollToSection();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    const section = document.getElementById("story-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const pillars = [
    {
      icon: Flame,
      title: "Authenticity",
      description:
        "Traditional recipes passed down through generations, cooked the way lola taught us.",
    },
    {
      icon: Heart,
      title: "Quality",
      description:
        "Fresh ingredients, premium cuts, and the perfect blend of spices in every dish.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "More than a restaurant – a place where families and friends create memories.",
    },
  ];

  return (
    <section
      id="story-section"
      className="py-16 lg:py-24 bg-linear-to-b from-gray-50 to-white relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Content */}
          <div
            className={`transform transition-all duration-700 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-10 opacity-0"
            }`}
          >
            <span className="inline-block text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Our Story
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#ef4501] mt-2 mb-2">
              Why Harrison?
            </h2>
            {/* Accent line */}
            <div className="w-10 h-0.5 bg-[#ef4501] rounded-full mb-6" />

            <div className="space-y-4 text-gray-500 leading-relaxed">
              <p>
                <span className="text-[#1a1a1a] font-semibold italic">
                  "Every bite has a story"
                </span>{" "}
                – this isn't just our tagline, it's our promise. Every bite of
                our inasal and BBQ carries the warmth of Filipino hospitality,
                the joy of shared meals, and the stories that make us who we
                are.
              </p>
              <p>
                Harrison started from a simple dream: to bring authentic Visayan
                grilling to every Filipino table. Named after the street where
                our founder grew up in Bacolod, every dish we serve is a tribute
                to the flavors of home.
              </p>
              <p>
                From the smoky char of our chicken inasal to the sweet glaze of
                our pork BBQ, we use only the freshest ingredients and
                time-honored recipes. Because at Harrison, we don't just serve
                food –{" "}
                <span className="text-[#ef4501] font-semibold">
                  we serve memories.
                </span>
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { value: "10+", label: "Years of Grilling" },
                { value: "50K+", label: "Happy Customers" },
                { value: "4.9", label: "Average Rating" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm"
                >
                  <div className="text-2xl lg:text-3xl font-bold text-[#ef4501]">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars */}
          <div
            className={`transform transition-all duration-700 delay-200 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-10 opacity-0"
            }`}
          >
            <div className="space-y-3">
              {pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className={`group relative bg-white border border-gray-200 rounded-xl p-5 
                shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300
                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
              `}
                  style={{
                    transitionDelay: isVisible ? `${index * 80}ms` : "0ms",
                  }}
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-[#ef4501] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-[#ef4501]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#ef4501]/20 transition-colors duration-300">
                      <pillar.icon className="text-[#ef4501]" size={22} />
                    </div>
                    <div>
                      <h3 className="text-[#1a1a1a] font-semibold text-base mb-0.5">
                        {pillar.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-snug">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
