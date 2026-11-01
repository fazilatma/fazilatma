import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { getLiveContent } from "@/lib/live-content";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildSeoMetadata({
  title: "تماس با OptiBid | فروشگاه تخصصی لپ‌تاپ",
  description: "راه‌های تماس با OptiBid برای پشتیبانی خرید لپ‌تاپ، پیگیری سفارش، همکاری و دریافت مشاوره انتخاب مدل مناسب.",
  path: "/contact",
});

export default async function ContactPage() {
  const liveContent = await getLiveContent();

  return <ContactClient initialContent={liveContent} />;
}
