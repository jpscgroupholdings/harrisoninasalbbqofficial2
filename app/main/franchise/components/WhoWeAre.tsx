import React from "react";

const WhoWeAre = () => {
  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col justify-center items-center gap-8 py-4 px-8 mb-24">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black">
        Who We Are?
      </h2>
       <div className="w-20 h-1 bg-brand-color-500 rounded-full" />
      <p className="text-gray-500 max-w-4xl text-center text-sm md:text-lg lg:text-xl">
        Harrison is built on a simple idea: deliver exceptional products and
        services while empowering local entrepreneurs to succeed. With a strong
        brand identity, proven systems, and continuous support, Harrison is
        designed for long-term growth.
      </p>
      <p className="text-gray-500 max-w-4xl text-center text-sm md:text-lg lg:text-xl">We don’t just build businesses — we build partnerships.</p>
    </div>
  );
};

export default WhoWeAre;
