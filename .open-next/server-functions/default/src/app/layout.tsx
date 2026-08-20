import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveContentBootstrap from "@/components/LiveContentBootstrap";

export const metadata: Metadata = {
  title: "OptiBid - بزرگترین پلتفرم خرید و فروش ایران",
  description: "OptiBid - ثبت درخواست خرید و دریافت پیشنهاد از تامین‌کنندگان معتبر سراسر کشور",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <LiveContentBootstrap />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
