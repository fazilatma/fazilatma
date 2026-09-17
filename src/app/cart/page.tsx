import type { Metadata } from "next";
import StoreCartClient from "@/components/StoreCartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سبد خرید | فروشگاه OptiBid",
  description: "مدیریت سبد خرید و ثبت سفارش فروشگاهی در OptiBid.",
};

export default function CartPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
            فروشگاه OptiBid
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900">سبد خرید</h1>
          <p className="mt-2 text-sm text-slate-500">
            کالاهای انتخاب‌شده، آدرس ارسال و ثبت سفارش را از این بخش مدیریت کنید.
          </p>
        </div>
        <StoreCartClient />
      </div>
    </div>
  );
}
