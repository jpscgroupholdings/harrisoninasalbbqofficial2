"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maria Santos",
    location: "Makati City",
    rating: 5,
    text: "The best inasal I've ever tasted outside of Bacolod! The chicken is so juicy and flavorful. My family orders here every weekend now. Truly, bawat kagat may kwento!",
    avatar: "MS",
  },
  {
    id: 2,
    name: "Juan dela Cruz",
    location: "Quezon City",
    rating: 5,
    text: "Harrison's BBQ platter is a must-try! Perfect for barkada hangouts. The meat is tender and the sauce is addicting. Fast delivery too!",
    avatar: "JC",
  },
  {
    id: 3,
    name: "Ana Reyes",
    location: "Pasig City",
    rating: 5,
    text: "I'm a regular customer for 2 years now. The quality never disappoints. Their crispy liempo is my comfort food. Highly recommended!",
    avatar: "AR",
  },
  {
    id: 4,
    name: "Carlo Mendoza",
    location: "Taguig City",
    rating: 4,
    text: "Finally found a place that reminds me of home-cooked Filipino food. The sisig is sizzling hot and perfectly seasoned. 10/10!",
    avatar: "CM",
  },
  {
    id: 5,
    name: "Liza Gomez",
    location: "Mandaluyong",
    rating: 4,
    text: "Their sago't gulaman is the best! And the inasal combo meal is such a great deal. My go-to for lunch deliveries at work.",
    avatar: "LG",
  },
];

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    const section = document.getElementById("testimonials-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      id="testimonials-section"
      className="py-16 lg:py-24 bg-linear-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <span className="text-[#ef4501] font-semibold text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Our happy customers
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our happy customers
            have to say about their Harrison experience.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div
          className={`relative max-w-4xl mx-auto transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Quote Icon */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#ef4501] rounded-full flex items-center justify-center shadow-lg shadow-[#ef4501]/30 z-10">
            <Quote size={24} className="text-white" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 pt-12">
            <div
              className={`transition-all duration-500 ${isAnimating ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"}`}
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    className={
                      i < currentTestimonial.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-lg lg:text-xl text-center leading-relaxed mb-8">
                "{currentTestimonial.text}"
              </p>

              {/* Author */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#ef4501] rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                  {currentTestimonial.avatar}
                </div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  {currentTestimonial.name}
                </h4>
                <p className="text-gray-400 text-sm">
                  {currentTestimonial.location}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-[#ef4501] hover:shadow-lg transition-all"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-[#ef4501] w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-[#ef4501] hover:shadow-lg transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div
          className={`flex flex-wrap justify-center gap-8 mt-12 transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 text-gray-400">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-900">4.9</span>
            <span>Average Rating</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-gray-900">500+</span>
            <span>Happy Reviews</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-gray-900">50,000+</span>
            <span>Orders Delivered</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
