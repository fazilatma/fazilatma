"use client";

import Link from "next/link";
import { useState } from "react";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";

export default function SellerSalesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const sales = [
    {
      id: "ORD-1403-001",
      buyer: "شرکت فناوران نوین",
      product: "لپ‌تاپ استوک Lenovo ThinkPad T480 × 5 عدد",
      totalAmount: "۱۴۰,۰۰۰,۰۰۰ تومان",
      feeAmount: "۷,۰۰۰,۰۰۰ تومان (۵٪ کمیسیون)",
      sellerReceives: "۱۳۳,۰۰۰,۰۰۰ تومان",
      status: "delivered",
      statusLabel: "در انتظار تایید نهایی خریدار",
      statusColor: "bg-orange-100 text-orange-700",
      paidAt: "۱۴۰۳/۰۸/۱۵",
      needShipment: false,
      canGetPaid: true,
    },
    {
      id: "ORD-1403-002",
      buyer: "رستوران سنتی بهارستان",
      product: "تجهیزات آشپزخانه صنعتی × ۱ ست",
      totalAmount: "۸۰,۰۰۰,۰۰۰ تومان",
      feeAmount: "۴,۰۰۰,۰۰۰ تومان",
      sellerReceives: "۷۶,۰۰۰,۰۰۰ تومان",
      status: "paid",
      statusLabel: "پرداخت شده - آماده ارسال",
      statusColor: "bg-blue-100 text-blue-700",
      paidAt: "۱۴۰۳/۰۸/۱۸",
      needShipment: true,
      canGetPaid: false,
    },
    {
      id: "ORD-1403-003",
      buyer: "سارا احمدی",
      product: "آیپد پرو ۲۰۲۲ × ۱ عدد",
      totalAmount: "۴۲,۰۰۰,۰۰۰ تومان",
      feeAmount: "۲,۱۰۰,۰۰۰ تومان",
      sellerReceives: "۳۹,۹۰۰,۰۰۰ تومان",
      status: "completed",
      statusLabel: "تکمیل شده - مبلغ واریز شد",
      statusColor: "bg-green-100 text-green-700",
      paidAt: "۱۴۰۳/۰۷/۱۰",
      needShipment: false,
      canGetPaid: false,
    },
  ];

  const tabs = [
    { id: "all", label: "همه فروش‌ها" },
    { id: "paid", label: "پرداخت شده / در انتظار ارسال" },
    { id: "shipped", label: "ارسال شده" },
    { id: "delivered", label: "در انتظار تایید خریدار" },
    { id: "completed", label: "تکمیل شده (وجه واریز شده)" },
  ];

  const filteredSales = activeTab === "all" ? sales : sales.filter(s => s.status === activeTab);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">فروش‌های من</h1>
          <p className="text-gray-600">مدیریت معاملات، ارسال کالا و پیگیری تسویه حساب کمیسیون.</p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-l from-green-50 to-blue-50 border border-green-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-green-800 mb-2">🔒 نحوه تسویه حساب با فروشنده:</h3>
          <ul className="text-sm text-green-700 space-y-1 mr-5 list-disc">
            <li>وجه توسط خریدار به حساب امانی پلتفرم واریز می‌شود.</li>
            <li>شما کالا را ارسال کرده و کد رهگیری را ثبت می‌کنید.</li>
            <li>پس از تایید نهایی تحویل توسط خریدار، مبلغ نهایی (با کسر ۵٪ کمیسیون پلتفرم) به کیف پول شما واریز می‌گردد.</li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-xl p-2 border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="font-bold text-gray-800 mb-2">هنوز فروشی در این بخش ندارید</h3>
              <Link href="/requests" className="text-blue-600 font-bold hover:underline">
                مشاهده درخواست‌های خرید جدید
              </Link>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-gray-800" dir="ltr">{sale.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sale.statusColor}`}>
                      {sale.statusLabel}
                    </span>
                    <span className="text-sm text-gray-500">خریدار: {sale.buyer}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="font-bold text-gray-800 mb-4">{sale.product}</p>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <span className="text-gray-500 block">مبلغ کل پرداختی خریدار:</span>
                      <span className="font-bold text-green-700">{sale.totalAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">کمیسیون پلتفرم (۵٪):</span>
                      <span className="font-bold text-red-600 line-through">{sale.feeAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">مبلغ قابل دریافت شما:</span>
                      <span className="font-bold text-green-700 text-lg">{sale.sellerReceives}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">تاریخ پرداخت:</span>
                      <span className="font-medium">{sale.paidAt}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        const invoiceHTML = generateInvoiceHTML({
                          id: sale.id,
                          date: sale.paidAt,
                          amount: sale.totalAmount,
                          seller: "شما",
                          product: sale.product,
                          status: sale.statusLabel
                        });
                        const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      }}
                      className="border border-[#00a8e8] text-[#00a8e8] px-5 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition text-center flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      چاپ پیش‌فاکتور
                    </button>
                    <Link
                      href={`#`}
                      className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition text-center"
                    >
                      جزئیات
                    </Link>

                    {sale.needShipment && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition flex-1 sm:flex-none">
                        ثبت کد رهگیری و ارسال کالا
                      </button>
                    )}

                    {sale.canGetPaid && (
                      <div className="text-sm text-orange-700 bg-orange-50 px-4 py-2.5 rounded-lg flex-1 flex items-center justify-center">
                        پس از تایید نهایی خریدار، مبلغ به کیف پول شما واریز می‌شود.
                      </div>
                    )}

                    {sale.status === "completed" && (
                      <button className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold flex-1 sm:flex-none flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        مبلغ به کیف پول واریز شد
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
