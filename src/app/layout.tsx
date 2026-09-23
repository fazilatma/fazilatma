import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalSellerRequestRadar from "@/components/GlobalSellerRequestRadar";
import LiveContentBootstrap from "@/components/LiveContentBootstrap";
import SupportChatWidget from "@/components/SupportChatWidget";
import { getJsonSiteMode } from "@/lib/json-store";
import {
  absoluteUrl,
  defaultSeoDescription,
  defaultSeoTitle,
  jsonLd,
  organizationJsonLd,
  siteName,
  siteUrl,
  storeSeoKeywords,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: defaultSeoTitle,
    template: "%s",
  },
  description: defaultSeoDescription,
  keywords: storeSeoKeywords,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: siteUrl,
    siteName,
    locale: "fa_IR",
    type: "website",
    images: [
      {
        url: absoluteUrl("/og-image.png"),
        width: 1200,
        height: 630,
        alt: "OptiBid - فروشگاه تخصصی لپ‌تاپ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [absoluteUrl("/og-image.png")],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "ecommerce",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003b5c",
  colorScheme: "light",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteMode = await getJsonSiteMode();

  return (
    <html lang="fa" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd()) }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <LiveContentBootstrap />
        <Header />
        {siteMode === "request" && <GlobalSellerRequestRadar />}
        <main className="flex-grow">{children}</main>
        <Footer />
        <SupportChatWidget />
      </body>
    </html>
  );
}
