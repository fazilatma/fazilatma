import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import "./globals.css";
import StoreStaticHeader from "@/components/StoreStaticHeader";
import Footer from "@/components/Footer";
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
  const cookieStore = await cookies();
  // در محیط پیش‌نمایش، میدل‌ور ممکن است با توکن (بدون کوکی) ادمین را تایید کند.
  const requestHeaders = await headers();
  const previewAdmin = requestHeaders.get("x-optibid-preview-admin") === "1";
  // صفحه‌های ورود/ثبت‌نام همیشه هدر عمومی فروشگاه را نشان می‌دهند؛ حتی اگر کوکی
  // ادمین یا نشست کاربری باقی مانده باشد، نباید «پنل مدیریت» و «خروج» بالای
  // صفحهٔ ورود دیده شود.
  const currentPath = requestHeaders.get("x-optibid-pathname") || "";
  const isAuthPage = /^\/(?:login|register|forgot-password)(?:\/|$)/.test(currentPath);
  const isAdmin = cookieStore.get("optibid_admin")?.value === "1" || previewAdmin;
  const userSessionValue = cookieStore.get("optibid_user")?.value || "";
  const hasUserSession = Boolean(userSessionValue) || previewAdmin;
  // مقدار کوکی نشست به شکل "role:id" است؛ نقش را برای رندر اولیه هدر می‌خوانیم.
  const sessionRole = previewAdmin ? "admin" : userSessionValue.split(":")[0] || null;
  const useStaticStoreHeader = isAuthPage || (!isAdmin && !hasUserSession);
  const DynamicHeader = useStaticStoreHeader
    ? null
    : (await import("@/components/Header")).default;
  const DynamicSellerRadar = hasUserSession
    ? (await import("@/components/GlobalSellerRequestRadar")).default
    : null;

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
        {useStaticStoreHeader ? (
          <StoreStaticHeader />
        ) : DynamicHeader ? (
          <DynamicHeader initialUserRole={sessionRole} isAdminSession={isAdmin} />
        ) : null}
        {DynamicSellerRadar ? <DynamicSellerRadar /> : null}
        <main className="flex-grow">{children}</main>
        <Footer />
        <a
          href="/support?ref=floating-support#online-support"
          className="fixed bottom-4 left-4 z-50 rounded-full bg-[#003b5c] px-5 py-3 text-sm font-black text-white shadow-xl ring-4 ring-cyan-100 transition hover:-translate-y-0.5 hover:bg-[#005f8f]"
        >
          پشتیبانی آنلاین
        </a>
      </body>
    </html>
  );
}
