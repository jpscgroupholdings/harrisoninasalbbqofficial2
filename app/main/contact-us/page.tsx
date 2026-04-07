"use client";

import { LINKS } from "@/constant/links";
import { getLucideIcon } from "@/helper/iconUtils";
import React from "react";

const ContactUsPage = () => {
  const CONTACT_DETAILS = [
    {
      icon: "House",
      title: "VISIT US",
      description: "Visit our office for inquiries and assistance.",
      value: "Century Spire, Century City, Kalayaan Ave, Makati",
      link: LINKS.MAIN_BRANCH_LINK,
    },
    {
      icon: "Phone",
      title: "CALL US",
      description: "Reach us by phone for orders, catering, or inquiries.",
      value: "+63 956 594 1234",
      link: "tel:+639565941234",
    },
    {
      icon: "Mail",
      title: "EMAIL US",
      description: "Drop us a message—we'll get back to you promptly.",
      value: "harrisoninasalbbq@gmail.com",
      link: "mailto:harrisoninasalbbq@gmail.com",
    },
  ];

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title (Optional) */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Get in Touch
          </h2>
          <p className="text-gray-600 text-lg">
            Multiple ways to connect with us
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">
          {CONTACT_DETAILS.map((item, index) => {
            const Icon = getLucideIcon(item.icon);

            return (
              <a
                key={index}
                href={item.link}
                target={item.link.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.link.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="flex flex-col items-center justify-start text-center px-6 md:px-8 py-12 md:py-16 hover:bg-gray-50 transition-colors duration-300 cursor-pointer group"
              >
                {/* Icon */}

                <Icon size={34} className="mb-6 group-hover:scale-110 transition-transform duration-300 text-brand-color-500" />

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-wide">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6 max-w-xs">
                  {item.description}
                </p>

                {/* Contact Value */}
                <p className="text-lg md:text-xl font-semibold text-orange-600 wrap-break-words">
                  {item.value}
                </p>

                {/* Hover indicator */}
                <div className="mt-6 h-1 w-0 bg-orange-600 group-hover:w-12 transition-all duration-300" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactUsPage;
