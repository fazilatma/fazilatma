"use client";

import Link from "next/link";
import { useState } from "react";

interface SellerOfferSummary {
  id: number;
  sellerId: number;
  sellerName: string;
  amount: string;
  deliveryDays: number;
  status: "pending" | "accepted" | "rejected";
  message: string;
  productSpecs?: any;
}

interface RequestItem {
  id: string | number;
  title: string;
  description: string;
  budget: string;
  category: string;
  timeAgo: string;
  offers: number;
  buyer: string;
  buyerRating: number;
  quantity: number;
  deadline: string;
  sellerOffers: SellerOfferSummary[];
}

export default function RequestsListClient({ initialRequests, allCategories }: { initialRequests: RequestItem[], allCategories: string[] }) {
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [searchQuery, setSearchQuery] = useState("");
  const [specsRequest, setSpecsRequest] = useState<RequestItem | null>(null);

  // فیلتر کردن زنده (Instant Filter)
  const filteredRequests = initialRequests.filter(req => {
    // 1. فیلتر دسته‌بندی
    const matchCategory = selectedCategory === "همه دسته‌بندی‌ها" || req.category === selectedCategory;
    
    // 2. فیلتر جستجوی متنی
    const matchSearch = req.title.includes(searchQuery) || req.description.includes(searchQuery);

    return matchCategory && matchSearch;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {specsRequest && <OfferSpecsModal request={specsRequest} onClose={() => setSpecsRequest(null)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">درخواست‌های خرید</h1>
              <p className="text-gray-600">درخواست‌های خرید ثبت شده توسط خریداران را مشاهده کنید و پیشنهاد دهید</p>
            </div>
            <Link
              href="/request-purchase"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ثبت درخواست خرید
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-lg mb-4">فیلترها</h3>
              
              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">دسته‌بندی</h4>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-gray-50"
                >
                  {allCategories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-green-600 mt-2">✨ فیلتر بلافاصله اعمال می‌شود</p>
              </div>

              {/* Budget Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">محدوده بودجه</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                    <span className="text-gray-600">زیر ۱۰ میلیون تومان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                    <span className="text-gray-600">۱۰ تا ۵۰ میلیون تومان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                    <span className="text-gray-600">۵۰ تا ۱۰۰ میلیون تومان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                    <span className="text-gray-600">بالای ۱۰۰ میلیون تومان</span>
                  </label>
                </div>
              </div>

              {/* Time Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">زمان ثبت</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="time" className="w-4 h-4 text-green-600" defaultChecked />
                    <span className="text-gray-600">همه زمان‌ها</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="time" className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">۲۴ ساعت گذشته</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="time" className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">هفته گذشته</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Requests List */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="جستجو در متن یا عنوان درخواست‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Requests */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
                  <p className="text-gray-500 font-bold mb-2">هیچ درخواستی با این فیلترها یافت نشد.</p>
                  <button onClick={() => { setSelectedCategory("همه دسته‌بندی‌ها"); setSearchQuery(""); }} className="text-green-600 hover:underline text-sm">
                    حذف فیلترها و مشاهده همه
                  </button>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover block"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-[#00a8e8] border border-[#00a8e8]/30 px-3 py-1 rounded-full text-sm font-bold">
                          {request.category}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                          تعداد: {request.quantity}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm font-bold">{request.timeAgo}</span>
                    </div>

                    <h3 className="font-bold text-xl text-gray-800 mb-2">{request.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        مهلت: {request.deadline}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-xl md:text-2xl text-green-600">{request.budget}</span>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{request.buyer}</span>
                          <span className="flex items-center gap-1 text-yellow-500 font-bold mr-1">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {request.buyerRating}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-gray-500 text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg">{request.offers} پیشنهاد</span>
                        {request.offers > 0 && (
                          <button
                            type="button"
                            onClick={() => setSpecsRequest(request)}
                            className="rounded-lg border border-[#00a8e8]/30 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#00a8e8] hover:bg-blue-100 transition"
                          >
                            مشخصات کامل محصول پیشنهادی
                          </button>
                        )}
                        <Link href={`/requests/${request.id}`} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition">
                          مشاهده و ارسال پیشنهاد
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferSpecsModal({ request, onClose }: { request: RequestItem; onClose: () => void }) {
  const offers = request.sellerOffers || [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="bg-gradient-to-l from-[#003b5c] to-[#00a8e8] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{request.offers} پیشنهاد فروشنده</span>
              <h2 className="mt-3 text-2xl font-bold">مشخصات کامل محصول پیشنهادی</h2>
              <p className="mt-2 text-sm leading-7 text-blue-50">{request.title}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-white/15 px-3 py-1 text-lg font-bold hover:bg-white/25">×</button>
          </div>
        </div>
        <div className="space-y-4 p-6">
          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">هنوز پیشنهادی برای این درخواست ثبت نشده است.</div>
          ) : offers.map((offer) => (
            <article key={offer.id} className="rounded-3xl border border-gray-200 p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-start">
                <div>
                  <h3 className="text-lg font-bold text-[#003b5c]">{offer.sellerName}</h3>
                  <p className="mt-1 text-xs text-gray-500">زمان تحویل: {offer.deliveryDays} روز · وضعیت پیشنهاد: {offer.status}</p>
                  {offer.message && <p className="mt-2 text-sm text-gray-600">{offer.message}</p>}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-[#0b9c56]">{Number(offer.amount || 0).toLocaleString("fa-IR")} تومان</p>
                  <a href={`/sellers/${offer.sellerId}`} className="mt-2 inline-block text-xs font-bold text-[#00a8e8]">مشاهده پروفایل فروشنده</a>
                </div>
              </div>
              <OfferSpecsDetails specs={offer.productSpecs} />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function OfferSpecsDetails({ specs }: { specs?: any }) {
  if (!specs) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">فروشنده هنوز فرم مشخصات کامل محصول پیشنهادی را تکمیل نکرده است. تا تکمیل این فرم، خریدار نباید این پیشنهاد را برای پرداخت انتخاب کند.</div>;
  }
  const rows = [
    ["برند", specs.brand], ["مدل دقیق", specs.exactModel], ["کد مدل/کانفیگ", specs.serialOrConfig],
    ["CPU", specs.cpu], ["RAM", specs.ram], ["حافظه", specs.storage], ["GPU", specs.gpu], ["نمایشگر", specs.display],
    ["سال ساخت", specs.manufactureYear], ["وضعیت کالا", specs.productCondition], ["گارانتی", specs.warrantyStatus],
    ["سلامت کلی", specs.partsHealth], ["سلامت CPU", specs.cpuHealth], ["سلامت مادربرد", specs.motherboardHealth],
    ["سلامت نمایشگر", specs.displayHealth], ["سلامت SSD/HDD", specs.storageHealth], ["سلامت RAM", specs.ramHealth],
    ["سلامت GPU", specs.gpuHealth], ["کیبورد/تاچ‌پد", specs.keyboardTouchpadHealth], ["بدنه/لولا", specs.bodyHingeHealth],
    ["باتری", specs.batteryHealthPercent ? `${specs.batteryHealthPercent}%` : "—"], ["گرید ظاهری", specs.appearanceGrade],
    ["سابقه تعمیر", specs.repairHistory], ["کارکرد", specs.usageLevel], ["لوازم جانبی", specs.accessoriesStatus],
    ["شارژر", specs.chargerStatus], ["جعبه", specs.originalPackaging], ["فاکتور/اصالت", specs.purchaseInvoiceAvailable],
    ["مهلت تست", specs.testDeadlineDays ? `${specs.testDeadlineDays} روز` : "—"],
  ];
  return (
    <div>
      <h4 className="mb-3 font-bold text-gray-900">فرم مشخصات کامل محصول پیشنهادی فروشنده</h4>
      <div className="grid gap-2 text-xs md:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => <div key={`${label}-${value}`} className="flex justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2"><span className="text-gray-500">{label}:</span><b className="text-gray-800">{value || "—"}</b></div>)}
      </div>
      {specs.returnPolicy && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs leading-6 text-green-800"><b>شرایط مرجوعی:</b> {specs.returnPolicy}</p>}
      {specs.notes && <p className="mt-2 rounded-xl bg-gray-50 p-3 text-xs leading-6 text-gray-600"><b>توضیحات:</b> {specs.notes}</p>}
    </div>
  );
}
