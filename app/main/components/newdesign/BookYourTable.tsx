"use client";

import { InputField } from "@/components/ui/InputField";
import Image from "next/image";
import React, { useState } from "react";
import { date } from "zod";

const BookYourTable = () => {
  const [formData, setFormData] = useState({
    phone: "",
    guests: "",
    date: "",
    time: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle reservation logic here
    console.log("Reservation:", formData);
  };

  const workingDays = [
    { day: "MONDAY", time: "10:00 AM - 12:00 AM" },
    { day: "TUESDAY", time: "10:00 AM - 12:00 AM" },
    { day: "WEDNESDAY", time: "10:00 AM - 12:00 AM" },
    { day: "THURSDAY", time: "10:00 AM - 12:00 AM" },
    { day: "FRIDAY", time: "10:00 AM - 12:00 AM" },
    { day: "SATURDAY", time: "10:00 AM - 12:00 AM" },
    { day: "SUNDAY", time: "10:00 AM - 12:00 AM" },
  ];

  return (
    <div id="reserve" className="w-full min-h-[70vh] bg-brand-color-500 relative overflow-hidden">
      {/* Character Section */}
      <div className="hidden lg:flex lg:col-span-1 items-end justify-center overflow-hidden">
        <Image
          src="/images/banner_slider.png"
          alt="Banner slider"
          width={1920}
          height={400}
          sizes="100vw"
          className="w-full h-auto"
          quality={75}
        />
      </div>
      <div className="relative py-16 px-4 md:py-24 max-w-400 mx-auto">
        <div className="lg:max-w-[66%]">
          {/* Form Section */}
          <div className="flex flex-col md:flex-row justify-between bg-white rounded-2xl shadow-2xl p-8 h-full gap-2 md:gap-4 lg:gap-8">
            {/* Book Your Table Section */}
            <div className="w-full">
              <h1 className="uppercase font-black text-xl md:text-2xl lg:text-4xl text-brand-color-500 mb-8">
                Book your table
              </h1>

              <form onSubmit={handleReservation} className="space-y-6">
                <InputField
                  label="Phone"
                  placeholder="Enter your phone number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Number of Guests"
                  placeholder="Enter the number of guests"
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  min="1"
                />

                <InputField
                  label="Date"
                  placeholder="Select a date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />

                <InputField
                  label="Time"
                  placeholder="Select a time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />

                <button
                  type="submit"
                  className="w-full mt-8 px-6 py-3 border-2 border-brand-color-500 text-brand-color-500 font-black text-sm uppercase rounded-lg hover:bg-brand-color-500 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Make Reservation
                </button>
              </form>
            </div>

            {/* Working Days Section */}
            <div className="w-full">
              <h2 className="uppercase font-black text-xl md:text-2xl lg:text-4xl text-brand-color-500 mb-8">
                Working Days
              </h2>

              <div className="space-y-4">
                {workingDays.map((dayItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between pb-3 border-b border-gray-300"
                  >
                    <span className="text-brand-color-500 font-bold uppercase tracking-wide">
                      {dayItem.day}
                    </span>
                    <span className="text-brand-color-500 font-black text-lg">
                      {dayItem.time}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Book Harrison House for a day! Call{" "}
                  <span className="font-black">082 998 167 0632</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Character Section */}
        <div className="hidden lg:block absolute -right-100 -top-12">
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
