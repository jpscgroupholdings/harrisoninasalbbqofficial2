"use client";

import { InputField } from "@/components/ui/InputField";
import { useState } from "react";

const textareaBaseClass =
  "w-full py-3 pl-4 pr-4 border border-gray-300 rounded-lg outline-none transition focus:ring-1 focus:ring-red-500 focus:border-red-500/80 resize-none text-gray-900 placeholder:text-gray-400";

const selectBaseClass =
  "w-full py-3 pl-4 pr-4 border border-gray-300 rounded-lg outline-none transition focus:ring-1 focus:ring-red-500 focus:border-red-500/80 bg-white text-gray-900 appearance-none cursor-pointer";

export default function EventForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventDate: "",
    guests: "",
    eventType: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<any>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-brand-color-100 p-10 rounded-2xl shadow-sm text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Inquiry Sent!
        </h3>
        <p className="text-gray-500">
          Thanks, <span className="font-semibold text-gray-700">{form.name}</span>! Our team will get back to you shortly to confirm your booking.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-red-600 hover:text-red-700 text-sm font-medium underline underline-offset-2"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm">

      <div className="space-y-4">
        {/* Row: Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Full Name"
            placeholder="Juan dela Cruz"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <InputField
            label="Phone Number"
            placeholder="09xxxxxxxxx"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        <InputField
          label="Email Address"
          placeholder="example@email.com"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        {/* Row: Date + Guests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Event Date"
            type="date"
            name="eventDate"
            value={form.eventDate}
            onChange={handleChange}
            required
          />
          <InputField
            label="Number of Guests"
            placeholder="e.g. 50"
            name="guests"
            type="number"
            min="1"
            value={form.guests}
            onChange={handleChange}
          />
        </div>

        {/* Event Type */}
        <div className="w-full space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Event Type
          </label>
          <div className="relative">
            <select
              name="eventType"
              value={form.eventType}
              onChange={handleChange}
              className={selectBaseClass}
            >
              <option value="">Select Event Type</option>
              <option>Birthday</option>
              <option>Corporate Event</option>
              <option>Family Gathering</option>
              <option>Reunion</option>
              <option>Other</option>
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="w-full space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Additional Details
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            className={textareaBaseClass}
            placeholder="Tell us more about your event — theme, preferences, dietary needs, etc."
          />
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 rounded-xl transition-all shadow hover:shadow-md"
        >
          Submit Inquiry
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="grow border-t border-gray-200" />
        <span className="mx-4 text-gray-400 text-xs font-semibold tracking-widest uppercase">or</span>
        <div className="grow border-t border-gray-200" />
      </div>

      {/* Viber Button */}
       <a
        href="viber://chat?number=%2B639603349533"
        className="flex items-center justify-center gap-2 w-full bg-[#7360F2] hover:bg-[#5d4be0] text-white font-semibold py-3 rounded-xl transition-all shadow hover:shadow-md"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.4 0C5.5.2.8 5 .8 10.9c0 2.4.8 4.6 2 6.4L.8 24l7-2c1.7.9 3.6 1.4 5.6 1.4 5.9 0 10.7-4.8 10.7-10.7S17.3 0 11.4 0zm5.7 15.5c-.3.8-1.5 1.5-2.1 1.6-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-1.9 1-2.2.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.4-.1.1-.3.3-.4.4-.1.1-.2.2-.1.4.5.8 1.1 1.5 1.7 2.1.7.7 1.5 1.2 2.4 1.5.2.1.4.1.5-.1.1-.2.6-.7.8-.9.2-.2.4-.2.6-.1.2.1 1.4.7 1.7.8.2.1.4.2.5.3 0 .2 0 .8-.3 1.6z"/>
        </svg>
        Message us on Viber
      </a>
      <p className="text-xs text-gray-400 text-center mt-2">
        Opens the Viber app — works best on mobile.
      </p>
    </div>
  );
}