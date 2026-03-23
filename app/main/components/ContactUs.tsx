import React from "react";
import { InputField } from "../../../components/ui/InputField";
import { SelectField } from "../../../components/ui/SelectField";
import { TextareaField } from "../../../components/ui/TextAreaField";

const ContactUs = () => {
  const subjectOptions = [
    { value: "", label: "Select a subject" },
    { value: "General Inquiry", label: "General Inquiry" },
    { value: "Feedback", label: "Feedback" },
    { value: "Catering Request", label: "Catering Request" },
    { value: "Partnership", label: "Partnership" },
  ];

  return (
    <section id="contact-section" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            CONTACT US
          </h2>
          <p className="text-lg text-gray-600">
            Have questions, feedback, or inquiries? Send us a message and we'll
            get back to you.
          </p>
        </div>

        <form className="space-y-6">
          <InputField
            label="Name"
            required
            type="text"
            name="name"
            id="name"
            placeholder="Your fullname"
          />

          <InputField
            label="Email"
            required
            type="email"
            name="email"
            id="email"
            placeholder="your.email@example.com"
          />

          <InputField
            label="Phone Number"
            type="tel"
            name="phone"
            id="phone"
            placeholder="+63 912 345 6789"
          />

          <SelectField
            label="Subject"
            required
            name="subject"
            id="subject"
            options={subjectOptions}
          />

          <TextareaField
            label="Message"
            required
            name="message"
            id="message"
            rows={5}
            placeholder="How can we help you?"
          />

          <button
            type="submit"
            className="w-full bg-brand-color-500 text-white py-4 font-bold text-lg hover:bg-[#b83200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactUs;