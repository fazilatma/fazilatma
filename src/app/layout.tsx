import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalSellerRequestRadar from "@/components/GlobalSellerRequestRadar";
import LiveContentBootstrap from "@/components/LiveContentBootstrap";
import SupportChatWidget from "@/components/SupportChatWidget";

export const metadata: Metadata = {
  title: "OptiBid - فروشگاه لپ‌تاپ و پلتفرم درخواست خرید",
  description:
    "OptiBid برای خرید آنلاین لپ‌تاپ، مقایسه مشخصات فنی و در فاز درخواست خرید، دریافت پیشنهاد از تامین‌کنندگان معتبر.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <LiveContentBootstrap />
        <Header />
        <GlobalSellerRequestRadar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <SupportChatWidget />
      </body>
    </html>
  );
}
