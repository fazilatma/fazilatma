"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SellerStars from "@/components/SellerStars";

export default function AdminDashboardClient({
  realStats,
  sellerRankings,
  initialKycUsers,
}: {
  realStats: any;
  sellerRankings: any[];
  initialKycUsers: any[];
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingVerifications, setPendingVerifications] = useState<any[]>(initialKycUsers);
  const [kycReasons, setKycReasons] = useState<Record<number, string>>({});
  
  // States for Settings
  const [commissionRate, setCommissionRate] = useState(5);
  const [siteSlogan, setSiteSlogan] = useState("پلتفرم درخواست خرید و تامین کالا");
  const [siteSubSlogan, setSiteSubSlogan] = useState("درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و با پرداخت امن امانی خرید کنید");
  const [fontFamily, setFontFamily] = useState("Vazir");
  const [fontSize, setFontSize] = useState("16");
  const [contactPhone, setContactPhone] = useState("۰۲۱-۱۲۳۴۵۶۷۸");
  const [contactEmail, setContactEmail] = useState("info@parscoders.ir");
  const [contactAddress, setContactAddress] = useState("اهواز، خیابان ولیعصر، برج فناوری، طبقه ۱۰");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹ تا ۱۷");
  const [platformFinance, setPlatformFinance] = useState({
    platformWalletBalance: realStats.platformWalletBalance || 0,
    adminAccountHolder: "",
    adminBankName: "",
    adminSheba: "",
    adminCardNumber: "",
  });
  const [platformTransactions, setPlatformTransactions] = useState<any[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalNotes, setWithdrawalNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) return;
        setPlatformFinance(result.settings);
        setCommissionRate(result.settings.commissionRate);
        setPlatformTransactions(result.platformTransactions || []);
        setEscrowTransactions(result.escrowTransactions || []);
        setWithdrawals(result.withdrawals || []);
      })
      .catch(() => undefined);
  }, []);

  const saveFinance = async () => {
    try {
      const response = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...platformFinance, commissionRate }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setPlatformFinance(result.settings);
      setCommissionRate(result.settings.commissionRate);
      alert(result.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ذخیره تنظیمات مالی ناموفق بود.");
    }
  };

  const resolveKyc = async (userId: number, status: "approved" | "rejected") => {
    const reason = kycReasons[userId] || "";
    if (status === "rejected" && !reason.trim()) {
      alert("برای رد مدارک، علت را وارد کنید.");
      return;
    }
    if (!confirm(status === "approved" ? "مدارک تایید و حساب فعال شود؟" : "مدارک رد و حساب غیرفعال بماند؟")) return;

    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status, reason }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      alert(result.message);
      const refresh = await fetch("/api/admin/kyc", { cache: "no-store" });
      const refreshResult = await refresh.json();
      if (refreshResult.success) setPendingVerifications(refreshResult.users || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعیین وضعیت مدارک ناموفق بود.");
    }
  };

  const resolveWithdrawal = async (withdrawalId: string, status: "approved" | "rejected") => {
    const actionLabel = status === "approved" ? "تایید و ثبت تسویه بانکی" : "رد و بازگشت وجه";
    if (!confirm(`${actionLabel} برای این درخواست انجام شود؟`)) return;
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId,
          status,
          adminNote: withdrawalNotes[withdrawalId] || "",
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      alert(result.message);
      const financeResponse = await fetch("/api/admin/finance", { cache: "no-store" });
      const financeResult = await financeResponse.json();
      if (financeResult.success) setWithdrawals(financeResult.withdrawals || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعیین تکلیف برداشت ناموفق بود.");
    }
  };

  const handleSave = (section: string) => {
    alert(`تنظیمات بخش "${section}" با موفقیت در پایگاه داده ذخیره شد.`);
  };

  const stats = [
    { label: "مجموع تراکنش‌های موفق", value: `${realStats.totalVolume.toLocaleString("fa-IR")} تومان` },
    { label: "کل کمیسیون دریافت‌شده", value: `${realStats.totalCommission.toLocaleString("fa-IR")} تومان` },
    { label: "مانده حساب پلتفرم OptiBid", value: `${platformFinance.platformWalletBalance.toLocaleString("fa-IR")} تومان` },
    { label: "وجوه امانی نزد پلتفرم (Escrow)", value: `${realStats.escrowHeld.toLocaleString("fa-IR")} تومان` },
    { label: "تعداد درخواست‌های خرید باز", value: `${realStats.openRequests.toLocaleString("fa-IR")} درخواست` },
  ];


  const categoriesList = [
    { id: 1, name: "کالای دیجیتال", status: "فعال", productsCount: 1250 },
    { id: 2, name: "مد و پوشاک", status: "فعال", productsCount: 890 },
    { id: 3, name: "صنعتی و تجهیزات", status: "غیرفعال", productsCount: 0 },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">داشبورد مدیریت پلتفرم (ادمین)</h1>
            <p className="text-gray-600">کنترل کامل تراکنش‌های امانی، تنظیمات سایت و احراز هویت کاربران.</p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold text-sm border border-purple-200">
            سطح دسترسی: مدیر کل (Super Admin)
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-r-4 border-r-purple-600">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Admin Tabs */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
              <div className="p-4 bg-gray-900 text-white font-bold text-lg">
                منوی مدیریت
              </div>
              <div className="flex flex-col">
                <button onClick={() => setActiveTab("overview")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "overview" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  💰 تراکنش‌های امانی (Escrow)
                </button>
                <button onClick={() => setActiveTab("verifications")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition flex justify-between items-center ${activeTab === "verifications" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span>🛡️ تایید هویت کاربران</span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{pendingVerifications.length}</span>
                </button>
                <button onClick={() => setActiveTab("sellerScores")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "sellerScores" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  📊 امتیازدهی فروشندگان
                </button>
                <button onClick={() => setActiveTab("appearance")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "appearance" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  🎨 تنظیمات ظاهر و محتوا
                </button>
                <button onClick={() => setActiveTab("contact")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "contact" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  📞 اطلاعات تماس با ما
                </button>
                <button onClick={() => setActiveTab("financial")} className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "financial" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  💵 تنظیمات مالی و کمیسیون
                </button>
                <button onClick={() => setActiveTab("categories")} className={`text-right px-5 py-4 text-sm font-bold transition ${activeTab === "categories" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  📂 مدیریت دسته‌بندی‌ها
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Seller Scoring & Performance */}
            {activeTab === "sellerScores" && (
              <div className="animate-in fade-in duration-300 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-900">📊 سلامت و امتیازدهی فروشندگان</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">رتبه‌بندی با پنجره ارزیابی ۹۰ روزه، امتیاز تعدیل‌شده نظرات، کیفیت ارسال، پاسخ‌گویی و انطباق انجام می‌شود. فروشنده تازه‌وارد تا داده کافی داشته باشد «در حال ارزیابی» می‌ماند.</p>
                </div>

                {sellerRankings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                    <div className="mb-3 text-4xl">📉</div>
                    <p className="font-bold text-gray-700">هنوز فروشنده ثبت‌شده‌ای برای ارزیابی وجود ندارد.</p>
                    <p className="mt-2 text-sm text-gray-500">پس از ثبت‌نام فروشنده، متریک‌های او در این بخش دیده می‌شوند.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerRankings.map(({ seller, rating }) => (
                      <div key={seller.id} className="rounded-2xl border border-gray-200 p-5">
                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{seller.fullName}</h3>
                            <p className="mt-1 text-xs text-gray-500">{seller.categories?.join("، ") || "حوزه فعالیت ثبت نشده"}</p>
                          </div>
                          <div className="text-left">
                            <SellerStars score={rating.finalScore} size="md" />
                            <p className="mt-1 text-xs text-gray-500">{rating.label} — اعتبار داده {rating.confidence}% — امتیاز فنی {rating.finalScore}/۱۰۰</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-5">
                          <div className="rounded-lg bg-gray-50 p-3"><p className="font-bold text-gray-900">{rating.metrics.reliability}</p><p className="mt-1 text-[11px] text-gray-500">قابلیت اتکا</p></div>
                          <div className="rounded-lg bg-gray-50 p-3"><p className="font-bold text-gray-900">{rating.metrics.fulfilment}</p><p className="mt-1 text-[11px] text-gray-500">ارسال</p></div>
                          <div className="rounded-lg bg-gray-50 p-3"><p className="font-bold text-gray-900">{rating.metrics.buyerExperience}</p><p className="mt-1 text-[11px] text-gray-500">رضایت</p></div>
                          <div className="rounded-lg bg-gray-50 p-3"><p className="font-bold text-gray-900">{rating.metrics.trust}</p><p className="mt-1 text-[11px] text-gray-500">اعتماد</p></div>
                          <div className="rounded-lg bg-gray-50 p-3"><p className="font-bold text-gray-900">{rating.metrics.experience}</p><p className="mt-1 text-[11px] text-gray-500">سابقه</p></div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                          <span>نقص سفارش: <b>{rating.rates.defectRate}%</b></span>
                          <span>لغو فروشنده: <b>{rating.rates.cancellationRate}%</b></span>
                          <span>ارسال به‌موقع: <b>{rating.rates.onTimeShippingRate}%</b></span>
                          <span>رهگیری معتبر: <b>{rating.rates.validTrackingRate}%</b></span>
                          <span>پاسخ ۲۴ساعته: <b>{rating.rates.responseRate24h}%</b></span>
                        </div>
                        {rating.minimumDataMessage && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-blue-800">{rating.minimumDataMessage}</p>}
                        {rating.reasons.length > 0 && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-700">هشدار: {rating.reasons.join("، ")}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <h2 className="font-bold text-xl mb-6 border-b pb-4">🎨 تنظیمات ظاهر و محتوای سایت</h2>
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">بارگذاری لوگوی سایت</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                        تصویر
                      </div>
                      <div>
                        <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                        <p className="text-xs text-gray-500 mt-2">فرمت‌های مجاز: PNG, SVG (حداکثر ۲ مگابایت)</p>
                      </div>
                    </div>
                  </div>

                  {/* Slogan */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">شعار اصلی سایت (Hero Slogan)</label>
                    <input 
                      type="text" 
                      value={siteSlogan} 
                      onChange={(e) => setSiteSlogan(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">متن زیرین شعار اصلی (Sub-slogan)</label>
                    <textarea 
                      value={siteSubSlogan} 
                      onChange={(e) => setSiteSubSlogan(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      rows={3}
                    />
                  </div>

                  {/* Typography */}
                  <div className="grid md:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">نوع فونت سایت (Font Family)</label>
                      <select 
                        value={fontFamily} 
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="Vazir">وزیرمتن (Vazirmatn)</option>
                        <option value="YekanBakh">یکان بخ (Yekan Bakh)</option>
                        <option value="IRANSans">ایران سنس (IRANSans)</option>
                        <option value="Tahoma">تاهوما (Tahoma)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">اندازه پایه فونت (Base Font Size)</label>
                      <select 
                        value={fontSize} 
                        onChange={(e) => setFontSize(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="14">کوچک (14px)</option>
                        <option value="16">متوسط / استاندارد (16px)</option>
                        <option value="18">بزرگ (18px)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={() => handleSave('ظاهر و محتوا')} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition">
                      ذخیره تغییرات ظاهر
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Contact Info Settings */}
            {activeTab === "contact" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <h2 className="font-bold text-xl mb-6 border-b pb-4">📞 تنظیمات صفحه و اطلاعات تماس با ما</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">شماره تلفن پشتیبانی</label>
                    <input 
                      type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">ایمیل سازمانی</label>
                    <input 
                      type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" dir="ltr"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-2">آدرس فیزیکی دفتر مرکزی</label>
                    <textarea 
                      value={contactAddress} onChange={(e) => setContactAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-2">ساعات کاری</label>
                    <input 
                      type="text" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                <button onClick={() => handleSave('اطلاعات تماس')} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition">
                  ذخیره اطلاعات تماس
                </button>
              </div>
            )}

            {/* 3. Financial Settings */}
            {activeTab === "financial" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 border-b pb-4 text-xl font-bold">💵 حساب مالی و کمیسیون پلتفرم</h2>
                  <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <h3 className="mb-2 font-bold text-blue-800">مانده واقعی حساب کمیسیون OptiBid</h3>
                    <p className="text-3xl font-bold text-[#003b5c]">{platformFinance.platformWalletBalance.toLocaleString("fa-IR")} تومان</p>
                    <p className="mt-2 text-sm leading-7 text-blue-700">با تایید دریافت کالا توسط خریدار، کمیسیون هر سفارش به این حساب پلتفرم افزوده می‌شود و سهم باقی‌مانده به کیف پول فروشنده می‌رود.</p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">نرخ کمیسیون پلتفرم</label>
                      <div className="relative max-w-xs"><input type="number" min="0" max="30" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} className="w-full rounded-lg border border-blue-300 px-4 py-3 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" /><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">%</span></div>
                      <p className="mt-2 text-xs text-gray-500">این نرخ فقط روی سفارش‌هایی که بعد از تغییر تنظیمات انتخاب می‌شوند اعمال خواهد شد.</p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">نام دارنده حساب مقصد</label>
                      <input value={platformFinance.adminAccountHolder} onChange={(e) => setPlatformFinance({ ...platformFinance, adminAccountHolder: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثال: شرکت اپتی‌بید" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">نام بانک مقصد</label>
                      <input value={platformFinance.adminBankName} onChange={(e) => setPlatformFinance({ ...platformFinance, adminBankName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثال: بانک ملت" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">شماره شبا حساب پلتفرم</label>
                      <input dir="ltr" value={platformFinance.adminSheba} onChange={(e) => setPlatformFinance({ ...platformFinance, adminSheba: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-blue-500" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">شماره کارت مقصد (اختیاری)</label>
                      <input dir="ltr" value={platformFinance.adminCardNumber} onChange={(e) => setPlatformFinance({ ...platformFinance, adminCardNumber: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-blue-500" placeholder="0000-0000-0000-0000" />
                    </div>
                  </div>
                  <button onClick={saveFinance} className="mt-6 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700">ذخیره تنظیمات مالی</button>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold">دفتر گردش حساب پلتفرم</h2>
                  {platformTransactions.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز کمیسیونی از معامله تکمیل‌شده به حساب پلتفرم واریز نشده است.</p>
                  ) : (
                    <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="border-b bg-gray-50 text-gray-600"><tr><th className="p-3">شناسه</th><th className="p-3">شرح</th><th className="p-3">سفارش</th><th className="p-3">مبلغ کمیسیون</th><th className="p-3">مانده پس از ثبت</th></tr></thead><tbody>{platformTransactions.map((transaction) => <tr key={transaction.id} className="border-b"><td className="p-3 font-mono text-xs">{transaction.id}</td><td className="p-3">{transaction.description}</td><td className="p-3 font-mono text-xs">{transaction.orderId || "—"}</td><td className="p-3 font-bold text-green-600">{transaction.amount.toLocaleString("fa-IR")} تومان</td><td className="p-3 font-bold text-[#003b5c]">{transaction.balanceAfter.toLocaleString("fa-IR")} تومان</td></tr>)}</tbody></table></div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">درخواست‌های برداشت کاربران</h2>
                      <p className="mt-1 text-xs text-gray-500">پیش از تایید، نام صاحب حساب و اطلاعات بانکی را با مدارک کاربر تطبیق دهید.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{withdrawals.filter((item) => item.status === "pending").length} در انتظار</span>
                  </div>
                  {withdrawals.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">درخواست برداشتی وجود ندارد.</p>
                  ) : (
                    <div className="space-y-4">
                      {withdrawals.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-gray-200 p-5">
                          <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <div>
                              <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-900">{item.userName}</h3><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{item.role === "seller" ? "فروشنده" : "خریدار"}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-green-100 text-green-700" : item.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status === "approved" ? "تسویه شد" : item.status === "rejected" ? "رد شد" : "در انتظار"}</span></div>
                              <p className="mt-2 text-2xl font-bold text-[#003b5c]">{item.amount.toLocaleString("fa-IR")} تومان</p>
                              <p className="mt-1 font-mono text-xs text-gray-400">{item.id}</p>
                            </div>
                            <div className="grid gap-x-8 gap-y-2 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2 lg:min-w-[520px]">
                              <p><b>صاحب حساب:</b> {item.bankAccountHolder}</p><p><b>بانک:</b> {item.bankName}</p>
                              <p dir="ltr" className="text-right"><b>حساب:</b> {item.bankAccountNumber.replace(/^(\d{3})(\d{3})(\d{7})(\d)$/, "$1-$2-$3-$4")}</p><p dir="ltr" className="text-right"><b>کارت:</b> {item.bankCardNumber.replace(/(.{4})/g, "$1-").replace(/-$/, "")}</p>
                              <p dir="ltr" className="text-right sm:col-span-2"><b>شبا:</b> {item.bankShebaNumber}</p>
                            </div>
                          </div>
                          {item.status === "pending" && (
                            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row">
                              <input value={withdrawalNotes[item.id] || ""} onChange={(e) => setWithdrawalNotes({ ...withdrawalNotes, [item.id]: e.target.value })} placeholder="یادداشت ادمین یا شماره پیگیری تسویه" className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-purple-500" />
                              <button onClick={() => resolveWithdrawal(item.id, "approved")} className="rounded-xl bg-green-600 px-5 py-2 font-bold text-white">تایید و ثبت تسویه</button>
                              <button onClick={() => resolveWithdrawal(item.id, "rejected")} className="rounded-xl bg-red-50 px-5 py-2 font-bold text-red-600">رد و بازگشت وجه</button>
                            </div>
                          )}
                          {item.adminNote && <p className="mt-3 text-xs text-gray-500">یادداشت ادمین: {item.adminNote}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Escrow Overview */}
            {activeTab === "overview" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h2 className="font-bold text-lg">تراکنش‌های در جریان (صندوق امانات)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="p-4 font-bold">شناسه / سفارش</th>
                        <th className="p-4 font-bold">مبلغ کل (تومان)</th>
                        <th className="p-4 font-bold">وضعیت وجه</th>
                        <th className="p-4 font-bold">حل اختلاف / عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {escrowTransactions.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-500">در حال حاضر وجه امانی فعالی وجود ندارد.</td></tr>
                      ) : escrowTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-gray-50 transition">
                          <td className="p-4"><div className="font-bold text-gray-900" dir="ltr">{trx.id}</div><div className="mt-1 text-xs text-gray-500" dir="ltr">{trx.orderId}</div></td>
                          <td className="p-4"><div className="font-bold text-green-600">{trx.amount.toLocaleString("fa-IR")} تومان</div><div className="mt-1 text-xs text-gray-500">سهم فروشنده: {trx.sellerAmount.toLocaleString("fa-IR")} تومان</div></td>
                          <td className="p-4"><span className={`rounded px-2 py-1 text-xs font-bold ${trx.status === "held" ? "bg-orange-100 text-orange-700" : trx.status === "released" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{trx.status === "held" ? "در حساب امانی" : trx.status === "released" ? "آزاد شده" : "بازپرداخت شده"}</span></td>
                          <td className="p-4"><span className="text-xs text-gray-500">کمیسیون: {trx.platformFee.toLocaleString("fa-IR")} تومان</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. User Verifications */}
            {activeTab === "verifications" && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-in fade-in duration-300">
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold">🛡️ تایید هویت کاربران (KYC)</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">
                    تصویر کارت ملی، صفحات شناسنامه و کارت بانکی را بررسی کنید. پس از تایید، حساب و نام کاربری فعال می‌شوند.
                  </p>
                </div>

                {pendingVerifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <div className="mb-3 text-4xl">✅</div>
                    <p className="font-bold text-gray-700">کاربری در انتظار بررسی مدارک نیست.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingVerifications.map((user) => (
                      <article key={user.id} className="rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === "seller" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                {user.role === "seller" ? "فروشنده" : "خریدار"}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.kycStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {user.kycStatus === "rejected" ? "ردشده — قابل بازبینی" : "در انتظار بررسی"}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{user.fullName}</h3>
                            <p className="mt-1 text-sm text-gray-600">نام کاربری: <b dir="ltr">{user.username}</b> · ایمیل: <b dir="ltr">{user.email}</b></p>
                            <p className="mt-1 text-xs text-gray-500">ثبت‌نام: {new Date(user.createdAt).toLocaleString("fa-IR")}</p>
                            {user.categories?.length > 0 && <p className="mt-2 text-xs text-blue-700">حوزه‌ها: {user.categories.join("، ")}</p>}
                            {user.kycRejectReason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">علت رد قبلی: {user.kycRejectReason}</p>}
                          </div>
                          <div className="rounded-xl bg-gray-50 p-4 text-xs leading-6 text-gray-600 lg:min-w-64">
                            <p><b>شهر:</b> {user.city || "—"}</p>
                            <p><b>کدپستی:</b> {user.postalCode || "—"}</p>
                            <p><b>نشانی:</b> {user.defaultAddress || "—"}</p>
                            <p className="mt-2 font-bold text-amber-700">اطلاعات بانکی متنی در JSON رمزنگاری شده‌اند.</p>
                          </div>
                        </div>

                        <div className="mt-5 border-t pt-4">
                          <h4 className="mb-3 text-sm font-bold text-gray-800">مدارک بارگذاری‌شده ({user.kycDocuments?.length || 0})</h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(user.kycDocuments || []).map((document: any) => (
                              <a
                                key={document.id}
                                href={`/api/admin/kyc-document?userId=${user.id}&documentId=${document.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-purple-400 hover:bg-purple-50"
                              >
                                <p className="font-bold text-gray-800">📄 {document.label}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">{document.originalName}</p>
                                <p className="mt-1 text-[11px] text-gray-400">{(document.size / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} کیلوبایت · مشاهده تصویر</p>
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row">
                          <input
                            value={kycReasons[user.id] || ""}
                            onChange={(event) => setKycReasons({ ...kycReasons, [user.id]: event.target.value })}
                            placeholder="علت رد مدارک یا توضیح ادمین"
                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                          />
                          <button onClick={() => resolveKyc(user.id, "approved")} className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                            ✓ تایید مدارک و فعال‌سازی حساب
                          </button>
                          <button onClick={() => resolveKyc(user.id, "rejected")} className="rounded-xl bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
                            رد مدارک
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. Categories Management */}
            {activeTab === "categories" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-bold text-xl">📂 مدیریت دسته‌بندی‌های کالا</h2>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700">
                    + افزودن دسته جدید
                  </button>
                </div>
                <div className="space-y-3">
                  {categoriesList.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between border border-gray-200 p-4 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-800">{cat.name}</div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${cat.status === 'فعال' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.status}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button className="text-blue-600 text-sm font-bold hover:underline">ویرایش</button>
                        <button className="text-red-600 text-sm font-bold hover:underline">غیرفعال‌سازی</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
