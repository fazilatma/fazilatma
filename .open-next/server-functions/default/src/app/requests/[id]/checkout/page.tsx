"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const params = useParams() as unknown as { id: string };
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offer") || "1";
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [agreeEscrow, setAgreeEscrow] = useState(false);

  const request = {
    id: params.id,
    title: "خرید لپ‌تاپ استوک برای شرکت",
  };

  const selectedOffer = {
    sellerName: "دیجی‌تک",
    productTitle: "لپ‌تاپ استوک Lenovo ThinkPad T480",
    quantity: 5,
    unitPrice: "۲۸,۰۰۰,۰۰۰ تومان",
    finalPrice: "۱۴۰,۰۰۰,۰۰۰ تومان",
    deliveryDays: 7,
    warranty: "۳ ماه گارانتی تست",
  };

  const commissionRate = 5; // درصد کمیسیون که توسط ادمین قابل تنظیم است
  const finalPriceNum = 140000000;
  const commissionAmount = Math.round((finalPriceNum * commissionRate) / 100);
  const sellerReceives = finalPriceNum - commissionAmount;

  const formatPrice = (num: number) => num.toLocaleString() + " تومان";

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">خانه</Link>
          <span>/</span>
          <Link href="/requests" className="hover:text-green-600">درخواست‌های خرید</Link>
          <span>/</span>
          <Link href={`/requests/${params.id}`} className="hover:text-green-600">{request.title}</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">پرداخت امن</span>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">🔒 پرداخت امن با سیستم امانت‌داری وجه</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            وجه شما تا زمان **تحویل کالا و تایید نهایی شما** نزد پلتفرم (ادمین) امانت می‌ماند و پس از تایید، با کسر {commissionRate}٪ کمیسیون، مابقی مبلغ به حساب فروشنده واریز می‌شود.
          </p>
        </div>

        {/* Escrow Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-bold text-lg mb-4">مراحل انجام معامله امن:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mb-3">۱</div>
              <h4 className="font-bold text-green-800 mb-1">شما الان پرداخت می‌کنید</h4>
              <p className="text-sm text-green-700">
                مبلغ به حساب امانی پلتفرم واریز می‌شود؛ فروشنده **قبل از دریافت وجه**، کالا را ارسال می‌کند.
              </p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold mb-3">۲</div>
              <h4 className="font-bold text-gray-800 mb-1">ارسال کالا توسط فروشنده</h4>
              <p className="text-sm text-gray-600">
                فروشنده ظرف مهلت مقرر کالا را ارسال و کد رهگیری را در سیستم ثبت می‌کند.
              </p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold mb-3">۳</div>
              <h4 className="font-bold text-gray-800 mb-1">تایید شما + واریز به فروشنده</h4>
              <p className="text-sm text-gray-600">
                پس از دریافت کالا، شما «تایید دریافت» می‌زنید؛ وجه (با کسر {commissionRate}٪ کمیسیون) به فروشنده واریز می‌شود.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Right Side: Selected Offer Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Selected Offer Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4">اطلاعات پیشنهاد انتخاب شده:</h2>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xl">
                    {selectedOffer.sellerName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">فروشنده: {selectedOffer.sellerName}</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      فروشنده تایید شده
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-gray-800 text-lg mb-2">{selectedOffer.productTitle}</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                  <div>تعداد: <strong>{selectedOffer.quantity} عدد</strong></div>
                  <div>قیمت واحد: <strong>{selectedOffer.unitPrice}</strong></div>
                  <div>مهلت ارسال: <strong>{selectedOffer.deliveryDays} روز</strong></div>
                  <div>گارانتی: <strong>{selectedOffer.warranty}</strong></div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4">روش پرداخت:</h2>
              <div className="space-y-3">
                <label className={`border-2 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition ${paymentMethod === "wallet" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <div className="font-bold">پرداخت از طریق کیف پول پلتفرم</div>
                    <div className="text-sm text-gray-500">موجودی کیف پول شما: ۵۰,۰۰۰,۰۰۰ تومان</div>
                  </div>
                </label>
                <label className={`border-2 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition ${paymentMethod === "bank" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <div className="font-bold">پرداخت اینترنتی با کارت بانکی (درگاه معتبر)</div>
                    <div className="text-sm text-gray-500">پرداخت امن با درگاه‌های معتبر بانکی (شتاب)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Escrow Agreement */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeEscrow}
                  onChange={(e) => setAgreeEscrow(e.target.checked)}
                  className="w-5 h-5 text-green-600 mt-0.5"
                  required
                />
                <div className="text-sm text-yellow-800">
                  <strong>تایید و پذیرش قوانین پرداخت امانی:</strong>
                  <br />
                  می‌دانم که این مبلغ نزد پلتفرم امانت می‌ماند؛ فقط در صورت تحویل گرفتن و تایید نهایی من، وجه (با کسر {commissionRate}٪ کمیسیون پلتفرم) به فروشنده واریز خواهد شد.
                </div>
              </label>
            </div>
          </div>

          {/* Left Side: Price Summary & Pay Button */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="font-bold text-lg mb-4">صورتحساب نهایی</h2>

              <div className="space-y-3 mb-6 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>مبلغ کل کالا ({selectedOffer.quantity} عدد):</span>
                  <span>{formatPrice(finalPriceNum)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>کمیسیون پلتفرم ({commissionRate}٪):</span>
                  <span className="text-gray-400">{formatPrice(commissionAmount)} (از فروشنده کسر می‌شود)</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">مبلغ قابل پرداخت از سوی شما:</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-6 text-left" dir="ltr">
                {formatPrice(finalPriceNum)}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-800">
                پس از پرداخت، <strong>{formatPrice(sellerReceives)}</strong> پس از تایید دریافت کالا به حساب فروشنده واریز می‌شود.
              </div>

              <Link
                href={agreeEscrow ? "/buyer/orders?status=paid" : "#"}
                className={`block w-full text-center py-4 rounded-xl font-bold transition ${
                  agreeEscrow
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={(e) => { if (!agreeEscrow) e.preventDefault(); }}
              >
                {agreeEscrow ? "تایید و پرداخت امن مبلغ" : "ابتدا قوانین را تایید کنید"}
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 پرداخت شما با پروتکل TLS امن رمزنگاری می‌شود
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
