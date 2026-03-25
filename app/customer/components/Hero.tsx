"use client";

import { ChevronDown, Clock, MapPin, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true);
  }, []);

   const scrollToMenu = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 lg:px-12 sm:px-6 pb-20 lg:pb-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:min-h-[calc(100vh-8rem)]">
          {/** Content */}
          <div
            className={`space-y-6 lg:space-y-8 text-center mt-12 md:mt-0 lg:text-left transform transition-all duration-1000 
            ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            {/** Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold darkText leading-tight">
              Bawat Kagat,
              <br />
              <span className="text-[#ef4501]">May Kwento.</span>
            </h1>

            {/**Sub headline */}
            <p className="text-slate-400 text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Sa bawat ihaw ng manok at baboy, may alaalang kasama ang barkada,
              pamilya, at mga kwentong di malilimutan.
              <span className="text-slate-600 font-medium"> Tara, kain tayo!</span>
            </p>

            {/** CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
              onClick={scrollToMenu}
              className="group bg-[#ef4501] hover:bg-[#c1350] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-[#ef4501]/30 hover:scale-105 cursor-pointer">
                <span className="flex items-center justify-center gap-2">
                  <Utensils size={20} />
                  Order Now
                </span>
              </button>
              <button 
              onClick={() => router.push("/menu")}
              className="group bg-[#1a1a1a]/90 hover:bg-[#1a1a1a] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 border-[#1a1a1a]/80 hover:border-white/40 cursor-pointer">
                View Menu
              </button>
            </div>

            {/** Quick info */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={18} className="text-[#ef4501]" />
                <span className="text-sm">Open 10am - 10pm</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={18} className="text-[#ef4501]" />
                <span className="text-sm">Delivery & Pickup</span>
              </div>
            </div>
          </div>

          {/** Harrison Logo */}
          <div
            className={`relative transform transition-all duration-1000 delay-300 px-8 lg:px-0 ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"}`}
          >
            {/** Glow effect */}
            <div className="absolute inset-0 bg-[#f8f800]/70 rounded-full scale-60 lg:scale-75" />

            {/** Image container */}
            <div className="relative">
              <img
                src="images/harrison_logo.png"
                alt="harrison logo"
                className="w-full max-w-sm lg:max-w-lg mx-auto drop-shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>
            
        {/** Scroll indicator */}
        <div className="flex justify-center mt-8 lg:mt-0 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 animate-bounce">
          <button 
            onClick={scrollToMenu}
            className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#1a1a1a] transition-colors"
          >
            <span className="text-sm">Scroll to Menu</span>
            <ChevronDown size={24}/>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;