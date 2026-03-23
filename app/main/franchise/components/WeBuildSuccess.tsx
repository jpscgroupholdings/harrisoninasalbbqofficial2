"use client";

import { getLucideIcon } from "@/lib/iconUtils";
import React from "react";
import JourneyTimeline from "./JourneyTimeline";

const WeBuildSuccessTogether = () => {
  const supportFeatures = [
    {
      icon: "BookOpen",
      title: "Operations Manual",
      description: "Complete business system & operations manual.",
    },
    {
      icon: "Settings",
      title: "Turnkey System",
      description: "Hands-on training program.",
    },
    {
      icon: "GraduationCap",
      title: "Training Program",
      description: "Site selection & store setup guidance.",
    },
    {
      icon: "MapPin",
      title: "Site & Setup Support",
      description: "Marketing materials and campaigns.",
    },
    {
      icon: "Megaphone",
      title: "Marketing Support",
      description: "Ongoing operational support.",
    },
    {
      icon: "LifeBuoy",
      title: "Ongoing Assistance",
      description: "Exclusive territory opportunities.",
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-12">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/** What you get */}
          <div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              What you get
            </h2>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-12">
              When you join Harrison, you gain access to:
            </p>

            {/* Support Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {supportFeatures.map((feature, index) => {
                const Icon = getLucideIcon(feature.icon);

                return (
                  <div
                    key={index}
                    className="bg-brand-white border border-gray-100 rounded-xl p-6 hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Icon className="w-6 h-6 text-brand-color-500 shrink-0 mt-1" />
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
            
            {/** Ideal franchiser section */}
          {/* <div className="w-full max-w-7xl mx-auto py-12">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Ideal Franchise Partner:
            </h2>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-12">
              We’re looking for individuals who are:
            </p>

            <div>
              <ul className="flex flex-wrap justify-center gap-4">
                {[
                  "Entrepreneurial and driven",
                  "Passionate about business growth",
                  "Committed to following proven systems",
                  "Customer-focused and results-oriented",
                ].map((item, index) => {
                  const Icon = getLucideIcon("CheckCircle");

                  return (
                    <li
                      key={index}
                      className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:shadow-md transition"
                    >
                      <Icon className="w-4 h-4 text-brand-color-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div> */}

          {/** Journey timeline */}
          {/* <JourneyTimeline /> */}

          <div className="my-16">
            <div className="flex flex-col items-center gap-6 mb-12">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-center text-slate-900">
                WHY INVEST IN FRANCHISING
              </h1>
              <div className="w-20 h-1 bg-orange-500 rounded-full" />
            </div>

            <p className="max-w-3xl mx-auto text-center text-lg sm:text-xl text-gray-600 leading-relaxed">
              Franchising allows you to operate your own business with the
              backing of an established system, reducing risks compared to
              starting from scratch. It combines independence with structured
              support — giving you the best of both worlds.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Footer Section */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Ready to Own a Harrison Franchise?
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed">
            Take the first step toward building your business today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 sm:px-10 py-3 sm:py-4 bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-1">
              Apply Now
            </button>
            <button className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-brand-color-500 text-brand-color-500 hover:bg-brand-color-500/10 font-bold rounded-full transition-all duration-300">
              Download Franchise Kit
            </button>
            <button className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-brand-color-500 text-brand-color-500 hover:bg-brand-color-500/10 font-bold rounded-full transition-all duration-300">
              Talk to our Team
            </button>
          </div>
        </div>
      </div>

      {/* Footer Contact */}
      {/* <div className="bg-slate-900 text-gray-400 py-6 px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>
          Harrison’s House of Inasal & BBQ Grilled right. Shared with heart.
        </p>
        <p>Contact Us: franchise@harrisonsbbq.com | +63 (87) XXX XXX</p>
      </div> */}
    </div>
  );
};

export default WeBuildSuccessTogether;
