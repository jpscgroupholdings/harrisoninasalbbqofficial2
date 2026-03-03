"use client";

import { useIntersectionAnimation } from "@/hooks/utils/useIntersectionAnimation";
import {
  Shield,
  Lock,
  Eye,
  Database,
  CreditCard,
  Mail,
  UserCheck,
  FileText,
  Cookie,
  Share2,
  AlertCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface PolicySection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const PrivacyPolicyPage = () => {
  const { ref: headerRef, isVisible: headerVisible } =
    useIntersectionAnimation({
      threshold: 0.2,
    });

  const lastUpdated = "February 4, 2026";
  const companyName = "King's Court Inasal";
  const companyEmail = "privacy@kingscourt.com";
  const websiteUrl = "www.kingscourt.com";

  const policySections: PolicySection[] = [
    {
      id: "information-collection",
      icon: <Database className="w-6 h-6" />,
      title: "Information We Collect",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We collect information that you provide directly to us and
            information automatically collected when you use our services:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-stone-900 mb-2">
                1. Personal Information You Provide:
              </h4>
              <ul className="list-disc list-inside space-y-2 text-stone-600 ml-4">
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  phone number, password, and delivery addresses
                </li>
                <li>
                  <strong>Payment Information:</strong> Credit/debit card
                  details, billing address, and transaction history (processed
                  securely through our payment processors)
                </li>
                <li>
                  <strong>Order Information:</strong> Order history, food
                  preferences, dietary restrictions, and special instructions
                </li>
                <li>
                  <strong>Communication Data:</strong> Feedback, reviews,
                  customer service inquiries, and survey responses
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-stone-900 mb-2">
                2. Information Automatically Collected:
              </h4>
              <ul className="list-disc list-inside space-y-2 text-stone-600 ml-4">
                <li>
                  Device information (IP address, browser type, operating
                  system)
                </li>
                <li>
                  Usage data (pages visited, time spent, features used)
                </li>
                <li>Location data (with your permission) for delivery services</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "how-we-use",
      icon: <Eye className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-stone-600 ml-4">
            <li>
              <strong>Order Processing:</strong> To process, fulfill, and
              deliver your orders
            </li>
            <li>
              <strong>Account Management:</strong> To create and manage your
              account, including authentication and security
            </li>
            <li>
              <strong>Payment Processing:</strong> To securely process payments
              and prevent fraudulent transactions
            </li>
            <li>
              <strong>Customer Service:</strong> To respond to your inquiries,
              resolve issues, and provide support
            </li>
            <li>
              <strong>Marketing Communications:</strong> To send promotional
              emails, special offers, and newsletters (only if you've opted in)
            </li>
            <li>
              <strong>Service Improvement:</strong> To analyze usage patterns
              and improve our platform, menu, and services
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with legal
              obligations and protect our rights
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "payment-security",
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Information & Security",
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">
                  Industry-Standard Security
                </h4>
                <p className="text-amber-800 text-sm">
                  We use SSL/TLS encryption and PCI-DSS compliant payment
                  processors to protect your financial information.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-stone-600">
            <p>
              <strong>Payment Processing:</strong> We partner with trusted
              third-party payment processors (such as Stripe, PayPal, or similar
              services) to handle your payment information securely. We do not
              store your complete credit card numbers on our servers.
            </p>
            <p>
              <strong>Data Encryption:</strong> All payment transactions are
              encrypted using industry-standard SSL (Secure Socket Layer)
              technology.
            </p>
            <p>
              <strong>Fraud Prevention:</strong> We implement fraud detection
              systems to protect both you and our business from unauthorized
              transactions.
            </p>
            <p>
              <strong>Data Retention:</strong> We retain transaction records for
              accounting and legal compliance purposes, typically for 7 years or
              as required by law.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "data-sharing",
      icon: <Share2 className="w-6 h-6" />,
      title: "How We Share Your Information",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-stone-900 mb-1">
                Service Providers
              </h4>
              <p className="text-stone-600 text-sm">
                Payment processors, delivery partners, cloud hosting services,
                email service providers, and analytics tools that help us
                operate our business.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-stone-900 mb-1">
                Legal Requirements
              </h4>
              <p className="text-stone-600 text-sm">
                When required by law, court order, or government regulation, or
                to protect our rights and property.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-stone-900 mb-1">
                Business Transfers
              </h4>
              <p className="text-stone-600 text-sm">
                In connection with a merger, acquisition, or sale of assets,
                your information may be transferred to the new owner.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-stone-900 mb-1">
                With Your Consent
              </h4>
              <p className="text-stone-600 text-sm">
                We may share information with third parties when you explicitly
                consent to such sharing.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "marketing",
      icon: <Mail className="w-6 h-6" />,
      title: "Marketing & Email Communications",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We respect your communication preferences and provide control over
            marketing messages:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-stone-900 mb-2">
                Email Subscriptions:
              </h4>
              <ul className="list-disc list-inside space-y-2 text-stone-600 ml-4">
                <li>
                  You can opt-in to receive promotional emails, special offers,
                  new menu updates, and exclusive deals
                </li>
                <li>
                  You can unsubscribe at any time by clicking the "Unsubscribe"
                  link at the bottom of any marketing email
                </li>
                <li>
                  Even if you unsubscribe from marketing emails, we may still
                  send you transactional emails related to your orders and
                  account
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Types of Emails We Send:
              </h4>
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>✓ Order confirmations and delivery updates (essential)</li>
                <li>✓ Account notifications and security alerts (essential)</li>
                <li>
                  ✓ Weekly specials and promotional offers (optional - you can
                  opt out)
                </li>
                <li>
                  ✓ New menu items and seasonal offerings (optional - you can
                  opt out)
                </li>
                <li>
                  ✓ Loyalty rewards and birthday treats (optional - you can opt
                  out)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-stone-900 mb-2">
                SMS Notifications:
              </h4>
              <p className="text-stone-600 mb-2">
                If you opt-in to receive SMS notifications, you may receive:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 ml-4">
                <li>Order status updates and delivery notifications</li>
                <li>Time-sensitive promotional offers</li>
                <li>You can opt-out by replying "STOP" to any SMS message</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "cookies",
      icon: <Cookie className="w-6 h-6" />,
      title: "Cookies & Tracking Technologies",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We use cookies and similar tracking technologies to enhance your
            experience on our platform:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Essential Cookies
              </h4>
              <p className="text-stone-600 text-sm">
                Required for the website to function properly. These include
                authentication, security, and shopping cart functionality.
              </p>
            </div>

            <div className="border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Analytics Cookies
              </h4>
              <p className="text-stone-600 text-sm">
                Help us understand how visitors use our site, which pages are
                most popular, and how to improve user experience.
              </p>
            </div>

            <div className="border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Marketing Cookies
              </h4>
              <p className="text-stone-600 text-sm">
                Used to deliver relevant advertisements and track campaign
                effectiveness. You can opt-out of these in your browser
                settings.
              </p>
            </div>

            <div className="border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Preference Cookies
              </h4>
              <p className="text-stone-600 text-sm">
                Remember your settings and preferences, such as language choice,
                location, and display settings.
              </p>
            </div>
          </div>

          <div className="bg-stone-100 rounded-lg p-4">
            <p className="text-stone-700 text-sm">
              <strong>Managing Cookies:</strong> You can control and delete
              cookies through your browser settings. Note that disabling certain
              cookies may affect the functionality of our website.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "user-rights",
      icon: <UserCheck className="w-6 h-6" />,
      title: "Your Rights & Choices",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            You have the following rights regarding your personal information:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Access</h4>
                <p className="text-green-800 text-sm">
                  Request a copy of the personal information we hold about you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Correction</h4>
                <p className="text-blue-800 text-sm">
                  Update or correct inaccurate personal information through your
                  account settings
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-700 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Deletion</h4>
                <p className="text-purple-800 text-sm">
                  Request deletion of your account and personal data (subject to
                  legal retention requirements)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-700 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-orange-900">
                  Opt-Out of Marketing
                </h4>
                <p className="text-orange-800 text-sm">
                  Unsubscribe from promotional emails and SMS messages at any
                  time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-700 font-bold">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Data Portability</h4>
                <p className="text-red-800 text-sm">
                  Request a copy of your data in a structured, machine-readable
                  format
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-orange-600 pl-4 py-2">
            <p className="text-stone-700 text-sm">
              To exercise any of these rights, please contact us at{" "}
              <a
                href={`mailto:${companyEmail}`}
                className="text-orange-600 hover:underline font-medium"
              >
                {companyEmail}
              </a>
              . We will respond to your request within 30 days.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "data-retention",
      icon: <FileText className="w-6 h-6" />,
      title: "Data Retention",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We retain your personal information for as long as necessary to
            fulfill the purposes outlined in this privacy policy:
          </p>

          <div className="space-y-3">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Account Information
              </h4>
              <p className="text-stone-600 text-sm">
                Retained while your account is active. After account deletion,
                we may retain certain information for legal compliance (e.g.,
                transaction records for tax purposes).
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Order History & Transaction Data
              </h4>
              <p className="text-stone-600 text-sm">
                Retained for 7 years or as required by applicable tax and
                financial regulations.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Marketing Data
              </h4>
              <p className="text-stone-600 text-sm">
                Retained until you opt-out or request deletion. We will stop
                sending marketing communications immediately upon your request.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h4 className="font-semibold text-stone-900 mb-2">
                Cookies & Analytics Data
              </h4>
              <p className="text-stone-600 text-sm">
                Typically retained for 12-24 months for analytics purposes,
                then anonymized or deleted.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      icon: <Lock className="w-6 h-6" />,
      title: "Data Security",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We implement industry-standard security measures to protect your
            personal information:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg">
              <Lock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-1">
                  Encryption
                </h4>
                <p className="text-stone-600 text-sm">
                  SSL/TLS encryption for data transmission and encrypted storage
                  for sensitive data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-1">
                  Access Controls
                </h4>
                <p className="text-stone-600 text-sm">
                  Restricted access to personal data on a need-to-know basis
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-1">
                  Regular Audits
                </h4>
                <p className="text-stone-600 text-sm">
                  Periodic security assessments and vulnerability testing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-stone-200 rounded-lg">
              <UserCheck className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-1">
                  Staff Training
                </h4>
                <p className="text-stone-600 text-sm">
                  Regular training for employees on data protection and privacy
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">
                  Data Breach Notification
                </h4>
                <p className="text-red-800 text-sm">
                  In the unlikely event of a data breach that affects your
                  personal information, we will notify you and relevant
                  authorities in accordance with applicable laws.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "childrens-privacy",
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Children's Privacy",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            Our services are not intended for children under the age of 13. We
            do not knowingly collect personal information from children under
            13. If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us, and we
            will delete such information from our systems.
          </p>
          <p className="text-stone-600 leading-relaxed">
            For users between 13 and 18 years old, we recommend parental
            guidance when creating an account or placing orders.
          </p>
        </div>
      ),
    },
    {
      id: "third-party",
      icon: <Share2 className="w-6 h-6" />,
      title: "Third-Party Links & Services",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            Our website may contain links to third-party websites, payment
            processors, and services. We are not responsible for the privacy
            practices of these third parties. We encourage you to review their
            privacy policies before providing any personal information.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-900 text-sm">
              <strong>Third-Party Services We Use:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm mt-2 ml-2">
              <li>Payment processors (Stripe, PayPal, etc.)</li>
              <li>
                Email service providers (for transactional and marketing emails)
              </li>
              <li>Cloud hosting services (for data storage)</li>
              <li>Analytics platforms (Google Analytics, etc.)</li>
              <li>Delivery and logistics partners</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "international",
      icon: <Database className="w-6 h-6" />,
      title: "International Data Transfers",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            Your information may be transferred to and processed in countries
            other than your own. We ensure that such transfers comply with
            applicable data protection laws and that appropriate safeguards are
            in place to protect your information.
          </p>
          <p className="text-stone-600 leading-relaxed">
            If you are located in the European Economic Area (EEA), we comply
            with GDPR requirements for international data transfers.
          </p>
        </div>
      ),
    },
    {
      id: "updates",
      icon: <FileText className="w-6 h-6" />,
      title: "Changes to This Privacy Policy",
      content: (
        <div className="space-y-4">
          <p className="text-stone-600 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, legal requirements, or other
            factors. When we make significant changes, we will:
          </p>
          <ul className="list-disc list-inside space-y-2 text-stone-600 ml-4">
            <li>Update the "Last Updated" date at the top of this policy</li>
            <li>
              Notify you via email if you have an account with us (for material
              changes)
            </li>
            <li>Post a prominent notice on our website</li>
          </ul>
          <p className="text-stone-600 leading-relaxed">
            We encourage you to review this Privacy Policy periodically to stay
            informed about how we protect your information.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header Section */}
      <section
        ref={headerRef}
        className="relative bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div
            className={`transform transition-all duration-700 ${
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4">
              Privacy Policy
            </h1>

            {/* Subtitle */}
            <p className="text-white/90 text-lg text-center mb-6 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your personal information.
            </p>

            {/* Last Updated */}
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <FileText className="w-4 h-4" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-sm font-semibold text-stone-700 flex-shrink-0">
              Jump to:
            </span>
            {policySections.slice(0, 5).map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-stone-600 hover:text-orange-600 transition-colors whitespace-nowrap px-3 py-1 rounded-full hover:bg-orange-50"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-12 p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  Welcome to {companyName}
                </h2>
                <p className="text-stone-700 leading-relaxed">
                  At {companyName}, we are committed to protecting your privacy
                  and ensuring the security of your personal information. This
                  Privacy Policy describes how we collect, use, share, and
                  protect your information when you use our online ordering
                  platform, create an account, make payments, and interact with
                  our services.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8">
            {policySections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className="scroll-mt-24 bg-white rounded-xl border border-stone-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Section Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 text-orange-600">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-orange-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-bold text-stone-900">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="ml-16">{section.content}</div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">
                  Questions About Your Privacy?
                </h3>
                <p className="text-white/90 mb-4">
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please don't
                  hesitate to contact us.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a
                      href={`mailto:${companyEmail}`}
                      className="hover:underline"
                    >
                      {companyEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{websiteUrl}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-stone-200">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-600">
              <Link
                href="/terms"
                className="hover:text-orange-600 transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-stone-300">•</span>
              <Link
                href="/cookie-policy"
                className="hover:text-orange-600 transition-colors"
              >
                Cookie Policy
              </Link>
              <span className="text-stone-300">•</span>
              <Link
                href="/data-request"
                className="hover:text-orange-600 transition-colors"
              >
                Data Request
              </Link>
              <span className="text-stone-300">•</span>
              <Link
                href="/contact"
                className="hover:text-orange-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <p className="text-center text-stone-500 text-sm mt-6">
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Missing import
const Globe = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

export default PrivacyPolicyPage;