import { getLucideIcon } from "@/lib/iconUtils";
import React from "react";

const OurAdvantage = () => {
  const advantageList = [
    {
      icon: "Zap",
      name: "Strong Brand Recognition",
      description:
        "Leverage the power of an established name that customers trust.",
    },
    {
      icon: "BookOpen",
      name: "Comprehensive Training & Support",
      description:
        "From onboarding to daily operations, we guide you every step of the way.",
    },
    {
      icon: "ChartLine",
      name: "Marketing & Growth Support",
      description:
        "Access ready-to-use marketing strategies that drive real results.",
    },
    {
      icon: "MapPin",
      name: "Scalable Opportunity",
      description:
        "Expand your business with multiple locations and maximize your earning potential.",
    },
  ];

  return (
    <div
      id="our-advantages"
      className="bg-linear-to-b from-slate-950 to-black text-white py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-20">
          <div className="flex flex-col items-center gap-6 mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center text-white">
              A Proven Business Model
            </h1>
            <div className="w-20 h-1 bg-brand-color-500 rounded-full" />
          </div>
          <p className="max-w-3xl mx-auto text-center text-lg sm:text-xl text-gray-300 leading-relaxed">
            Step into a system that’s already tested and optimized for success.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {advantageList.map((item, index) => {
            const Icon = getLucideIcon(item.icon);

            return (
              <div
                key={index}
                className="relative bg-linear-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:bg-linear-to-br hover:from-slate-800/70 hover:to-slate-900/70"
              >
                {/* Icon Container */}
                <div className="p-4 rounded-xl">
                  <Icon
                    size={48}
                    className="text-brand-color-500"
                    strokeWidth={1.5}
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center">
                  {item.name}
                </h3>

                {/* Description */}
                <p className="text-center text-base sm:text-lg text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OurAdvantage;
