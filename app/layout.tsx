import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/provider/QueryProvider";
import { larken, syne } from "./font";
import { Suspense } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Home | Harrison House of Inasal & BBQ",
  description:
    "Discover Harrison: proudly Filipino BBQ and Inasal, served with stories and barkada vibes. New branches, online orders, and collabs coming soon—follow the grill!",
  keywords: [
    "filipino bbq",
    "inasal",
    "bbq",
    "restaurant",
    "makati",
    "food",
    "order",
  ],
  authors: [{ name: "Harrison Inasal & BBQ" }],
  creator: "Harrison Inasal & BBQ",
  metadataBase: new URL("https://eris-admin.com"),

  openGraph: {
    title: "Harrison Inasal & BBQ",
    description: "Filipino Inasal and BBQ",
    url: "https://eris-admin.com",
    siteName: "Harrison Inasal & BBQ",
    images: [
      {
        url: "/images/mission-product-img.jpg",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Harrison Inasal & BBQ",
    description: "Filipino Inasal and BBQ",
    images: ["/images/harrison_logo.png"],
  },

  robots: {
    index: true, // change to true once domain is final
    follow: false, // change to true once domain is final
  },

  icons: {
    icon: "/images/harrison_logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ef4501",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.className} antialiased`}>
        {/* Meta Pixel — raw inline script so fbq is available immediately
            before any React hydration / client-component effects fire. */}
        <Script id="facebook-pixel" strategy="beforeInteractive">
          {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}
    (window, document, 'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '1584332956581235');
    fbq('track', 'PageView');
  `}
        </Script>
        <QueryProvider>
          <Toaster richColors position="top-right" closeButton expand />
          <Suspense fallback={<LoadingPage />}>{children}</Suspense>
          {modal}
        </QueryProvider>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1584332956581235&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
