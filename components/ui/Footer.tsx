"use client";

import { useSubdomainPath } from "@/hooks/useSubdomainUrl";
import HeaderLogo from "../BrandLogo";
import { LINKS } from "@/constant/links";
import { InputField } from "./FormComponents/InputField";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useSettings } from "@/hooks/api/useSettings";

const Footer = ({
  variant = "customer",
}: {
  variant?: "marketing" | "customer";
}) => {

  const {data: settings} = useSettings();

  const contact = {
    phone: settings?.contact.phone || "09687080780",
    email: settings?.contact.email || "jp@foodlab.com",
    viber: settings?.contact.viber || "09687080780"
  }

  const currentYear = new Date().getFullYear();
  const homeUrl = useSubdomainPath("/", "");
  const menuUrl = useSubdomainPath("/", "food");
  const bestSellerUrl = useSubdomainPath("/?section=bestsellers", "food");
  const ourStoryUrl = useSubdomainPath("/?section=story", "food");

  const footerQuickLinks = {
    customer: [
      { name: "Home", href: homeUrl },
      { name: "Request Events", href: "/events#booking" },
      { name: "Menu", href: menuUrl },
      { name: "Best Sellers", href: bestSellerUrl },
      { name: "Our Story", href: ourStoryUrl },
    ],

    marketing: [
      { name: "Menu", href: menuUrl },
      { name: "News", href: "/news" },
      { name: "Franchise", href: "/franchise" },
      { name: "Catering", href: "/catering" },
    ],
  };

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/privacy-policy" },
    { name: "Refund Policy", href: "#" },
    { name: "FAQ", href: "#" },
  ];

  const contactUs = [
    {
      icon: "MapPin",
      value: "Makati, Metro Manila, Philippines",
      href: LINKS.MAIN_BRANCH_LINK,
    },
    { icon: "Phone", value: contact.phone, href: `tel:${contact.phone}` },
    {
      icon: "Mail",
      value: contact.email,
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}&subject=Inquiry`,
    },
    {
      icon: "PhoneCall",
      value: contact.viber,
      href: `viber://chat?number=%2B${contact.viber}`,
    },
  ];

  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/** Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6   py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/** Brand Columns */}
          <div className="lg:col-span-1">
            <div className="mb-2">
              <HeaderLogo />
            </div>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Every bite, has story. Authentic Filipino grilling experience that
              brings families and friends together.
            </p>

            {/** Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-brand-color-500 rounded-full flex items-center justify-center transition-colors"
              >
                <DynamicIcon name="Facebook" size={18} />
              </a>
              <a
                href=""
                className="w-10 h-10 bg-white/10 hover:bg-brand-color-500 rounded-full flex items-center justify-center transition-colors"
              >
                <DynamicIcon name="Instagram" size={18} />
              </a>
              <a
                href=""
                className="w-10 h-10 bg-white/10 hover:bg-brand-color-500 rounded-full flex items-center justify-center transition-colors"
              >
                <DynamicIcon name="Twitter" size={18} />
              </a>
            </div>
          </div>

          {/** Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              {footerQuickLinks[variant].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-brand-color-500 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/** Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-brand-color-500 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/** Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4">
              {contactUs.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  className="flex items-start gap-3"
                >
                  <DynamicIcon
                    name={item.icon}
                    size={18}
                    className="text-brand-color-500 shrink-0 mt-0.5"
                  />
                  <span className="text-gray-400 text-sm">{item.value}</span>
                </a>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h4 className="font-semibold text-lg mb-1">
                Subscribe to our Newsletter
              </h4>
              <p className="text-gray-400 text-sm">
                Get exclusive deals and updates straight to your inbox!
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you for subscribing!");
              }}
              className="flex w-full max-w-md gap-3"
            >
              <InputField
                type="email"
                placeholder="Enter your email"
                required
                leftIcon={<DynamicIcon name="Mail" />}
              />
              <button
                type="submit"
                className="bg-dark-green-800 hover:bg-dark-green-900 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-gray-400 text-sm">
              © {currentYear} Harrison – House of Inasal & BBQ. All rights
              reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Every bite, tells a story 🥩
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
