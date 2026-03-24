import { fredoka } from "@/app/font";
import { ChevronRight } from "lucide-react";

const HeroBanner = () => {
  return (
    <div className="relative w-full h-[75vh] bg-black flex items-center justify-center">
      {/* Content wrapper */}
      <div className="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full mx-auto">
          <div className={`text-center mb-8 leading-tight`}>
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white`}
            >
              Own a Harrison
              <span
                className={`text-3xl sm:text-4xl ml-2 lg:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-brand-color-500`}
              >
                Franchise
              </span>
              .
            </h1>
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-black text-white`}
            >
              Build your future with a 
              <span
                className={`text-2xl sm:text-3xl ml-2 lg:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-brand-color-500`}
              >
                Proven Brand
              </span>
              .
            </h1>
          </div>
          <p
            className={`text-center text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto mb-12`}
          >
           Join a growing network of entrepreneurs and turn your ambition into a scalable, profitable business with Harrison.
          </p>

          {/* Call-to-action button */}
          <div className={`flex justify-center`}>
            <button className="px-8 sm:px-10 py-3 sm:py-4 bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold text-sm sm:text-base rounded-full transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1 active:translate-y-0 overflow-hidden cursor-pointer group">
              {/* Button content */}
              <span className="relative flex items-center gap-2 justify-center">
                Apply Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
