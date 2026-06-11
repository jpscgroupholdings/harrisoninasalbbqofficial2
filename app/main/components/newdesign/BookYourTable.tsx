"use client";

import { formatDays } from "@/helper/formatDays";
import { formatTime } from "@/helper/formatTime";
import { formatToViberNumber } from "@/helper/formatToViberNumber";
import { useSettings } from "@/hooks/api/useSettings";

const BookYourTable = () => {
  const { data: settings, isLoading } = useSettings();

  const { contact, operatingHours } = settings ?? {};

  const formattedViber = formatToViberNumber(contact?.viber);

  const openTime = formatTime(operatingHours?.openTime || "10:00 AM");
  const closeTime = formatTime(operatingHours?.closeTime || "12:00 AM");
  const days = operatingHours?.days ?? [];

  const handleViberOpen = () => {
    if (!formattedViber) return;

    window.open(`viber://chat?number=${formattedViber}`, "_blank");
  };

  return (
    <div
      id="reserve"
      className="w-full min-h-[70vh] bg-brand-color-500 relative overflow-hidden"
    >
      {/* Main content */}
      <div className="relative py-16 px-4 md:py-24 max-w-7xl mx-auto">
        <div className="lg:max-w-[66%]">
          <div className="flex flex-col justify-center bg-white rounded-2xl shadow-2xl p-10 md:p-14 gap-6">
            {/* Eyebrow label */}
            <p className="uppercase tracking-[0.25em] text-xs font-bold text-brand-color-500 opacity-60">
              Reservations
            </p>

            {/* Heading */}
            <h1 className="uppercase font-black text-xl md:text-2xl lg:text-3xl text-brand-color-500 leading-tight">
              Book Your Table
            </h1>

            {/* Message */}
            <div>
              <p className="text-gray-600 text-base md:text-sm leading-relaxed max-w-md">
                Ready to join us? Message us on{" "}
                <span className="font-bold text-brand-color-500">Viber</span>{" "}
                and we'll get your table sorted in no time. We're open everyday
              </p>
              {!isLoading && days.length > 0 && (
                <>
                  <p className="font-bold text-brand-color-500">
                    <span className="font-semibold">{formatDays(days)}</span>
                  </p>
                  {openTime && closeTime && (
                    <span className="text-brand-color-500">
                      {openTime} – {closeTime}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="w-12 h-1 bg-brand-color-500 rounded-full" />

            {/* Contact note */}
            <p className="text-sm text-gray-500 font-medium">
              You can also book Harrison House for a full day.
            </p>

            {!isLoading && (
              /* Viber CTA Button */
              <div className="flex flex-col items-start sm:items-center gap-4 mt-2">
                <button
                  onClick={handleViberOpen}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-brand-color-500 text-white font-black text-sm uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {/* Viber icon (SVG inline) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 shrink-0"
                  >
                    <path d="M11.985 0C5.405 0 .005 5.085.005 11.385c0 3.15 1.29 6.015 3.39 8.13L2.005 24l4.665-1.35a11.94 11.94 0 0 0 5.315 1.245c6.585 0 11.985-5.085 11.985-11.385C23.97 5.085 18.57 0 11.985 0zm0 20.79c-1.74 0-3.39-.45-4.83-1.245l-3.375.975.99-3.285A9.224 9.224 0 0 1 2.82 11.4c0-5.085 4.11-9.195 9.165-9.195 5.07 0 9.165 4.11 9.165 9.195 0 5.07-4.095 9.39-9.165 9.39zm5.07-6.885c-.27-.135-1.62-.81-1.875-.9-.255-.09-.435-.135-.615.135s-.705.9-.87 1.08c-.165.195-.315.21-.585.075-.27-.135-1.14-.42-2.175-1.335-.81-.72-1.35-1.605-1.515-1.875-.165-.27-.015-.405.12-.54.12-.12.27-.315.405-.48.135-.165.18-.285.27-.48.09-.195.045-.36-.015-.495-.06-.135-.615-1.5-.855-2.055-.225-.54-.45-.465-.615-.465-.165 0-.345-.015-.525-.015a1.03 1.03 0 0 0-.735.345c-.255.27-.96.945-.96 2.295 0 1.35.99 2.655 1.125 2.835.135.195 1.95 2.97 4.725 4.17.66.285 1.17.45 1.575.585.66.21 1.26.18 1.74.105.525-.075 1.62-.66 1.86-1.305.225-.645.225-1.2.165-1.305-.075-.12-.255-.18-.525-.315z" />
                  </svg>
                  Message Us on Viber
                </button>
                {/* Phone number display */}
                <a
                  href={`tel:+${contact?.viber}`}
                  className="text-brand-color-500 font-black text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  {contact?.viber}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Character / Harrison image */}
        <div className="hidden lg:block absolute -right-100 -top-2">
          <div className="relative">
            <div className="absolute inset-0 translate-y-2 scale-50 rounded-full bg-orange-500 opacity-90 blur-3xl" />
            <img
              src="/images/harrison_phone.png"
              alt="Harrison Character"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookYourTable;
