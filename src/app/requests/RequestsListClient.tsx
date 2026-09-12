"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductHeroImage, ProductImageStrip } from "@/components/ProductImages";
import UserAvatar from "@/components/UserAvatar";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

interface SellerOfferSummary {
  id: number;
  sellerId: number;
  sellerName: string;
  amount: string;
  deliveryDays: number;
  status: "pending" | "accepted" | "rejected";
  message: string;
  productSpecs?: any;
  productImages?: ProductImageAttachment[];
  seller?: { id: number; fullName: string; avatarName?: string };
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
  buyerUser?: { id: number; fullName: string; avatarName?: string };
  latestSeller?: { id: number; fullName: string; avatarName?: string };
  quantity: number;
  deadline: string;
  sellerOffers: SellerOfferSummary[];
  productImages?: ProductImageAttachment[];
  valuationFactors?: {
    cpuCores?: string;
    ramGb?: string;
    storageGb?: string;
    displaySizeInch?: string;
    refreshRateHz?: string;
    weightKg?: string;
    batteryHealthPercent?: string;
    partsHealthPercent?: string;
    bodyHealthPercent?: string;
  };
}

function requestSpecBadges(request: RequestItem) {
  const factors = request.valuationFactors || {};
  const badges = [
    factors.cpuCores ? `${Number(factors.cpuCores).toLocaleString("fa-IR")} هسته CPU` : "",
    factors.ramGb ? `RAM ${Number(factors.ramGb).toLocaleString("fa-IR")}GB` : "",
    factors.storageGb ? `${Number(factors.storageGb).toLocaleString("fa-IR")}GB SSD/HDD` : "",
    factors.displaySizeInch ? `${factors.displaySizeInch} اینچ` : "",
    factors.refreshRateHz ? `${Number(factors.refreshRateHz).toLocaleString("fa-IR")}Hz` : "",
    factors.batteryHealthPercent ? `باتری ${Number(factors.batteryHealthPercent).toLocaleString("fa-IR")}٪` : "",
    request.quantity ? `تعداد ${Number(request.quantity).toLocaleString("fa-IR")}` : "",
  ].filter(Boolean);

  if (badges.length > 0) return badges.slice(0, 4);
  return request.description
    .replace(/\s+/g, " ")
    .split(/[،,.]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function RequestsListClient({
  initialRequests,
  allCategories,
}: {
  initialRequests: RequestItem[];
  allCategories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌بندی‌ها");
  const [searchQuery, setSearchQuery] = useState("");
  const [specsRequest, setSpecsRequest] = useState<RequestItem | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [switchingRequestId, setSwitchingRequestId] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  // فیلتر کردن زنده (Instant Filter)
  const filteredRequests = initialRequests.filter((req) => {
    // 1. فیلتر دسته‌بندی
    const matchCategory =
      selectedCategory === "همه دسته‌بندی‌ها" ||
      req.category === selectedCategory;

    // 2. فیلتر جستجوی متنی
    const matchSearch =
      req.title.includes(searchQuery) || req.description.includes(searchQuery);

    return matchCategory && matchSearch;
  });

  const switchToSellerMode = async (request: RequestItem) => {
    if (!userId || !userRole) {
      sessionStorage.setItem("redirectAfterAuth", "/requests");
      alert(
        "برای پیشنهاد دادن ابتدا وارد حساب شوید. بعد از ورود می‌توانید حالت فروشنده را فعال کنید.",
      );
      window.location.href = "/login";
      return;
    }
    if (userId && request.buyerUser?.id === userId) {
      alert("روی درخواست خرید خودتان نمی‌توانید پیشنهاد فروشنده ثبت کنید.");
      return;
    }
    if (userRole === "seller") {
      window.location.href = `/requests/${request.id}/offer`;
      return;
    }
    if (userRole === "admin") {
      alert(
        "ادمین برای ثبت پیشنهاد باید با حساب خریدار/فروشنده جداگانه وارد شود.",
      );
      return;
    }
    const ok = confirm(
      "می‌خواهید از حالت خریدار خارج شوید و برای این درخواست به حالت فروشنده وارد شوید؟\nحساب خریدار شما حذف نمی‌شود؛ فقط حالت فروشندگی روی همین حساب فعال می‌شود.",
    );
    if (!ok) return;

    setSwitchingRequestId(request.id);
    try {
      const response = await fetch("/api/account/seller-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          requestId: request.id,
          category: request.category,
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "تغییر حالت ناموفق بود.");
      localStorage.setItem("previousUserRole", userRole);
      localStorage.setItem("userRole", "seller");
      setUserRole("seller");
      alert(result.message);
      window.location.href = result.nextUrl || `/requests/${request.id}/offer`;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "تغییر به حالت فروشنده ناموفق بود.",
      );
    } finally {
      setSwitchingRequestId(null);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {specsRequest && (
        <OfferSpecsModal
          request={specsRequest}
          onClose={() => setSpecsRequest(null)}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                درخواست‌های خرید
              </h1>
              <p className="text-gray-600">
                درخواست‌های خرید ثبت شده توسط خریداران را مشاهده کنید و پیشنهاد
                دهید
              </p>
            </div>
            <Link
              href="/request-purchase"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              ثبت درخواست خرید
            </Link>
          </div>
          {userRole === "buyer" && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              اگر می‌خواهید روی درخواست خرید دیگران قیمت بدهید، از دکمه «ورود به
              حالت فروشنده و ثبت پیشنهاد» استفاده کنید. حساب خریدار شما باقی
              می‌ماند و فقط حالت فروشندگی فعال می‌شود.
            </div>
          )}
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
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-green-600 mt-2">
                  ✨ فیلتر بلافاصله اعمال می‌شود
                </p>
              </div>

              {/* Budget Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">محدوده بودجه</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-gray-600">زیر ۱۰ میلیون تومان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-gray-600">۱۰ تا ۵۰ میلیون تومان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-gray-600">
                      ۵۰ تا ۱۰۰ میلیون تومان
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-gray-600">
                      بالای ۱۰۰ میلیون تومان
                    </span>
                  </label>
                </div>
              </div>

              {/* Time Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">زمان ثبت</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      className="w-4 h-4 text-green-600"
                      defaultChecked
                    />
                    <span className="text-gray-600">همه زمان‌ها</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-gray-600">۲۴ ساعت گذشته</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      className="w-4 h-4 text-green-600"
                    />
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
            <div>
              {filteredRequests.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
                  <p className="mb-2 font-bold text-gray-500">
                    هیچ درخواستی با این فیلترها یافت نشد.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("همه دسته‌بندی‌ها");
                      setSearchQuery("");
                    }}
                    className="text-sm text-green-600 hover:underline"
                  >
                    حذف فیلترها و مشاهده همه
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRequests.map((request) => {
                    const specBadges = requestSpecBadges(request);
                    const buyerName = request.buyerUser?.fullName || request.buyer;
                    return (
                      <article
                        key={request.id}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-2 p-3 pb-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <UserAvatar
                              user={request.buyerUser}
                              label={buyerName}
                              className="h-7 w-7"
                              rounded="rounded-full"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[10px] text-gray-500">
                                شخص/شرکت درخواست‌دهنده
                              </p>
                              <b className="block truncate text-xs text-gray-900">
                                {buyerName}
                              </b>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#00a8e8]">
                            {request.category}
                          </span>
                        </div>

                        <Link href={`/requests/${request.id}`} className="block px-3">
                          <ProductHeroImage
                            images={request.productImages}
                            title={String(request.title)}
                            category={request.category}
                            className="h-32 rounded-xl"
                          />
                        </Link>

                        <div className="flex flex-1 flex-col p-3">
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                            <span>{request.timeAgo}</span>
                            <span>{request.offers.toLocaleString("fa-IR")} پیشنهاد</span>
                          </div>
                          <Link href={`/requests/${request.id}`}>
                            <h3 className="line-clamp-2 min-h-10 text-base font-extrabold leading-5 text-gray-900 transition group-hover:text-[#003b5c]">
                              {request.title}
                            </h3>
                          </Link>
                          <p className="mt-1.5 line-clamp-1 text-xs leading-6 text-gray-500">
                            {request.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {specBadges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>

                          <div className="mt-3 grid gap-1.5 rounded-xl bg-gray-50 p-2.5 text-[11px] text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>بودجه خریدار</span>
                              <b className="text-sm text-[#0b9c56]">{request.budget}</b>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>مهلت</span>
                              <b className="text-gray-800">{request.deadline}</b>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 pt-3">
                            {userRole === "seller" ? (
                              <Link
                                href={`/requests/${request.id}/offer`}
                                className="rounded-lg border border-[#00a8e8]/30 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-[#00a8e8] transition hover:bg-blue-100"
                              >
                                ثبت پیشنهاد قیمت و مشخصات کالا
                              </Link>
                            ) : userRole === "buyer" &&
                              request.buyerUser?.id !== userId ? (
                              <button
                                type="button"
                                disabled={switchingRequestId === request.id}
                                onClick={() => switchToSellerMode(request)}
                                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                              >
                                {switchingRequestId === request.id
                                  ? "در حال تغییر حالت..."
                                  : "ورود به حالت فروشنده و ثبت پیشنهاد"}
                              </button>
                            ) : request.offers > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSpecsRequest(request)}
                                className="rounded-lg border border-[#00a8e8]/30 bg-blue-50 px-3 py-2 text-xs font-bold text-[#00a8e8] transition hover:bg-blue-100"
                              >
                                مشخصات کامل محصول پیشنهادی
                              </button>
                            ) : null}
                            <Link
                              href={`/requests/${request.id}`}
                              className="rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-green-700"
                            >
                              مشاهده آگهی درخواست
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferSpecsModal({
  request,
  onClose,
}: {
  request: RequestItem;
  onClose: () => void;
}) {
  const offers = request.sellerOffers || [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="bg-gradient-to-l from-[#003b5c] to-[#00a8e8] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                {request.offers} پیشنهاد فروشنده
              </span>
              <h2 className="mt-3 text-2xl font-bold">
                مشخصات کامل محصول پیشنهادی
              </h2>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                {request.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 px-3 py-1 text-lg font-bold hover:bg-white/25"
            >
              ×
            </button>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <ProductImageStrip
            images={request.productImages}
            title={String(request.title)}
            label="عکس‌های ثبت‌شده توسط خریدار"
          />
          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              هنوز پیشنهادی برای این درخواست ثبت نشده است.
            </div>
          ) : (
            offers.map((offer) => (
              <article
                key={offer.id}
                className="rounded-3xl border border-gray-200 p-5"
              >
                <div className="mb-4 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={offer.seller}
                        label={offer.sellerName}
                        className="h-11 w-11"
                        rounded="rounded-full"
                      />
                      <h3 className="text-lg font-bold text-[#003b5c]">
                        {offer.sellerName}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      زمان تحویل: {offer.deliveryDays} روز · وضعیت پیشنهاد:{" "}
                      {offer.status}
                    </p>
                    {offer.message && (
                      <p className="mt-2 text-sm text-gray-600">
                        {offer.message}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-[#0b9c56]">
                      {Number(offer.amount || 0).toLocaleString("fa-IR")} تومان
                    </p>
                    <a
                      href={`/sellers/${offer.sellerId}`}
                      className="mt-2 inline-block text-xs font-bold text-[#00a8e8]"
                    >
                      مشاهده پروفایل فروشنده
                    </a>
                  </div>
                </div>
                <ProductImageStrip
                  images={offer.productImages}
                  title={`${request.title} - ${offer.sellerName}`}
                  label="عکس‌های کالای پیشنهادی فروشنده"
                />
                <OfferSpecsDetails specs={offer.productSpecs} />
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OfferSpecsDetails({ specs }: { specs?: any }) {
  if (!specs) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
        فروشنده هنوز فرم مشخصات کامل محصول پیشنهادی را تکمیل نکرده است. تا تکمیل
        این فرم، خریدار نباید این پیشنهاد را برای پرداخت انتخاب کند.
      </div>
    );
  }
  const rows = [
    ["برند", specs.brand],
    ["مدل دقیق", specs.exactModel],
    ["کد مدل/کانفیگ", specs.serialOrConfig],
    ["CPU", specs.cpu],
    ["هسته CPU", specs.cpuCores ? `${specs.cpuCores} هسته` : "—"],
    ["RAM", specs.ram],
    ["حافظه", specs.storage],
    ["GPU", specs.gpu],
    ["نمایشگر", specs.display],
    ["اندازه نمایشگر", specs.displaySizeInch ? `${specs.displaySizeInch} اینچ` : "—"],
    ["نرخ نوسازی", specs.refreshRateHz ? `${specs.refreshRateHz}Hz` : "—"],
    ["وزن", specs.weightKg ? `${specs.weightKg}kg` : "—"],
    ["سال ساخت", specs.manufactureYear],
    ["وضعیت کالا", specs.productCondition],
    ["گارانتی", specs.warrantyStatus],
    ["سلامت کلی", specs.partsHealth],
    [
      "درصد سلامت قطعات",
      specs.partsHealthPercent ? `${specs.partsHealthPercent}%` : "—",
    ],
    [
      "درصد سلامت بدنه/لولا",
      specs.bodyHealthPercent ? `${specs.bodyHealthPercent}%` : "—",
    ],
    ["سلامت CPU", specs.cpuHealth],
    ["سلامت مادربرد", specs.motherboardHealth],
    ["سلامت نمایشگر", specs.displayHealth],
    ["سلامت SSD/HDD", specs.storageHealth],
    ["سلامت RAM", specs.ramHealth],
    ["سلامت GPU", specs.gpuHealth],
    ["کیبورد/تاچ‌پد", specs.keyboardTouchpadHealth],
    ["بدنه/لولا", specs.bodyHingeHealth],
    [
      "باتری",
      specs.batteryHealthPercent ? `${specs.batteryHealthPercent}%` : "—",
    ],
    ["گرید ظاهری", specs.appearanceGrade],
    ["سابقه تعمیر", specs.repairHistory],
    ["کارکرد", specs.usageLevel],
    ["لوازم جانبی", specs.accessoriesStatus],
    ["شارژر", specs.chargerStatus],
    ["جعبه", specs.originalPackaging],
    ["فاکتور/اصالت", specs.purchaseInvoiceAvailable],
    [
      "مهلت تست",
      specs.testDeadlineDays ? `${specs.testDeadlineDays} روز` : "—",
    ],
  ];
  return (
    <div>
      <h4 className="mb-3 font-bold text-gray-900">
        فرم مشخصات کامل محصول پیشنهادی فروشنده
      </h4>
      <div className="grid gap-2 text-xs md:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div
            key={`${label}-${value}`}
            className="flex justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2"
          >
            <span className="text-gray-500">{label}:</span>
            <b className="text-gray-800">{value || "—"}</b>
          </div>
        ))}
      </div>
      {specs.returnPolicy && (
        <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs leading-6 text-green-800">
          <b>شرایط مرجوعی:</b> {specs.returnPolicy}
        </p>
      )}
      {specs.notes && (
        <p className="mt-2 rounded-xl bg-gray-50 p-3 text-xs leading-6 text-gray-600">
          <b>توضیحات:</b> {specs.notes}
        </p>
      )}
    </div>
  );
}
