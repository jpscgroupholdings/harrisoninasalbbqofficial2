'use client'

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What are your opening hours?",
      answer:
        "We are open from 10:00 AM to 12:00 AM, Monday to Sunday.",
    },
    {
      question: "Can I book Harrison for a day?",
      answer:
        "Yes, you can book Harrison for a day. Please contact us for more details.",
    },
    {
      question: "Do you offer catering services?",
      answer:
        "Yes, we offer catering services for events and special occasions. Please contact us for more information.",
    },
    {
      question: "Do you offer loyalty cards?",
      answer:
        "Yes, we offer loyalty cards for our customers. Please ask our staff for more details.",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faqs" className="w-full bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="uppercase font-black text-3xl md:text-5xl text-brand-color-500 mb-2">
            FAQs
          </h1>
          <p className="text-gray-500 font-semibold uppercase text-sm tracking-widest">
            You ask, we answer
          </p>
        </div>

        {/* Accordion Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "border-brand-color-500"
                    : "border-gray-200 hover:border-brand-color-500"
                }`}
              >
                {/* Question Row */}
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group cursor-pointer"
                >
                  <span
                    className={`font-black uppercase text-sm md:text-base tracking-wide transition-colors duration-200 ${
                      isOpen ? "text-brand-color-500" : "text-gray-800 group-hover:text-brand-color-500"
                    }`}
                  >
                    {faq.question}
                  </span>

                  {/* Plus / Minus Icon */}
                  <span
                    className={`ml-4 shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-lg transition-all duration-300 ${
                      isOpen
                        ? "bg-brand-color-500 text-white rotate-180"
                        : "bg-gray-100 text-brand-color-500 group-hover:bg-brand-color-500 group-hover:text-white"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </span>
                </button>

                {/* Answer — animated expand */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-5 text-gray-600 text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQs;