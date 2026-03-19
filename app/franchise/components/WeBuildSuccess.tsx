"use client";

import { getLucideIcon } from "@/lib/iconUtils";
import React from "react";

const WeBuildSuccessTogether = () => {
  const supportFeatures = [
    {
      icon: "Crown",
      title: "Brand Usage",
      description: "Leverage a growing, trusted name.",
    },
    {
      icon: "Briefcase",
      title: "Turnkey Systems",
      description: "Full Operations Manuals & Standard Procedures.",
    },
    {
      icon: "Users",
      title: "Expert Training",
      description: "Comprehensive staff training.",
    },
    {
      icon: "Package",
      title: "Setup & Sourcing",
      description: "Store design guidance and supplier networks.",
    },
    {
      icon: "Megaphone",
      title: "Marketing Power",
      description: "Launch assistance and brand marketing.",
    },
    {
      icon: "Heart",
      title: "Ongoing Support",
      description: "Dedicated business consultants.",
    },
  ];

  const journeySteps = [
    {
      number: "1",
      title: "Inquire",
      description: "Submit your initial application and express your interest.",
    },
    {
      number: "2",
      title: "Consult",
      description: "Discuss business goals and select your preferred franchise tier.",
    },
    {
      number: "3",
      title: "Evaluate",
      description: "Corporate team conducts site visit and territory approval.",
    },
    {
      number: "4",
      title: "Commit",
      description: "Franchise agreement signing and fee payment completed.",
    },
    {
      number: "5",
      title: "Build & Train",
      description: "Store construction begins alongside rigorous staff training.",
    },
    {
      number: "6",
      title: "Launch!",
      description: "Grand opening with full corporate marketing support.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Main Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - We Build Success Together */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-8">
                We Build Success Together
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-12">
                Your investment is fully backed by our dedicated corporate team. We provide
                comprehensive franchise support to ensure smooth operations and long-term
                profitability.
              </p>

              {/* Support Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {supportFeatures.map((feature, index) => {
                  const Icon = getLucideIcon(feature.icon);

                  return (
                    <div
                      key={index}
                      className="bg-orange-50/50 border border-orange-100 rounded-xl p-6 hover:bg-orange-50 transition-colors duration-300"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <Icon className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                        <h3 className="text-lg font-bold text-slate-900">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Journey Timeline */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">
                Your Journey to Grand Opening
              </h2>

              <div className="space-y-6">
                {journeySteps.map((step, index) => (
                  <div key={index} className="flex gap-6">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-lg mb-2">
                        {step.number}
                      </div>
                      {index !== journeySteps.length - 1 && (
                        <div className="w-0.5 h-16 bg-gradient-to-b from-orange-500 to-orange-200"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-1 pb-6">
                      <h3 className="text-lg font-bold text-orange-500 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer Section */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Ready to Fire Up Your Future?
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed">
            Join the Harrisons House of Inasal and BBQ family today. The proven demand for
            Filipino comfort food meets ultimate business flexibility.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 sm:px-10 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-1">
              Apply for Franchise
            </button>
            <button className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold rounded-full transition-all duration-300">
              Download Full PDF Deck
            </button>
          </div>
        </div>
      </div>

      {/* Footer Contact */}
      <div className="bg-slate-900 text-gray-400 py-6 px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>Contact Us: franchise@harrisonsbbq.com | +63 (87) XXX XXX</p>
      </div>
    </div>
  );
};

export default WeBuildSuccessTogether;