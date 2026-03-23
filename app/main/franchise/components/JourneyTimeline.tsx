import React from "react";

const JourneyTimeline = () => {
  const journeySteps = [
    {
      number: "1",
      title: "Inquiry",
      description: "Submit your interest form.",
    },
    {
      number: "2",
      title: "Dicovery Call",
      description: "Learn more about Harrison.",
    },
    {
      number: "3",
      title: "Evaluation",
      description: "See if we're the right fit.",
    },
    {
      number: "4",
      title: "Approval",
      description: "Secure your franchise",
    },
    {
      number: "5",
      title: "Training & Setup",
      description: "Prepare for lunch",
    },
    {
      number: "6",
      title: "Grand Opening!",
      description: "Start your opening",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-12">
      <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
        How it works
      </h2>

      <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-12">
        Franchise Process
      </p>

      {/* Desktop: Horizontal timeline */}
      <div className="hidden sm:flex items-start justify-between relative py-12">
        <div className="flex justify-between w-full relative z-10">
          {journeySteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Timeline marker */}
              <div className="w-12 h-12 rounded-full bg-brand-color-500 text-white font-bold flex items-center justify-center text-lg border border-brand-color-500 shadow-md relative z-10">
                {step.number}
              </div>
              {/* Connection line - only shows between steps 1-6 */}
              <div className="absolute top-5 left-12 right-12 h-0.5 bg-brand-color-500 z-0"></div>
              {/* Content below marker */}
              <div className="mt-8 text-center max-w-xs">
                <h3 className="text-base font-bold text-brand-color-500 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="sm:hidden space-y-8">
        {journeySteps.map((step, index) => (
          <div key={index} className="flex gap-4">
            {/* Left side: timeline marker and connector */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-brand-color-500 text-white font-bold flex items-center justify-center text-base border border-brand-color-500 shadow-md relative z-10">
                {step.number}
              </div>
              {/* Connector line only between steps (not after last step) */}
              {index !== journeySteps.length - 1 && (
                <div className="w-0.5 h-16 bg-brand-color-500 mt-2"></div>
              )}
            </div>

            {/* Right side: content */}
            <div className="pt-1">
              <h3 className="text-base font-bold text-brand-color-600 dark:text-brand-color-400 mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JourneyTimeline;
