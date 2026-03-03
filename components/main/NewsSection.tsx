"use client";

import { useScrollToSection } from "@/hooks/utils/useScrollToSection";
import {
  useIntersectionAnimation,
  useIntersectionAnimationList,
} from "@/hooks/utils/useIntersectionAnimation";
import { Calendar, ChevronDown } from "lucide-react";
import React, { useState } from "react";

interface NewsArticle {
  id: number;
  title: string;
  image: string;
  description: string;
  date: string;
  category: string;
}

type ExpandedCardState = {
  [key: number]: boolean;
};

const NewsSection = () => {
  useScrollToSection();

  const newsArticles: NewsArticle[] = [
    {
      id: 1,
      title: "New Spicy Inasal Variant Launches This Month",
      image:
        "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop",
      description:
        "Get ready to turn up the heat! We're thrilled to announce our newest menu addition - the Spicy Inasal Supreme. Marinated in our signature blend with an extra kick of chili and local spices, this fiery variant is perfect for those who love bold flavors. Available starting February 15th at all branches.",
      date: "2026-02-03",
      category: "Menu Update",
    },
    {
      id: 2,
      title: "Grand Opening: King's Court in Makati City",
      image:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      description:
        "We're bringing authentic Inasal BBQ closer to you! Join us for the grand opening of our newest location in Makati City this Saturday. Enjoy special discounts, live music, and free samplers all day long. First 100 customers get a surprise gift!",
      date: "2026-01-28",
      category: "Announcement",
    },
    {
      id: 3,
      title: "Behind the Grill: Meet Our Master Griller",
      image:
        "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=400&fit=crop",
      description:
        "Ever wondered who's behind those perfectly grilled chicken inasal? Meet Mang Jose, our master griller with 20 years of experience. He shares his secrets on achieving that perfect char and smoky flavor that keeps our customers coming back for more.",
      date: "2026-01-25",
      category: "Feature Story",
    },
    {
      id: 4,
      title: "Weekly Special: Unlimited Rice Promo",
      image:
        "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&h=400&fit=crop",
      description:
        "Every Wednesday is now Rice Day! Enjoy unlimited rice with any inasal or BBQ order. Whether you prefer garlic rice, java rice, or plain steamed rice, eat to your heart's content. Valid for dine-in customers only.",
      date: "2026-01-20",
      category: "Promotion",
    },
    {
      id: 5,
      title: "Sustainability Initiative: Eco-Friendly Packaging",
      image:
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop",
      description:
        "We're going green! Starting this month, all our takeout orders will come in biodegradable, eco-friendly packaging. As part of our commitment to the environment, we're also introducing a reusable container program where customers can bring their own containers for a discount.",
      date: "2026-01-15",
      category: "Community",
    },
    {
      id: 6,
      title: "Customer Favorite: The Story of Our Secret Marinade",
      image:
        "https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=600&h=400&fit=crop",
      description:
        "Our secret marinade recipe has been passed down through three generations. Made with fresh calamansi, lemongrass, garlic, and a special blend of spices, it's what makes our inasal truly authentic. Learn about the tradition and love that goes into every batch we prepare daily.",
      date: "2026-01-10",
      category: "Feature Story",
    },
  ];

  const [expandedCards, setExpandedCards] = useState<ExpandedCardState>({});

  // Animate header
  const { ref: headerRef, isVisible: headerVisible } = useIntersectionAnimation({
    threshold: 0.2,
    triggerOnce: false
  });

  // Animate cards independently
  const { itemRefs: cardRefs, visibleItems: visibleCards } =
    useIntersectionAnimationList<HTMLElement>(newsArticles.length, {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
      triggerOnce: false
    });

  const TEXT_LIMIT = 120;

  const toggleExpand = (articleId: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const truncateText = (text: string, limit: number = TEXT_LIMIT) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "....";
  };

  return (
    <section id="news-section" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          <div
            className={`inline-block transform transition-all duration-700 ${
              headerVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-brand-color-500"></div>
              <span className="text-brand-color-500 font-bold tracking-wider uppercase text-sm">
                Latest Updates
              </span>
              <div className="h-px w-12 bg-linear-to-r from-brand-color-500 to-transparent"></div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold bg-linear-to-r from-brand-color-500 via-[#c13500] to-brand-color-500/60 bg-clip-text text-transparent mb-4">
              News & Events
            </h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              Stay updated with our latest menu additions, special promos, and
              exciting announcements
            </p>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsArticles.map((article, index) => (
            <article
              key={article.id}
              ref={(el) => {cardRefs.current[index] = el}}
              className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 group hover:-translate-y-2 transform ${
                visibleCards[index]
                  ? "translate-y-0 opacity-100"
                  : "translate-y-16 opacity-0"
              }`}
              style={{
                transitionDelay: visibleCards[index] ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-block px-4 py-1.5 bg-brand-color-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Date */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-brand-color-500" />
                  <time className="text-sm text-stone-500 font-medium">
                    {formatDate(article.date)}
                  </time>
                </div>
                {/* Title */}
                <h3 className="text-xl font-bold text-stone-900 mb-3 leading-snug group-hover:text-orange-600 transition-colors duration-300">
                  {article.title}
                </h3>

                {/* Description */}
                <p className="text-stone-600 leading-relaxed mb-4">
                  {expandedCards[article.id]
                    ? article.description
                    : truncateText(article.description, TEXT_LIMIT)}
                </p>

                {/* Read more button */}
                {article.description.length >= TEXT_LIMIT && (
                  <button
                    onClick={() => toggleExpand(article.id)}
                    className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm hover:text-red-600 transition-colors duration-300 group/btn cursor-pointer"
                  >
                    <span>
                      {expandedCards[article.id] ? "Show less" : "Read More"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`transform transition-transform duration-300 ${
                        expandedCards[article.id] && "rotate-180"
                      }`}
                    />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;