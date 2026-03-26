import React from "react";

const FoundersNote = () => {
  return (
    <div className="bg-white">
      <div className="relative px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Section */}
          <div className="hidden lg:flex lg:col-span-1 justify-center order-2 lg:order-1">
            <img
              src="/images/harrison_founder.png"
              alt="Harrison Character"
              className="w-full max-w-sm h-auto object-contain"
            />
          </div>

          {/* Text Section */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <h2 className="uppercase font-black text-3xl md:text-4xl lg:text-6xl text-brand-color-500 mb-8 leading-tight">
              Founders Note
            </h2>
            
            <p className="text-gray-700 text-lg md:text-xl lg:text-2xl leading-relaxed font-medium">
              Welcome to Harrison House! We are thrilled to share our story with you. Our journey began with a simple vision: to create a space where people can come together, share meals, and create lasting memories. This is more than just a restaurant; it's a community hub where every guest feels welcome and valued.
            </p>

            {/* Optional: Add a signature or CTA */}
            <div className="mt-10">
              <p className="text-brand-color-500 font-black text-lg italic">
                — The Harrison House Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundersNote;


