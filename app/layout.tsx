import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/provider/QueryProvider";
import { larken, syne } from "./font";

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
    index: false, // change to true once domain is final
    follow: false, // change to true once domain is final
  },

  icons: {
    icon: "images/harrison_logo.png",
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
      <body className={`${larken.className} antialiased`}>
        <QueryProvider>
          <Toaster richColors position="top-right" closeButton />
          {children}
          {modal}
        </QueryProvider>
      </body>
    </html>
  );
}
