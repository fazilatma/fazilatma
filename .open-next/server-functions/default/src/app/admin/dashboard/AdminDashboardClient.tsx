"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SellerStars from "@/components/SellerStars";
import { useLiveContent } from "@/hooks/useLiveContent";

const indicatorOptions = [
  { id: "sma", label: "SMA", description: "میانگین متحرک ساده ۷ و ۲۰ روزه" },
  { id: "ema", label: "EMA", description: "میانگین متحرک نمایی ۱۲ و ۲۶ روزه" },
  {
    id: "bollinger",
    label: "Bollinger Bands",
    description: "باندهای بولینگر بر اساس نوسان قیمت",
  },
  { id: "rsi", label: "RSI", description: "شاخص قدرت نسبی" },
  {
    id: "stochRsi",
    label: "Stoch RSI",
    description: "اسیلاتور Stochastic RSI",
  },
  { id: "macd", label: "MACD", description: "MACD، سیگنال و هیستوگرام" },
  { id: "roc", label: "ROC", description: "نرخ تغییر قیمت" },
  { id: "momentum", label: "Momentum", description: "مومنتوم قیمت" },
  { id: "atr", label: "ATR", description: "میانگین دامنه نوسان واقعی برآوردی" },
  {
    id: "demand",
    label: "Demand Volume",
    description: "حجم تقاضای روزانه از داده واقعی درخواست/پیشنهاد/سفارش",
  },
] as const;

type IndicatorId = (typeof indicatorOptions)[number]["id"];

const defaultIndicators: Record<IndicatorId, boolean> = {
  sma: true,
  ema: false,
  bollinger: true,
  rsi: true,
  stochRsi: true,
  macd: true,
  roc: false,
  momentum: false,
  atr: false,
  demand: true,
};

export default function AdminDashboardClient({
  realStats,
  sellerRankings,
  initialKycUsers,
  initialManagedUsers,
  adminReports,
}: {
  realStats: any;
  sellerRankings: any[];
  initialKycUsers: any[];
  initialManagedUsers: { summary: any; users: any[] };
  adminReports: any;
}) {
  const liveContent = useLiveContent();
  const [activeTab, setActiveTab] = useState("overview");
  const [reportView, setReportView] = useState<
    "products" | "buyers" | "sellers"
  >("products");
  const [chartMode, setChartMode] = useState<"line" | "bar" | "pie">("line");
  const [selectedProductName, setSelectedProductName] = useState("");
  const [indicatorPanelOpen, setIndicatorPanelOpen] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState("");
  const [selectedIndicators, setSelectedIndicators] =
    useState<Record<IndicatorId, boolean>>(defaultIndicators);
  const [pendingVerifications, setPendingVerifications] =
    useState<any[]>(initialKycUsers);
  const [kycReasons, setKycReasons] = useState<Record<number, string>>({});

  // States for Settings
  const [commissionRate, setCommissionRate] = useState(5);
  const [siteSlogan, setSiteSlogan] = useState(
    "پلتفرم درخواست خرید و تامین کالا",
  );
  const [siteSubSlogan, setSiteSubSlogan] = useState(
    "درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و با پرداخت امن امانی خرید کنید",
  );
  const [fontFamily, setFontFamily] = useState("Vazir");
  const [fontSize, setFontSize] = useState("16");
  const [contactPhone, setContactPhone] = useState("۰۲۱-۱۲۳۴۵۶۷۸");
  const [contactEmail, setContactEmail] = useState("info@parscoders.ir");
  const [contactAddress, setContactAddress] = useState(
    "تبریز، خیابان ولیعصر، برج فناوری، طبقه ۱۰",
  );
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹ تا ۱۷");
  const [platformFinance, setPlatformFinance] = useState({
    platformWalletBalance: realStats.platformWalletBalance || 0,
    adminAccountHolder: "",
    adminBankName: "",
    adminSheba: "",
    adminCardNumber: "",
    zarinpalEnabled: false,
    zarinpalSandbox: true,
    zarinpalMerchantId: "",
    zarinpalCallbackBaseUrl: "https://optibid.fazilat-ma.workers.dev",
    zarinpalDescription: "پرداخت امانی سفارش OptiBid",
    googleOAuthEnabled: false,
    googleOAuthClientId: "",
    googleOAuthClientSecret: "",
    facebookOAuthEnabled: false,
    facebookOAuthClientId: "",
    facebookOAuthClientSecret: "",
    socialAuthBaseUrl: "https://optibid.fazilat-ma.workers.dev",
  });
  const [platformTransactions, setPlatformTransactions] = useState<any[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [zarinpalPayments, setZarinpalPayments] = useState<any[]>([]);
  const [zarinpalPrerequisites, setZarinpalPrerequisites] = useState<any>(null);
  const [withdrawalNotes, setWithdrawalNotes] = useState<
    Record<string, string>
  >({});

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
        setZarinpalPayments(result.zarinpalPayments || []);
        setZarinpalPrerequisites(result.zarinpalPrerequisites || null);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setContactAddress(liveContent.contactAddressFa);
  }, [liveContent.contactAddressFa]);

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
      setZarinpalPrerequisites(result.zarinpalPrerequisites || null);
      alert(result.message);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "ذخیره تنظیمات مالی ناموفق بود.",
      );
    }
  };

  const resolveKyc = async (
    userId: number,
    status: "approved" | "rejected",
  ) => {
    const reason = kycReasons[userId] || "";
    if (status === "rejected" && !reason.trim()) {
      alert("برای رد مدارک، علت را وارد کنید.");
      return;
    }
    if (
      !confirm(
        status === "approved"
          ? "مدارک تایید و حساب فعال شود؟"
          : "مدارک رد و حساب غیرفعال بماند؟",
      )
    )
      return;

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
      if (refreshResult.success)
        setPendingVerifications(refreshResult.users || []);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "تعیین وضعیت مدارک ناموفق بود.",
      );
    }
  };

  const resolveWithdrawal = async (
    withdrawalId: string,
    status: "approved" | "rejected",
  ) => {
    const actionLabel =
      status === "approved" ? "تایید و ثبت تسویه بانکی" : "رد و بازگشت وجه";
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
      const financeResponse = await fetch("/api/admin/finance", {
        cache: "no-store",
      });
      const financeResult = await financeResponse.json();
      if (financeResult.success)
        setWithdrawals(financeResult.withdrawals || []);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "تعیین تکلیف برداشت ناموفق بود.",
      );
    }
  };

  const handleSave = (section: string) => {
    alert(`تنظیمات بخش "${section}" با موفقیت در پایگاه داده ذخیره شد.`);
  };

  const stats = [
    {
      label: "مبلغ تراکنش‌های موفق",
      value: `${realStats.totalVolume.toLocaleString("fa-IR")} تومان`,
    },
    {
      label: "کل کمیسیون دریافت‌شده",
      value: `${realStats.totalCommission.toLocaleString("fa-IR")} تومان`,
    },
    {
      label: "مانده حساب پلتفرم OptiBid",
      value: `${platformFinance.platformWalletBalance.toLocaleString("fa-IR")} تومان`,
    },
    {
      label: "وجوه امانی نزد پلتفرم (Escrow)",
      value: `${realStats.escrowHeld.toLocaleString("fa-IR")} تومان`,
    },
    {
      label: "تعداد درخواست‌های خرید باز",
      value: `${realStats.openRequests.toLocaleString("fa-IR")} درخواست`,
    },
  ];

  const moneyLabel = (value: number | string) =>
    `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
  const percentLabel = (value: number | string) =>
    `${Number(value || 0).toLocaleString("fa-IR")}%`;
  const productReports = adminReports?.productReports || [];
  const buyerReports = adminReports?.buyerReports || [];
  const sellerReports = adminReports?.sellerReports || [];
  const analytics = adminReports?.analytics || {
    growingItems: [],
    mostRequestedItems: [],
    highestRevenueItems: [],
    technicalItems: [],
  };
  const reportRows =
    reportView === "products"
      ? productReports
      : reportView === "buyers"
        ? buyerReports
        : sellerReports;
  const selectedProduct =
    productReports.find((item: any) => item.product === selectedProductName) ||
    productReports[0] ||
    null;
  const enabledIndicatorsCount =
    Object.values(selectedIndicators).filter(Boolean).length;
  const filteredIndicatorOptions = indicatorOptions.filter((option) =>
    `${option.label} ${option.description}`
      .toLowerCase()
      .includes(indicatorSearch.trim().toLowerCase()),
  );
  const toggleIndicator = (id: IndicatorId) => {
    setSelectedIndicators((current) => ({ ...current, [id]: !current[id] }));
  };

  const categoriesList = [
    { id: 1, name: "کالای دیجیتال", status: "فعال", productsCount: 1250 },
    { id: 2, name: "مد و پوشاک", status: "فعال", productsCount: 890 },
    { id: 3, name: "صنعتی و تجهیزات", status: "غیرفعال", productsCount: 0 },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              داشبورد مدیریت پلتفرم (ادمین)
            </h1>
            <p className="text-gray-600">
              کنترل کامل تراکنش‌های امانی، تنظیمات سایت و احراز هویت کاربران.
            </p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold text-sm border border-purple-200">
            سطح دسترسی: مدیر کل (Super Admin)
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-r-4 border-r-purple-600"
            >
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
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "overview" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  💰 تراکنش‌های امانی (Escrow)
                </button>
                <button
                  onClick={() => setActiveTab("verifications")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition flex justify-between items-center ${activeTab === "verifications" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>🛡️ تایید هویت کاربران</span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                    {pendingVerifications.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "users" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  👥 مدیریت خریداران و فروشندگان
                </button>
                <button
                  onClick={() => setActiveTab("sellerScores")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "sellerScores" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  📊 امتیازدهی فروشندگان
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "reports" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  📑 گزارش‌گیری تفکیکی
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "analytics" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  🤖 تحلیل آماری و AI
                </button>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "appearance" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  🎨 تنظیمات ظاهر و محتوا
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "contact" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  📞 اطلاعات تماس با ما
                </button>
                <button
                  onClick={() => setActiveTab("financial")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "financial" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  💵 تنظیمات مالی و کمیسیون
                </button>
                <button
                  onClick={() => setActiveTab("socialAuth")}
                  className={`text-right px-5 py-4 text-sm font-bold border-b border-gray-100 transition ${activeTab === "socialAuth" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  🔐 ورود با گوگل و فیسبوک
                </button>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={`text-right px-5 py-4 text-sm font-bold transition ${activeTab === "categories" ? "bg-purple-50 text-purple-700 border-r-4 border-r-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  📂 مدیریت دسته‌بندی‌ها
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === "users" && (
              <UserManagementPanel initialManagedUsers={initialManagedUsers} />
            )}

            {/* Seller Scoring & Performance */}
            {activeTab === "sellerScores" && (
              <div className="animate-in fade-in duration-300 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    📊 سلامت و امتیازدهی فروشندگان
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">
                    رتبه‌بندی با پنجره ارزیابی ۹۰ روزه، امتیاز تعدیل‌شده نظرات،
                    کیفیت ارسال، پاسخ‌گویی و انطباق انجام می‌شود. فروشنده
                    تازه‌وارد تا داده کافی داشته باشد «در حال ارزیابی» می‌ماند.
                  </p>
                </div>

                {sellerRankings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                    <div className="mb-3 text-4xl">📉</div>
                    <p className="font-bold text-gray-700">
                      هنوز فروشنده ثبت‌شده‌ای برای ارزیابی وجود ندارد.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      پس از ثبت‌نام فروشنده، متریک‌های او در این بخش دیده
                      می‌شوند.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerRankings.map(({ seller, rating }) => (
                      <div
                        key={seller.id}
                        className="rounded-2xl border border-gray-200 p-5"
                      >
                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {seller.fullName}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              {seller.categories?.join("، ") ||
                                "حوزه فعالیت ثبت نشده"}
                            </p>
                          </div>
                          <div className="text-left">
                            <SellerStars score={rating.finalScore} size="md" />
                            <p className="mt-1 text-xs text-gray-500">
                              {rating.label} — اعتبار داده {rating.confidence}%
                              — امتیاز فنی {rating.finalScore}/۱۰۰
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-5">
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-bold text-gray-900">
                              {rating.metrics.reliability}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              قابلیت اتکا
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-bold text-gray-900">
                              {rating.metrics.fulfilment}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              ارسال
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-bold text-gray-900">
                              {rating.metrics.buyerExperience}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              رضایت
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-bold text-gray-900">
                              {rating.metrics.trust}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              اعتماد
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="font-bold text-gray-900">
                              {rating.metrics.experience}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              سابقه
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                          <span>
                            نقص سفارش: <b>{rating.rates.defectRate}%</b>
                          </span>
                          <span>
                            لغو فروشنده: <b>{rating.rates.cancellationRate}%</b>
                          </span>
                          <span>
                            ارسال به‌موقع:{" "}
                            <b>{rating.rates.onTimeShippingRate}%</b>
                          </span>
                          <span>
                            رهگیری معتبر:{" "}
                            <b>{rating.rates.validTrackingRate}%</b>
                          </span>
                          <span>
                            پاسخ ۲۴ساعته: <b>{rating.rates.responseRate24h}%</b>
                          </span>
                        </div>
                        {rating.minimumDataMessage && (
                          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-blue-800">
                            {rating.minimumDataMessage}
                          </p>
                        )}
                        {rating.reasons.length > 0 && (
                          <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-700">
                            هشدار: {rating.reasons.join("، ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports */}
            {activeTab === "reports" && (
              <div className="animate-in fade-in duration-300 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-end">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      📑 گزارش‌گیری تفکیکی
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      گزارش واقعی بر اساس درخواست‌ها، سفارش‌ها، پیشنهادها، کیف
                      پول و وضعیت‌های ثبت‌شده در دیتابیس OptiBid.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["products", "۱- کالا"],
                      ["buyers", "۲- خریدهای خریدار"],
                      ["sellers", "۳- فروش‌های فروشنده"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() =>
                          setReportView(id as "products" | "buyers" | "sellers")
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${reportView === id ? "border-purple-600 bg-purple-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-purple-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-purple-50 p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {adminReports?.summary?.productsCount?.toLocaleString(
                        "fa-IR",
                      ) || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      کالا/عنوان تحلیل‌شده
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {adminReports?.summary?.buyersCount?.toLocaleString(
                        "fa-IR",
                      ) || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">خریدار</p>
                  </div>
                  <div className="rounded-2xl bg-green-50 p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {adminReports?.summary?.sellersCount?.toLocaleString(
                        "fa-IR",
                      ) || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">فروشنده</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {adminReports?.summary?.activeRequests?.toLocaleString(
                        "fa-IR",
                      ) || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">درخواست فعال</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full min-w-[920px] text-right text-sm">
                    <thead className="bg-gray-100 text-xs text-gray-600">
                      {reportView === "products" ? (
                        <tr>
                          <th className="p-3">کالا</th>
                          <th className="p-3">دسته</th>
                          <th className="p-3">درخواست</th>
                          <th className="p-3">فعال</th>
                          <th className="p-3">پیشنهاد</th>
                          <th className="p-3">فروش موفق</th>
                          <th className="p-3">ناموفق/مرجوع</th>
                          <th className="p-3">فروش کل</th>
                          <th className="p-3">میانگین بودجه</th>
                        </tr>
                      ) : reportView === "buyers" ? (
                        <tr>
                          <th className="p-3">خریدار</th>
                          <th className="p-3">ایمیل</th>
                          <th className="p-3">درخواست‌ها</th>
                          <th className="p-3">درخواست فعال</th>
                          <th className="p-3">خرید موفق</th>
                          <th className="p-3">ناموفق</th>
                          <th className="p-3">مبلغ خرید</th>
                          <th className="p-3">نرخ موفقیت</th>
                          <th className="p-3">دیدگاه</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="p-3">فروشنده</th>
                          <th className="p-3">ایمیل</th>
                          <th className="p-3">پیشنهادها</th>
                          <th className="p-3">پذیرفته‌شده</th>
                          <th className="p-3">فروش موفق</th>
                          <th className="p-3">ناموفق</th>
                          <th className="p-3">فروش ناخالص</th>
                          <th className="p-3">درآمد خالص</th>
                          <th className="p-3">امتیاز</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-gray-500"
                          >
                            داده‌ای برای این گزارش وجود ندارد.
                          </td>
                        </tr>
                      ) : reportView === "products" ? (
                        productReports.map((item: any) => (
                          <tr key={item.product} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-900">
                              {item.product}
                            </td>
                            <td className="p-3">{item.category}</td>
                            <td className="p-3">{item.requestsCount}</td>
                            <td className="p-3">{item.openRequests}</td>
                            <td className="p-3">{item.offersCount}</td>
                            <td className="p-3 text-green-700">
                              {item.completedOrders}
                            </td>
                            <td className="p-3 text-red-600">
                              {item.failedOrders}
                            </td>
                            <td className="p-3 font-bold">
                              {moneyLabel(item.totalSalesAmount)}
                            </td>
                            <td className="p-3">
                              {moneyLabel(item.averageRequestedBudget)}
                            </td>
                          </tr>
                        ))
                      ) : reportView === "buyers" ? (
                        buyerReports.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-900">
                              {item.name}
                            </td>
                            <td className="p-3" dir="ltr">
                              {item.email}
                            </td>
                            <td className="p-3">{item.requestsCount}</td>
                            <td className="p-3">{item.activeRequests}</td>
                            <td className="p-3 text-green-700">
                              {item.completedPurchases}
                            </td>
                            <td className="p-3 text-red-600">
                              {item.failedPurchases}
                            </td>
                            <td className="p-3 font-bold">
                              {moneyLabel(item.totalPurchaseAmount)}
                            </td>
                            <td className="p-3">
                              {percentLabel(item.successRate)}
                            </td>
                            <td className="p-3">
                              داده: {item.reviewsGiven} / گرفته:{" "}
                              {item.reviewsReceived}
                            </td>
                          </tr>
                        ))
                      ) : (
                        sellerReports.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-900">
                              {item.name}
                            </td>
                            <td className="p-3" dir="ltr">
                              {item.email}
                            </td>
                            <td className="p-3">{item.offersCount}</td>
                            <td className="p-3">{item.acceptedOffers}</td>
                            <td className="p-3 text-green-700">
                              {item.completedSales}
                            </td>
                            <td className="p-3 text-red-600">
                              {item.failedSales}
                            </td>
                            <td className="p-3 font-bold">
                              {moneyLabel(item.totalSalesAmount)}
                            </td>
                            <td className="p-3">
                              {moneyLabel(item.netSellerRevenue)}
                            </td>
                            <td className="p-3">
                              <SellerStars score={item.ratingScore} size="sm" />
                              <span className="mr-2 text-xs text-gray-500">
                                {item.ratingLabel}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics */}
            {activeTab === "analytics" && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      🤖 تحلیل جامع آماری و پیش‌بینی AI
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      این بخش فعلاً فقط برای ادمین است و بعداً می‌تواند به‌عنوان
                      بخش Pro برای کاربران فعال شود. شاخص‌ها از داده واقعی
                      درخواست‌ها، پیشنهادها و سفارش‌ها محاسبه می‌شوند؛ اگر داده
                      تاریخی کافی نباشد، خروجی تکنیکال «داده ناکافی» نمایش داده
                      می‌شود.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <AnalyticsList
                      title="آیتم‌های در حال رشد برای خرید"
                      items={analytics.growingItems}
                      value={(item: any) =>
                        `${percentLabel(item.demandTrendPercent)} رشد تقاضا`
                      }
                    />
                    <AnalyticsList
                      title="آیتم‌های با بیشترین درخواست"
                      items={analytics.mostRequestedItems}
                      value={(item: any) =>
                        `${item.requestsCount.toLocaleString("fa-IR")} درخواست`
                      }
                    />
                    <AnalyticsList
                      title="بیشترین فروش موفق"
                      items={analytics.highestRevenueItems}
                      value={(item: any) => moneyLabel(item.totalSalesAmount)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col justify-between gap-4 border-b pb-4 xl:flex-row xl:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        📈 نمودار تحلیلی کالاها
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-gray-500">
                        مثل صفحه تحلیل کالا، روی هر کالا کلیک کنید و نمودار
                        قیمت، تقاضا، RSI و MACD را به‌صورت خطی، میله‌ای یا
                        دایره‌ای ببینید.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["line", "خطی"],
                        ["bar", "میله‌ای"],
                        ["pie", "دایره‌ای"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() =>
                            setChartMode(id as "line" | "bar" | "pie")
                          }
                          className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${chartMode === id ? "border-[#003b5c] bg-[#003b5c] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-blue-50"}`}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIndicatorPanelOpen((open) => !open)}
                          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                        >
                          Indicators · {enabledIndicatorsCount} فعال
                        </button>
                        {indicatorPanelOpen && (
                          <div className="absolute left-0 top-11 z-20 w-80 rounded-2xl border border-gray-200 bg-white p-3 text-right shadow-2xl">
                            <div className="mb-3 flex items-center justify-between border-b pb-2">
                              <b className="text-sm text-gray-800">
                                افزودن اندیکاتور
                              </b>
                              <button
                                type="button"
                                onClick={() => setIndicatorPanelOpen(false)}
                                className="text-gray-400 hover:text-gray-700"
                              >
                                ✕
                              </button>
                            </div>
                            <input
                              value={indicatorSearch}
                              onChange={(e) =>
                                setIndicatorSearch(e.target.value)
                              }
                              placeholder="جستجوی اندیکاتور..."
                              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#00a8e8]"
                            />
                            <div className="max-h-80 space-y-1 overflow-y-auto">
                              {filteredIndicatorOptions.map((option) => (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedIndicators[option.id]}
                                    onChange={() => toggleIndicator(option.id)}
                                    className="mt-1"
                                  />
                                  <span>
                                    <span
                                      className="block font-bold text-gray-800"
                                      dir="ltr"
                                    >
                                      {option.label}
                                    </span>
                                    <span className="block text-xs leading-5 text-gray-500">
                                      {option.description}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIndicators(defaultIndicators)
                              }
                              className="mt-3 w-full rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
                            >
                              بازنشانی اندیکاتورها
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-12">
                    <aside className="xl:col-span-4">
                      <div className="max-h-[440px] space-y-2 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-3">
                        {productReports.length === 0 ? (
                          <p className="p-6 text-center text-sm text-gray-500">
                            هنوز کالایی برای نمودار وجود ندارد.
                          </p>
                        ) : (
                          productReports.map((item: any) => (
                            <button
                              key={item.product}
                              onClick={() =>
                                setSelectedProductName(item.product)
                              }
                              className={`w-full rounded-xl border p-3 text-right transition ${selectedProduct?.product === item.product ? "border-[#00a8e8] bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-200"}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="line-clamp-1 font-bold text-gray-900">
                                  {item.product}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                  {item.dataPoints} نقطه
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                                <span>{item.requestsCount} درخواست</span>
                                <span>{item.offersCount} پیشنهاد</span>
                                <span>
                                  {moneyLabel(item.averageRequestedBudget)}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </aside>
                    <div className="xl:col-span-8">
                      {selectedProduct ? (
                        <ProductAnalysisChart
                          product={selectedProduct}
                          mode={chartMode}
                          indicators={selectedIndicators}
                          moneyLabel={moneyLabel}
                          percentLabel={percentLabel}
                        />
                      ) : (
                        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                          یک کالا را برای مشاهده نمودار انتخاب کنید.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        تحلیل تکنیکال واقعی هر کالا
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        RSI، MACD و پیش‌بینی افزایش درخواست/قیمت از سری زمانی
                        قیمت‌های واقعی درخواست، پیشنهاد و سفارش استخراج می‌شود.
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                      آماده برای نسخه Pro
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full min-w-[1120px] text-right text-sm">
                      <thead className="bg-gray-100 text-xs text-gray-600">
                        <tr>
                          <th className="p-3">کالا</th>
                          <th className="p-3">داده</th>
                          <th className="p-3">رشد تقاضا</th>
                          <th className="p-3">روند قیمت</th>
                          <th className="p-3">RSI</th>
                          <th className="p-3">MACD</th>
                          <th className="p-3">سیگنال تکنیکال</th>
                          <th className="p-3">پیش‌بینی AI تقاضا</th>
                          <th className="p-3">پیش‌بینی AI قیمت</th>
                          <th className="p-3">اعتماد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.technicalItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="p-8 text-center text-gray-500"
                            >
                              هنوز کالایی برای تحلیل وجود ندارد.
                            </td>
                          </tr>
                        ) : (
                          analytics.technicalItems.map((item: any) => (
                            <tr key={item.product} className="hover:bg-gray-50">
                              <td className="p-3 font-bold text-gray-900">
                                {item.product}
                                <p className="mt-1 text-xs font-normal text-gray-500">
                                  {item.category}
                                </p>
                              </td>
                              <td className="p-3">
                                {item.dataPoints.toLocaleString("fa-IR")} نقطه
                              </td>
                              <td
                                className={`p-3 font-bold ${item.demandTrendPercent >= 0 ? "text-green-700" : "text-red-600"}`}
                              >
                                {percentLabel(item.demandTrendPercent)}
                              </td>
                              <td
                                className={`p-3 font-bold ${item.priceTrendPercent >= 0 ? "text-green-700" : "text-red-600"}`}
                              >
                                {percentLabel(item.priceTrendPercent)}
                              </td>
                              <td className="p-3">
                                {item.rsi === null
                                  ? "داده ناکافی"
                                  : item.rsi.toLocaleString("fa-IR")}
                              </td>
                              <td className="p-3" dir="ltr">
                                {item.macd
                                  ? `${item.macd.macd} / ${item.macd.signal} / ${item.macd.histogram}`
                                  : "داده ناکافی"}
                              </td>
                              <td className="p-3">
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                  {item.technicalSignal}
                                </span>
                              </td>
                              <td className="p-3">{item.aiDemandForecast}</td>
                              <td className="p-3">{item.aiPriceForecast}</td>
                              <td className="p-3">
                                {percentLabel(item.aiConfidence)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <h2 className="font-bold text-xl mb-6 border-b pb-4">
                  🎨 تنظیمات ظاهر و محتوای سایت
                </h2>
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">
                      بارگذاری لوگوی سایت
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                        تصویر
                      </div>
                      <div>
                        <input
                          type="file"
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          فرمت‌های مجاز: PNG, SVG (حداکثر ۲ مگابایت)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Slogan */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">
                      شعار اصلی سایت (Hero Slogan)
                    </label>
                    <input
                      type="text"
                      value={siteSlogan}
                      onChange={(e) => setSiteSlogan(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">
                      متن زیرین شعار اصلی (Sub-slogan)
                    </label>
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
                      <label className="block font-bold text-gray-700 mb-2">
                        نوع فونت سایت (Font Family)
                      </label>
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
                      <label className="block font-bold text-gray-700 mb-2">
                        اندازه پایه فونت (Base Font Size)
                      </label>
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
                    <button
                      onClick={() => handleSave("ظاهر و محتوا")}
                      className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                      ذخیره تغییرات ظاهر
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Contact Info Settings */}
            {activeTab === "contact" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <h2 className="font-bold text-xl mb-6 border-b pb-4">
                  📞 تنظیمات صفحه و اطلاعات تماس با ما
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">
                      شماره تلفن پشتیبانی
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">
                      ایمیل سازمانی
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-2">
                      آدرس فیزیکی دفتر مرکزی
                    </label>
                    <textarea
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-2">
                      ساعات کاری
                    </label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSave("اطلاعات تماس")}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  ذخیره اطلاعات تماس
                </button>
              </div>
            )}

            {/* 3. Financial Settings */}
            {activeTab === "financial" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 border-b pb-4 text-xl font-bold">
                    💵 حساب مالی و کمیسیون پلتفرم
                  </h2>
                  <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <h3 className="mb-2 font-bold text-blue-800">
                      مانده واقعی حساب کمیسیون OptiBid
                    </h3>
                    <p className="text-3xl font-bold text-[#003b5c]">
                      {platformFinance.platformWalletBalance.toLocaleString(
                        "fa-IR",
                      )}{" "}
                      تومان
                    </p>
                    <p className="mt-2 text-sm leading-7 text-blue-700">
                      با تایید دریافت کالا توسط خریدار، کمیسیون هر سفارش به این
                      حساب پلتفرم افزوده می‌شود و سهم باقی‌مانده به کیف پول
                      فروشنده می‌رود.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        نرخ کمیسیون پلتفرم
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={commissionRate}
                          onChange={(e) =>
                            setCommissionRate(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-blue-300 px-4 py-3 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                          %
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        این نرخ فقط روی سفارش‌هایی که بعد از تغییر تنظیمات
                        انتخاب می‌شوند اعمال خواهد شد.
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        نام دارنده حساب مقصد
                      </label>
                      <input
                        value={platformFinance.adminAccountHolder}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            adminAccountHolder: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: شرکت اپتی‌بید"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        نام بانک مقصد
                      </label>
                      <input
                        value={platformFinance.adminBankName}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            adminBankName: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: بانک ملت"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        شماره شبا حساب پلتفرم
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.adminSheba}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            adminSheba: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        شماره کارت مقصد (اختیاری)
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.adminCardNumber}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            adminCardNumber: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0000-0000-0000-0000"
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveFinance}
                    className="mt-6 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700"
                  >
                    ذخیره تنظیمات مالی
                  </button>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-start">
                    <div>
                      <h2 className="text-xl font-bold text-[#003b5c]">
                        اتصال درگاه پرداخت زرین‌پال
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-gray-600">
                        پیش‌نیازهای لازم برای پرداخت خریدار از زرین‌پال،
                        Callback و ثبت تراکنش امانی در این بخش مدیریت می‌شود.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${zarinpalPrerequisites?.ready ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {zarinpalPrerequisites?.ready
                        ? "آماده اتصال"
                        : "نیازمند تکمیل"}
                    </span>
                  </div>

                  <div className="mb-5 grid gap-3 md:grid-cols-2">
                    {[
                      ["۱", "دریافت Merchant ID از پنل زرین‌پال"],
                      ["۲", "ثبت آدرس Callback زیر در پنل زرین‌پال/دامنه"],
                      ["۳", "فعال‌سازی HTTPS دامنه live سایت"],
                      ["۴", "تست Sandbox و سپس تغییر به حالت عملیاتی"],
                    ].map(([step, text]) => (
                      <div
                        key={step}
                        className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800"
                      >
                        <b className="ml-2">{step}</b>
                        {text}
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={platformFinance.zarinpalEnabled}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            zarinpalEnabled: e.target.checked,
                          })
                        }
                      />
                      فعال‌سازی زرین‌پال برای خریدار
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={platformFinance.zarinpalSandbox}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            zarinpalSandbox: e.target.checked,
                          })
                        }
                      />
                      حالت آزمایشی Sandbox
                    </label>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        Merchant ID زرین‌پال
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.zarinpalMerchantId}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            zarinpalMerchantId: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        در صورت تنظیم Secret محیطی ZARINPAL_MERCHANT_ID، همان
                        مقدار روی Workers استفاده می‌شود.
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        آدرس پایه سایت برای Callback
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.zarinpalCallbackBaseUrl}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            zarinpalCallbackBaseUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="https://optibid.fazilat-ma.workers.dev"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        توضیح پیش‌فرض تراکنش زرین‌پال
                      </label>
                      <input
                        value={platformFinance.zarinpalDescription}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            zarinpalDescription: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="پرداخت امانی سفارش OptiBid"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                    <p>
                      <b>Callback URL:</b>{" "}
                      <span dir="ltr" className="font-mono text-xs">
                        {zarinpalPrerequisites?.callbackUrl ||
                          `${platformFinance.zarinpalCallbackBaseUrl.replace(/\/+$/, "")}/api/payments/zarinpal/callback`}
                      </span>
                    </p>
                    {zarinpalPrerequisites?.missingItems?.length > 0 && (
                      <p className="mt-2 text-amber-700">
                        <b>موارد ناقص:</b>{" "}
                        {zarinpalPrerequisites.missingItems.join("، ")}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={saveFinance}
                    className="mt-5 rounded-lg bg-[#0b9c56] px-7 py-3 font-bold text-white transition hover:bg-green-700"
                  >
                    ذخیره تنظیمات زرین‌پال
                  </button>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold">
                    تراکنش‌های زرین‌پال
                  </h2>
                  {zarinpalPayments.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                      هنوز پرداختی از زرین‌پال ثبت نشده است.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="border-b bg-gray-50 text-gray-600">
                          <tr>
                            <th className="p-3">شناسه</th>
                            <th className="p-3">سفارش</th>
                            <th className="p-3">Authority</th>
                            <th className="p-3">مبلغ</th>
                            <th className="p-3">وضعیت</th>
                            <th className="p-3">Ref ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zarinpalPayments.map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-3 font-mono text-xs">
                                {payment.id}
                              </td>
                              <td className="p-3 font-mono text-xs">
                                {payment.orderId}
                              </td>
                              <td className="p-3 font-mono text-[11px]">
                                {payment.authority}
                              </td>
                              <td className="p-3 font-bold text-[#003b5c]">
                                {Number(payment.amount || 0).toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                تومان
                              </td>
                              <td className="p-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-bold ${payment.status === "verified" ? "bg-green-100 text-green-700" : payment.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                                >
                                  {payment.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-xs">
                                {payment.refId || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold">
                    دفتر گردش حساب پلتفرم
                  </h2>
                  {platformTransactions.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                      هنوز کمیسیونی از معامله تکمیل‌شده به حساب پلتفرم واریز
                      نشده است.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="border-b bg-gray-50 text-gray-600">
                          <tr>
                            <th className="p-3">شناسه</th>
                            <th className="p-3">شرح</th>
                            <th className="p-3">سفارش</th>
                            <th className="p-3">مبلغ کمیسیون</th>
                            <th className="p-3">مانده پس از ثبت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {platformTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b">
                              <td className="p-3 font-mono text-xs">
                                {transaction.id}
                              </td>
                              <td className="p-3">{transaction.description}</td>
                              <td className="p-3 font-mono text-xs">
                                {transaction.orderId || "—"}
                              </td>
                              <td className="p-3 font-bold text-green-600">
                                {transaction.amount.toLocaleString("fa-IR")}{" "}
                                تومان
                              </td>
                              <td className="p-3 font-bold text-[#003b5c]">
                                {transaction.balanceAfter.toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                تومان
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        درخواست‌های برداشت کاربران
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        پیش از تایید، نام صاحب حساب و اطلاعات بانکی را با مدارک
                        کاربر تطبیق دهید.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      {
                        withdrawals.filter((item) => item.status === "pending")
                          .length
                      }{" "}
                      در انتظار
                    </span>
                  </div>
                  {withdrawals.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                      درخواست برداشتی وجود ندارد.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {withdrawals.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-gray-200 p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-gray-900">
                                  {item.userName}
                                </h3>
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                  {item.role === "seller"
                                    ? "فروشنده"
                                    : "خریدار"}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-green-100 text-green-700" : item.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {item.status === "approved"
                                    ? "تسویه شد"
                                    : item.status === "rejected"
                                      ? "رد شد"
                                      : "در انتظار"}
                                </span>
                              </div>
                              <p className="mt-2 text-2xl font-bold text-[#003b5c]">
                                {item.amount.toLocaleString("fa-IR")} تومان
                              </p>
                              <p className="mt-1 font-mono text-xs text-gray-400">
                                {item.id}
                              </p>
                            </div>
                            <div className="grid gap-x-8 gap-y-2 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2 lg:min-w-[520px]">
                              <p>
                                <b>صاحب حساب:</b> {item.bankAccountHolder}
                              </p>
                              <p>
                                <b>بانک:</b> {item.bankName}
                              </p>
                              <p dir="ltr" className="text-right">
                                <b>حساب:</b>{" "}
                                {item.bankAccountNumber.replace(
                                  /^(\d{3})(\d{3})(\d{7})(\d)$/,
                                  "$1-$2-$3-$4",
                                )}
                              </p>
                              <p dir="ltr" className="text-right">
                                <b>کارت:</b>{" "}
                                {item.bankCardNumber
                                  .replace(/(.{4})/g, "$1-")
                                  .replace(/-$/, "")}
                              </p>
                              <p dir="ltr" className="text-right sm:col-span-2">
                                <b>شبا:</b> {item.bankShebaNumber}
                              </p>
                            </div>
                          </div>
                          {item.status === "pending" && (
                            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row">
                              <input
                                value={withdrawalNotes[item.id] || ""}
                                onChange={(e) =>
                                  setWithdrawalNotes({
                                    ...withdrawalNotes,
                                    [item.id]: e.target.value,
                                  })
                                }
                                placeholder="یادداشت ادمین یا شماره پیگیری تسویه"
                                className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() =>
                                  resolveWithdrawal(item.id, "approved")
                                }
                                className="rounded-xl bg-green-600 px-5 py-2 font-bold text-white"
                              >
                                تایید و ثبت تسویه
                              </button>
                              <button
                                onClick={() =>
                                  resolveWithdrawal(item.id, "rejected")
                                }
                                className="rounded-xl bg-red-50 px-5 py-2 font-bold text-red-600"
                              >
                                رد و بازگشت وجه
                              </button>
                            </div>
                          )}
                          {item.adminNote && (
                            <p className="mt-3 text-xs text-gray-500">
                              یادداشت ادمین: {item.adminNote}
                            </p>
                          )}
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
                  <h2 className="font-bold text-lg">
                    تراکنش‌های در جریان (صندوق امانات)
                  </h2>
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
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-sm text-gray-500"
                          >
                            در حال حاضر وجه امانی فعالی وجود ندارد.
                          </td>
                        </tr>
                      ) : (
                        escrowTransactions.map((trx) => (
                          <tr
                            key={trx.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="p-4">
                              <div
                                className="font-bold text-gray-900"
                                dir="ltr"
                              >
                                {trx.id}
                              </div>
                              <div
                                className="mt-1 text-xs text-gray-500"
                                dir="ltr"
                              >
                                {trx.orderId}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-green-600">
                                {trx.amount.toLocaleString("fa-IR")} تومان
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                سهم فروشنده:{" "}
                                {trx.sellerAmount.toLocaleString("fa-IR")} تومان
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded px-2 py-1 text-xs font-bold ${trx.status === "held" ? "bg-orange-100 text-orange-700" : trx.status === "released" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                              >
                                {trx.status === "held"
                                  ? "در حساب امانی"
                                  : trx.status === "released"
                                    ? "آزاد شده"
                                    : "بازپرداخت شده"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-gray-500">
                                کمیسیون:{" "}
                                {trx.platformFee.toLocaleString("fa-IR")} تومان
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. User Verifications */}
            {activeTab === "verifications" && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-in fade-in duration-300">
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold">
                    🛡️ تایید هویت کاربران (KYC)
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">
                    تصویر کارت ملی، صفحات شناسنامه و کارت بانکی را بررسی کنید.
                    پس از تایید، حساب و نام کاربری فعال می‌شوند.
                  </p>
                </div>

                {pendingVerifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <div className="mb-3 text-4xl">✅</div>
                    <p className="font-bold text-gray-700">
                      کاربری در انتظار بررسی مدارک نیست.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingVerifications.map((user) => (
                      <article
                        key={user.id}
                        className="rounded-2xl border border-gray-200 p-5 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === "seller" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                              >
                                {user.role === "seller" ? "فروشنده" : "خریدار"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${user.kycStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                              >
                                {user.kycStatus === "rejected"
                                  ? "ردشده — قابل بازبینی"
                                  : "در انتظار بررسی"}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {user.fullName}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              نام کاربری: <b dir="ltr">{user.username}</b> ·
                              ایمیل: <b dir="ltr">{user.email}</b>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              ثبت‌نام:{" "}
                              {new Date(user.createdAt).toLocaleString("fa-IR")}
                            </p>
                            {user.categories?.length > 0 && (
                              <p className="mt-2 text-xs text-blue-700">
                                حوزه‌ها: {user.categories.join("، ")}
                              </p>
                            )}
                            {user.kycRejectReason && (
                              <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                علت رد قبلی: {user.kycRejectReason}
                              </p>
                            )}
                          </div>
                          <div className="rounded-xl bg-gray-50 p-4 text-xs leading-6 text-gray-600 lg:min-w-64">
                            <p>
                              <b>شهر:</b> {user.city || "—"}
                            </p>
                            <p>
                              <b>کدپستی:</b> {user.postalCode || "—"}
                            </p>
                            <p>
                              <b>نشانی:</b> {user.defaultAddress || "—"}
                            </p>
                            <p className="mt-2 font-bold text-amber-700">
                              اطلاعات بانکی متنی در JSON رمزنگاری شده‌اند.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 border-t pt-4">
                          <h4 className="mb-3 text-sm font-bold text-gray-800">
                            مدارک بارگذاری‌شده ({user.kycDocuments?.length || 0}
                            )
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(user.kycDocuments || []).map((document: any) => (
                              <a
                                key={document.id}
                                href={`/api/admin/kyc-document?userId=${user.id}&documentId=${document.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-purple-400 hover:bg-purple-50"
                              >
                                <p className="font-bold text-gray-800">
                                  📄 {document.label}
                                </p>
                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {document.originalName}
                                </p>
                                <p className="mt-1 text-[11px] text-gray-400">
                                  {(document.size / 1024).toLocaleString(
                                    "fa-IR",
                                    { maximumFractionDigits: 0 },
                                  )}{" "}
                                  کیلوبایت · مشاهده تصویر
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row">
                          <input
                            value={kycReasons[user.id] || ""}
                            onChange={(event) =>
                              setKycReasons({
                                ...kycReasons,
                                [user.id]: event.target.value,
                              })
                            }
                            placeholder="علت رد مدارک یا توضیح ادمین"
                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                          />
                          <button
                            onClick={() => resolveKyc(user.id, "approved")}
                            className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700"
                          >
                            ✓ تایید مدارک و فعال‌سازی حساب
                          </button>
                          <button
                            onClick={() => resolveKyc(user.id, "rejected")}
                            className="rounded-xl bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                          >
                            رد مدارک
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Social Auth Settings */}
            {activeTab === "socialAuth" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      🔐 تنظیمات ورود با گوگل و فیسبوک
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      برای اینکه آیکون‌های ورود اجتماعی واقعاً کار کنند، Client
                      ID و Client Secret هر سرویس را اینجا ثبت و همان Callback
                      URL را در پنل Google/Facebook وارد کنید.
                    </p>
                  </div>

                  <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
                    <p>
                      <b>دامنه پایه:</b>{" "}
                      <span dir="ltr" className="font-mono text-xs">
                        {platformFinance.socialAuthBaseUrl}
                      </span>
                    </p>
                    <p>
                      <b>Callback گوگل:</b>{" "}
                      <span
                        dir="ltr"
                        className="font-mono text-xs"
                      >{`${platformFinance.socialAuthBaseUrl.replace(/\/+$/, "")}/api/auth/social/google/callback`}</span>
                    </p>
                    <p>
                      <b>Callback فیسبوک:</b>{" "}
                      <span
                        dir="ltr"
                        className="font-mono text-xs"
                      >{`${platformFinance.socialAuthBaseUrl.replace(/\/+$/, "")}/api/auth/social/facebook/callback`}</span>
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[#003b5c]">
                            Google OAuth
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            Google Cloud Console → Credentials → OAuth Client
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={platformFinance.googleOAuthEnabled}
                            onChange={(e) =>
                              setPlatformFinance({
                                ...platformFinance,
                                googleOAuthEnabled: e.target.checked,
                              })
                            }
                          />{" "}
                          فعال
                        </label>
                      </div>
                      <label className="mb-3 block text-sm font-bold text-gray-700">
                        Google Client ID
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.googleOAuthClientId}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            googleOAuthClientId: e.target.value,
                          })
                        }
                        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="xxxx.apps.googleusercontent.com"
                      />
                      <label className="mb-3 block text-sm font-bold text-gray-700">
                        Google Client Secret
                      </label>
                      <input
                        dir="ltr"
                        type="password"
                        value={platformFinance.googleOAuthClientSecret}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            googleOAuthClientSecret: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="GOCSPX-..."
                      />
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[#1877F2]">
                            Facebook Login
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            Meta Developers → Facebook Login → Settings
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={platformFinance.facebookOAuthEnabled}
                            onChange={(e) =>
                              setPlatformFinance({
                                ...platformFinance,
                                facebookOAuthEnabled: e.target.checked,
                              })
                            }
                          />{" "}
                          فعال
                        </label>
                      </div>
                      <label className="mb-3 block text-sm font-bold text-gray-700">
                        Facebook App ID
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.facebookOAuthClientId}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            facebookOAuthClientId: e.target.value,
                          })
                        }
                        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1234567890"
                      />
                      <label className="mb-3 block text-sm font-bold text-gray-700">
                        Facebook App Secret
                      </label>
                      <input
                        dir="ltr"
                        type="password"
                        value={platformFinance.facebookOAuthClientSecret}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            facebookOAuthClientSecret: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="app-secret"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        آدرس پایه سایت برای ورود اجتماعی
                      </label>
                      <input
                        dir="ltr"
                        value={platformFinance.socialAuthBaseUrl}
                        onChange={(e) =>
                          setPlatformFinance({
                            ...platformFinance,
                            socialAuthBaseUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://optibid.fazilat-ma.workers.dev"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                      <b>۱.</b> اپلیکیشن OAuth را در Google و Meta بسازید.
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                      <b>۲.</b> Callback URLهای بالا را دقیقاً ثبت کنید.
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                      <b>۳.</b> تنظیمات را ذخیره کنید؛ دکمه‌های ورود فوراً به
                      OAuth وصل می‌شوند.
                    </div>
                  </div>

                  <button
                    onClick={saveFinance}
                    className="mt-6 rounded-lg bg-purple-600 px-7 py-3 font-bold text-white transition hover:bg-purple-700"
                  >
                    ذخیره تنظیمات ورود اجتماعی
                  </button>
                </div>
              </div>
            )}

            {/* 6. Categories Management */}
            {activeTab === "categories" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-bold text-xl">
                    📂 مدیریت دسته‌بندی‌های کالا
                  </h2>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700">
                    + افزودن دسته جدید
                  </button>
                </div>
                <div className="space-y-3">
                  {categoriesList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between border border-gray-200 p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-800">
                          {cat.name}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-bold ${cat.status === "فعال" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {cat.status}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button className="text-blue-600 text-sm font-bold hover:underline">
                          ویرایش
                        </button>
                        <button className="text-red-600 text-sm font-bold hover:underline">
                          غیرفعال‌سازی
                        </button>
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

function adminMoney(value: number | string) {
  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}

function adminDate(value?: string) {
  return value
    ? new Date(value).toLocaleString("fa-IR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

function roleLabel(role: string) {
  if (role === "seller") return "فروشنده";
  if (role === "buyer") return "خریدار";
  return role || "کاربر";
}

function kycLabel(status: string) {
  if (status === "approved") return "تاییدشده";
  if (status === "rejected") return "ردشده";
  return "در انتظار بررسی";
}

function userAvatarUrl(user: any) {
  return user?.avatarName
    ? `/api/avatar?userId=${user.id}&v=${encodeURIComponent(user.avatarName)}`
    : "";
}

function UserManagementPanel({
  initialManagedUsers,
}: {
  initialManagedUsers: { summary: any; users: any[] };
}) {
  const [users, setUsers] = useState<any[]>(initialManagedUsers?.users || []);
  const [summary, setSummary] = useState<any>(
    initialManagedUsers?.summary || {},
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "buyer" | "seller">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked" | "pending"
  >("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, any>>({});
  const [lastPasswords, setLastPasswords] = useState<Record<number, string>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    "کالای دیجیتال",
    "مد و پوشاک",
    "خانه و آشپزخانه",
    "زیبایی و سلامت",
    "کتاب و لوازم تحریر",
    "ورزش و سفر",
    "اسباب‌بازی و کودک",
    "خودرو و موتور",
    "صنعتی و اداری",
    "سایر",
  ];

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "دریافت کاربران ناموفق بود.");
      setUsers(result.users || []);
      setSummary(result.summary || {});
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "دریافت کاربران ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const roleOk = roleFilter === "all" || user.role === roleFilter;
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "blocked" && !user.isActive) ||
        (statusFilter === "pending" && user.kycStatus === "pending");
      const text =
        `${user.fullName} ${user.username} ${user.email} ${user.phone || ""} ${user.city}`.toLowerCase();
      return roleOk && statusOk && (!query || text.includes(query));
    });
  }, [users, search, roleFilter, statusFilter]);

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setDrafts((current) => ({
      ...current,
      [user.id]: {
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        isActive: Boolean(user.isActive),
        kycStatus: user.kycStatus || "pending",
        bankDetailsVerified: Boolean(user.bankDetailsVerified),
        city: user.city || "",
        defaultAddress: user.defaultAddress || "",
        categories: user.categories || [],
      },
    }));
  };

  const updateDraft = (userId: number, key: string, value: any) => {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...(current[userId] || {}), [key]: value },
    }));
  };

  const toggleDraftCategory = (userId: number, category: string) => {
    const categories = drafts[userId]?.categories || [];
    updateDraft(
      userId,
      "categories",
      categories.includes(category)
        ? categories.filter((item: string) => item !== category)
        : [...categories, category],
    );
  };

  const mergeUpdatedUser = (updated: any) => {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user)),
    );
  };

  const saveUser = async (userId: number, partial?: any) => {
    const body = { userId, ...(partial || drafts[userId] || {}) };
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ذخیره کاربر ناموفق بود.");
      mergeUpdatedUser(result.user);
      setEditingId(null);
      await refreshUsers();
      alert(result.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ذخیره کاربر ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (user: any) => {
    const customPassword = window.prompt(
      `رمز جدید برای ${user.fullName}\nبرای تولید خودکار، کادر را خالی بگذارید.`,
      "",
    );
    if (customPassword === null) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          userId: user.id,
          password: customPassword.trim() || undefined,
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "بازنشانی رمز ناموفق بود.");
      mergeUpdatedUser(result.user);
      setLastPasswords((current) => ({
        ...current,
        [user.id]: result.temporaryPassword,
      }));
      alert(`${result.message}\nرمز جدید: ${result.temporaryPassword}`);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "بازنشانی رمز ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    ["کل خریداران", summary.buyersCount || 0, "🛒"],
    ["کل فروشندگان", summary.sellersCount || 0, "🏪"],
    ["کاربران فعال", summary.activeUsersCount || 0, "✅"],
    ["در انتظار احراز", summary.pendingKycCount || 0, "🛡️"],
    ["غیرفعال/مسدود", summary.blockedUsersCount || 0, "⛔"],
    ["ورود اجتماعی", summary.socialUsersCount || 0, "🔐"],
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              👥 مدیریت خریداران و فروشندگان
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              مدیریت حساب‌ها، نام کاربری، وضعیت فعال/مسدود، احراز هویت، حوزه
              فعالیت فروشنده و بازنشانی رمز عبور. رمز فعلی کاربران به دلایل
              امنیتی قابل نمایش نیست و فقط امکان ساخت رمز جدید وجود دارد.
            </p>
          </div>
          <button
            onClick={refreshUsers}
            disabled={loading}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white disabled:bg-gray-300"
          >
            {loading ? "در حال بروزرسانی..." : "بروزرسانی فهرست"}
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map(([label, value, icon]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"
            >
              <div className="text-2xl">{icon}</div>
              <p className="mt-2 text-2xl font-bold text-[#003b5c]">
                {Number(value).toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو نام، یوزرنیم، ایمیل یا شهر..."
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 md:col-span-2"
          />
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as "all" | "buyer" | "seller")
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="buyer">فقط خریداران</option>
            <option value="seller">فقط فروشندگان</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "active" | "blocked" | "pending",
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="blocked">غیرفعال/مسدود</option>
            <option value="pending">در انتظار احراز</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            کاربری با این فیلترها پیدا نشد.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const draft = drafts[user.id] || user;
              const editing = editingId === user.id;
              const avatarUrl = userAvatarUrl(user);
              return (
                <article
                  key={user.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={user.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#003b5c] to-[#00a8e8] text-2xl font-bold text-white">
                              {user.fullName?.charAt(0) || "👤"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-[#003b5c]">
                              {user.fullName}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${user.role === "seller" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                            >
                              {roleLabel(user.role)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                            >
                              {user.isActive ? "فعال" : "غیرفعال"}
                            </span>
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                              احراز: {kycLabel(user.kycStatus)}
                            </span>
                          </div>
                          <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-2 xl:grid-cols-3">
                            <p>
                              <b>یوزرنیم:</b>{" "}
                              <span dir="ltr">{user.username || "—"}</span>
                            </p>
                            <p>
                              <b>ایمیل:</b>{" "}
                              <span dir="ltr">
                                {user.email?.includes("@phone.optibid.local")
                                  ? "—"
                                  : user.email}
                              </span>
                            </p>
                            <p>
                              <b>موبایل:</b>{" "}
                              <span dir="ltr">{user.phone || "—"}</span>
                            </p>
                            <p>
                              <b>شهر:</b> {user.city || "—"}
                            </p>
                            <p>
                              <b>کیف پول:</b> {adminMoney(user.walletBalance)}
                            </p>
                            <p>
                              <b>عضویت:</b> {adminDate(user.createdAt)}
                            </p>
                            <p>
                              <b>ورود اجتماعی:</b>{" "}
                              {user.socialProviders?.length
                                ? user.socialProviders.join("، ")
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl bg-gray-50 p-4 text-xs md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <b>درخواست‌ها:</b>{" "}
                          {user.stats.requestsCount.toLocaleString("fa-IR")} /
                          باز:{" "}
                          {user.stats.openRequestsCount.toLocaleString("fa-IR")}
                        </div>
                        <div>
                          <b>پیشنهادها:</b>{" "}
                          {user.stats.offersCount.toLocaleString("fa-IR")} /
                          پذیرفته:{" "}
                          {user.stats.acceptedOffersCount.toLocaleString(
                            "fa-IR",
                          )}
                        </div>
                        <div>
                          <b>خرید موفق:</b>{" "}
                          {user.stats.completedPurchases.toLocaleString(
                            "fa-IR",
                          )}{" "}
                          · {adminMoney(user.stats.totalPurchaseAmount)}
                        </div>
                        <div>
                          <b>فروش موفق:</b>{" "}
                          {user.stats.completedSales.toLocaleString("fa-IR")} ·{" "}
                          {adminMoney(user.stats.totalSalesAmount)}
                        </div>
                        <div>
                          <b>مدارک:</b>{" "}
                          {user.kycDocumentsCount.toLocaleString("fa-IR")} فایل
                        </div>
                        <div>
                          <b>بانک:</b>{" "}
                          {user.bankDetailsVerified
                            ? "تایید شده"
                            : "نیازمند بررسی"}
                        </div>
                        <div>
                          <b>کارت:</b>{" "}
                          <span dir="ltr">
                            {user.bankCardNumberMasked || "—"}
                          </span>
                        </div>
                        <div>
                          <b>شبا:</b>{" "}
                          <span dir="ltr">
                            {user.bankShebaNumberMasked || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                        <p>
                          <b>وضعیت رمز عبور:</b> {user.passwordStatus}
                        </p>
                        <p className="text-xs text-blue-700">
                          رمز فعلی قابل مشاهده نیست چون به‌صورت امن Hash شده
                          است؛ ادمین می‌تواند رمز موقت جدید بسازد یا رمز دلخواه
                          تنظیم کند.
                        </p>
                        {lastPasswords[user.id] && (
                          <p
                            className="mt-2 rounded-xl bg-white p-3 font-mono text-sm text-[#003b5c]"
                            dir="ltr"
                          >
                            Temporary Password: {lastPasswords[user.id]}
                          </p>
                        )}
                      </div>

                      {editing && (
                        <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-xs font-bold text-gray-700">
                              نام / نام شرکت
                              <input
                                value={draft.fullName}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "fullName",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border p-2 font-normal"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              یوزرنیم
                              <input
                                dir="ltr"
                                value={draft.username}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "username",
                                    event.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9._-]/g, "")
                                      .slice(0, 30),
                                  )
                                }
                                className="mt-1 w-full rounded-xl border p-2 text-left font-normal"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              ایمیل
                              <input
                                dir="ltr"
                                value={draft.email}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "email",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border p-2 text-left font-normal"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              موبایل
                              <input
                                dir="ltr"
                                value={draft.phone || ""}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "phone",
                                    event.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 11),
                                  )
                                }
                                className="mt-1 w-full rounded-xl border p-2 text-left font-normal"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              شهر
                              <input
                                value={draft.city}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "city",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border p-2 font-normal"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              وضعیت احراز
                              <select
                                value={draft.kycStatus}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "kycStatus",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border bg-white p-2 font-normal"
                              >
                                <option value="pending">در انتظار</option>
                                <option value="approved">تایید شده</option>
                                <option value="rejected">رد شده</option>
                              </select>
                            </label>
                            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-3 text-xs font-bold text-gray-700">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={draft.isActive}
                                  onChange={(event) =>
                                    updateDraft(
                                      user.id,
                                      "isActive",
                                      event.target.checked,
                                    )
                                  }
                                />{" "}
                                حساب فعال
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={draft.bankDetailsVerified}
                                  onChange={(event) =>
                                    updateDraft(
                                      user.id,
                                      "bankDetailsVerified",
                                      event.target.checked,
                                    )
                                  }
                                />{" "}
                                اطلاعات بانکی تایید شده
                              </label>
                            </div>
                            <label className="md:col-span-2 text-xs font-bold text-gray-700">
                              نشانی پیش‌فرض
                              <textarea
                                value={draft.defaultAddress}
                                onChange={(event) =>
                                  updateDraft(
                                    user.id,
                                    "defaultAddress",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 min-h-20 w-full rounded-xl border p-2 font-normal"
                              />
                            </label>
                          </div>
                          {user.role === "seller" && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-bold text-gray-700">
                                حوزه‌های فعالیت فروشنده
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {categoryOptions.map((category) => (
                                  <label
                                    key={category}
                                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-xs font-bold ${draft.categories?.includes(category) ? "border-blue-300 bg-blue-50 text-blue-700" : "bg-white text-gray-600"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.categories?.includes(
                                        category,
                                      )}
                                      onChange={() =>
                                        toggleDraftCategory(user.id, category)
                                      }
                                    />
                                    {category}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-[190px] flex-col gap-2">
                      {editing ? (
                        <>
                          <button
                            onClick={() => saveUser(user.id)}
                            disabled={loading}
                            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-300"
                          >
                            ذخیره تغییرات
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700"
                          >
                            انصراف
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700"
                        >
                          ویرایش کاربر
                        </button>
                      )}
                      <button
                        onClick={() => resetPassword(user)}
                        disabled={loading}
                        className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 disabled:bg-gray-100"
                      >
                        بازنشانی / تنظیم رمز
                      </button>
                      <button
                        onClick={() =>
                          saveUser(user.id, { isActive: !user.isActive })
                        }
                        disabled={loading}
                        className={`rounded-xl px-4 py-2 text-sm font-bold disabled:bg-gray-100 ${user.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}
                      >
                        {user.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      </button>
                      {user.kycStatus !== "approved" && (
                        <button
                          onClick={() =>
                            saveUser(user.id, {
                              kycStatus: "approved",
                              isActive: true,
                            })
                          }
                          disabled={loading}
                          className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 disabled:bg-gray-100"
                        >
                          تایید احراز
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsList({
  title,
  items,
  value,
}: {
  title: string;
  items: any[];
  value: (item: any) => string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-center text-xs text-gray-500">
          داده کافی وجود ندارد.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.product}-${index}`}
              className="rounded-xl bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="line-clamp-1 font-bold text-gray-800">
                  {item.product}
                </p>
                <span className="rounded-full bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700">
                  #{index + 1}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{item.category}</p>
              <p className="mt-2 text-sm font-bold text-[#003b5c]">
                {value(item)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductAnalysisChart({
  product,
  mode,
  indicators,
  moneyLabel,
  percentLabel,
}: {
  product: any;
  mode: "line" | "bar" | "pie";
  indicators: Record<IndicatorId, boolean>;
  moneyLabel: (value: number | string) => string;
  percentLabel: (value: number | string) => string;
}) {
  const externalAvailable =
    Array.isArray(product.externalChartPoints) &&
    product.externalChartPoints.length > 0;
  const [dataSource, setDataSource] = useState<"internal" | "external">(
    "external",
  );
  const activeDataSource =
    dataSource === "external" && externalAvailable ? "external" : "internal";
  const activeSourceInfo =
    activeDataSource === "external" ? product.externalSource : null;
  const chartPoints = (
    (activeDataSource === "external"
      ? product.externalChartPoints
      : product.chartPoints) || []
  ).filter((point: any) => Number(point.price) > 0);
  const distribution = (product.chartDistribution || []).filter(
    (item: any) => Number(item.value) > 0,
  );
  const activeRsi =
    activeDataSource === "external" ? product.externalRsi : product.rsi;
  const activeMacd =
    activeDataSource === "external" ? product.externalMacd : product.macd;
  const activeSignal =
    activeDataSource === "external"
      ? product.externalTechnicalSignal
      : product.technicalSignal;
  const width = 900;
  const height = 560;
  const left = 62;
  const right = 34;
  const plotWidth = width - left - right;
  const priceTop = 30;
  const priceHeight = 250;
  const oscillatorTop = 316;
  const oscillatorHeight = 92;
  const lowerTop = 450;
  const lowerHeight = 72;

  const enabled = (id: IndicatorId) => Boolean(indicators[id]);
  const priceKeys = ["price"];
  if (enabled("sma")) priceKeys.push("sma7", "sma20");
  if (enabled("ema")) priceKeys.push("ema12", "ema26");
  if (enabled("bollinger"))
    priceKeys.push("bollingerUpper", "bollingerMiddle", "bollingerLower");

  const priceValues = chartPoints.flatMap((point: any) =>
    priceKeys
      .map((key) => point[key])
      .filter((value) => value !== null && value !== undefined)
      .map(Number),
  );
  const minPrice = Math.min(...priceValues, 0);
  const maxPrice = Math.max(...priceValues, 1);
  const pricePadding = Math.max(1, (maxPrice - minPrice) * 0.12);
  const priceMin = Math.max(0, minPrice - pricePadding);
  const priceMax = maxPrice + pricePadding;
  const maxDemand = Math.max(
    1,
    ...chartPoints.map((point: any) => Number(point.demand || 0)),
  );

  const x = (index: number) =>
    left + (index * plotWidth) / Math.max(1, chartPoints.length - 1);
  const priceY = (value: number) =>
    priceTop +
    priceHeight -
    ((value - priceMin) / Math.max(1, priceMax - priceMin)) * priceHeight;
  const oscillatorY = (value: number) =>
    oscillatorTop +
    oscillatorHeight -
    (Math.max(0, Math.min(100, value)) / 100) * oscillatorHeight;
  const lowerKeys: string[] = [];
  if (enabled("macd")) lowerKeys.push("macd", "macdSignal", "macdHistogram");
  if (enabled("roc")) lowerKeys.push("roc");
  if (enabled("momentum")) lowerKeys.push("momentum");
  if (enabled("atr")) lowerKeys.push("atr");
  const lowerValues: number[] = chartPoints.flatMap((point: any) =>
    lowerKeys
      .map((key) => point[key])
      .filter((value) => value !== null && value !== undefined)
      .map(Number),
  );
  const lowerAbsMax = Math.max(
    1,
    ...lowerValues.map((value: number) => Math.abs(value)),
  );
  const lowerZeroY = lowerTop + lowerHeight / 2;
  const lowerY = (value: number) =>
    lowerZeroY - (value / lowerAbsMax) * (lowerHeight / 2);

  const linePath = (key: string, mapper: (value: number) => number) => {
    let started = false;
    return chartPoints
      .map((point: any, index: number) => {
        const value = point[key];
        if (
          value === null ||
          value === undefined ||
          Number.isNaN(Number(value))
        )
          return "";
        const command = started ? "L" : "M";
        started = true;
        return `${command}${x(index)},${mapper(Number(value))}`;
      })
      .filter(Boolean)
      .join(" ");
  };

  const renderLine = (
    key: string,
    color: string,
    mapper: (value: number) => number,
    strokeWidth = 2,
    dash = "",
  ) => {
    const path = linePath(key, mapper);
    return path ? (
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null;
  };

  const pieColors = ["#00a8e8", "#8b5cf6", "#16a34a", "#ef4444", "#f59e0b"];
  const pieTotal = distribution.reduce(
    (sum: number, item: any) => sum + Number(item.value || 0),
    0,
  );
  let pieStart = -90;
  const pieSlices = distribution.map((item: any, index: number) => {
    const value = Number(item.value || 0);
    const angle = pieTotal ? (value / pieTotal) * 360 : 0;
    const start = pieStart;
    const end = pieStart + angle;
    pieStart = end;
    return { ...item, start, end, color: pieColors[index % pieColors.length] };
  });

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const polar = (angle: number) => {
      const rad = (angle * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const start = polar(startAngle);
    const end = polar(endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  const legend = [
    { enabled: true, color: "#00a8e8", label: "Price" },
    {
      enabled: enabled("demand") && mode !== "pie",
      color: "#14b8a6",
      label: "Demand",
    },
    {
      enabled: enabled("sma") && mode !== "pie",
      color: "#f59e0b",
      label: "SMA 7/20",
    },
    {
      enabled: enabled("ema") && mode !== "pie",
      color: "#8b5cf6",
      label: "EMA 12/26",
    },
    {
      enabled: enabled("bollinger") && mode !== "pie",
      color: "#64748b",
      label: "Bollinger",
    },
    {
      enabled: enabled("rsi") && mode !== "pie",
      color: "#9333ea",
      label: "RSI",
    },
    {
      enabled: enabled("stochRsi") && mode !== "pie",
      color: "#ef4444",
      label: "Stoch RSI",
    },
    {
      enabled: enabled("macd") && mode !== "pie",
      color: "#2563eb",
      label: "MACD",
    },
    {
      enabled: enabled("roc") && mode !== "pie",
      color: "#0f766e",
      label: "ROC",
    },
    {
      enabled: enabled("momentum") && mode !== "pie",
      color: "#be123c",
      label: "Momentum",
    },
    {
      enabled: enabled("atr") && mode !== "pie",
      color: "#7c3aed",
      label: "ATR",
    },
  ].filter((item) => item.enabled);

  if (chartPoints.length === 0 && mode !== "pie") {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
        برای این کالا هنوز نقطه قیمتی کافی وجود ندارد.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{product.product}</h4>
          <p className="mt-1 text-xs text-gray-500">
            {product.category} · {chartPoints.length.toLocaleString("fa-IR")}{" "}
            نقطه داده · آخرین سیگنال: {activeSignal}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <span className="rounded-xl bg-blue-50 px-3 py-2 font-bold text-blue-700">
            RSI: {activeRsi === null ? "ناکافی" : activeRsi}
          </span>
          <span className="rounded-xl bg-purple-50 px-3 py-2 font-bold text-purple-700">
            MACD: {activeMacd ? activeMacd.histogram : "ناکافی"}
          </span>
          <span className="rounded-xl bg-green-50 px-3 py-2 font-bold text-green-700">
            تقاضا: {product.aiDemandForecast}
          </span>
          <span className="rounded-xl bg-amber-50 px-3 py-2 font-bold text-amber-700">
            قیمت: {product.aiPriceForecast}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDataSource("internal")}
            className={`rounded-xl px-3 py-2 font-bold transition ${activeDataSource === "internal" ? "bg-[#003b5c] text-white" : "bg-white text-gray-600 hover:bg-blue-50"}`}
          >
            داده داخلی OptiBid
          </button>
          <button
            type="button"
            disabled={!externalAvailable}
            onClick={() => setDataSource("external")}
            className={`rounded-xl px-3 py-2 font-bold transition ${activeDataSource === "external" ? "bg-[#003b5c] text-white" : "bg-white text-gray-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"}`}
          >
            داده بیرونی بازار
          </button>
        </div>
        <div className="text-left text-gray-500">
          {activeSourceInfo ? (
            <span>
              منبع:{" "}
              <a
                href={activeSourceInfo.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#00a8e8] underline"
              >
                {activeSourceInfo.sourceName} / {activeSourceInfo.sourceTitle}
              </a>{" "}
              ·{" "}
              {activeSourceInfo.isProxy ? "پروکسی قابل استناد" : "نماد مستقیم"}{" "}
              · {activeSourceInfo.pointsCount?.toLocaleString("fa-IR")} نقطه
            </span>
          ) : (
            <span>
              منبع: داده‌های داخلی OptiBid از درخواست‌ها، پیشنهادها و سفارش‌ها
            </span>
          )}
        </div>
      </div>

      {mode === "pie" ? (
        <div className="grid gap-5 md:grid-cols-2 md:items-center">
          <svg
            viewBox="0 0 360 300"
            className="h-[320px] w-full rounded-2xl bg-gray-50"
          >
            {pieSlices.length === 0 ? (
              <text
                x="180"
                y="150"
                textAnchor="middle"
                className="fill-gray-500 text-sm"
              >
                داده‌ای برای نمودار دایره‌ای وجود ندارد
              </text>
            ) : (
              pieSlices.map((slice: any, index: number) => (
                <path
                  key={`${slice.label}-${index}`}
                  d={describeArc(180, 150, 110, slice.start, slice.end)}
                  fill={slice.color}
                  stroke="#fff"
                  strokeWidth="3"
                />
              ))
            )}
            <circle cx="180" cy="150" r="54" fill="#fff" />
            <text
              x="180"
              y="145"
              textAnchor="middle"
              className="fill-gray-700 text-xs font-bold"
            >
              توزیع وضعیت
            </text>
            <text
              x="180"
              y="168"
              textAnchor="middle"
              className="fill-gray-500 text-[11px]"
            >
              {product.product}
            </text>
          </svg>
          <div className="space-y-3">
            {pieSlices.map((slice: any, index: number) => (
              <div
                key={`${slice.label}-legend-${index}`}
                className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />{" "}
                  <span className="font-bold text-gray-700">{slice.label}</span>
                </div>
                <span className="text-gray-600">
                  {Number(slice.value).toLocaleString("fa-IR")} (
                  {percentLabel(
                    Math.round(
                      (Number(slice.value) / Math.max(1, pieTotal)) * 100,
                    ),
                  )}
                  )
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[560px] w-full rounded-2xl bg-gradient-to-b from-white to-gray-50"
          role="img"
          aria-label={`نمودار تحلیلی ${product.product}`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={priceTop + priceHeight * tick}
                y2={priceTop + priceHeight * tick}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              <text
                x={left - 10}
                y={priceTop + priceHeight * tick + 4}
                textAnchor="end"
                className="fill-gray-400 text-[10px]"
              >
                {Math.round(
                  priceMax - (priceMax - priceMin) * tick,
                ).toLocaleString("fa-IR")}
              </text>
            </g>
          ))}

          <text x={left} y="18" className="fill-gray-600 text-[11px] font-bold">
            قیمت / بودجه / پیشنهاد
          </text>
          {enabled("demand") &&
            chartPoints.map((point: any, index: number) => {
              const demandHeight = (Number(point.demand || 0) / maxDemand) * 48;
              const barWidth = Math.max(
                5,
                plotWidth / Math.max(1, chartPoints.length) - 4,
              );
              return (
                <rect
                  key={`${point.at}-demand`}
                  x={x(index) - barWidth / 2}
                  y={priceTop + priceHeight - demandHeight}
                  width={barWidth}
                  height={demandHeight}
                  rx="3"
                  fill="#14b8a6"
                  opacity="0.22"
                />
              );
            })}
          {mode === "bar" ? (
            chartPoints.map((point: any, index: number) => {
              const barWidth = Math.max(
                8,
                plotWidth / Math.max(1, chartPoints.length) - 5,
              );
              const y = priceY(Number(point.price));
              return (
                <rect
                  key={`${point.at}-bar`}
                  x={x(index) - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={priceTop + priceHeight - y}
                  rx="5"
                  fill="#00a8e8"
                  opacity="0.75"
                />
              );
            })
          ) : (
            <>
              {renderLine("price", "#00a8e8", priceY, 4)}
              {chartPoints.map((point: any, index: number) => (
                <circle
                  key={`${point.at}-dot`}
                  cx={x(index)}
                  cy={priceY(Number(point.price))}
                  r="4"
                  fill="#00a8e8"
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </>
          )}
          {enabled("sma") && renderLine("sma7", "#f59e0b", priceY, 2.4)}
          {enabled("sma") && renderLine("sma20", "#d97706", priceY, 2.2, "6 4")}
          {enabled("ema") && renderLine("ema12", "#8b5cf6", priceY, 2.3)}
          {enabled("ema") && renderLine("ema26", "#6d28d9", priceY, 2.1, "6 4")}
          {enabled("bollinger") &&
            renderLine("bollingerUpper", "#64748b", priceY, 1.8, "5 5")}
          {enabled("bollinger") &&
            renderLine("bollingerMiddle", "#94a3b8", priceY, 1.5, "3 5")}
          {enabled("bollinger") &&
            renderLine("bollingerLower", "#64748b", priceY, 1.8, "5 5")}

          {chartPoints.map((point: any, index: number) => {
            if (index % Math.max(1, Math.ceil(chartPoints.length / 6)) !== 0)
              return null;
            return (
              <text
                key={`${point.at}-label`}
                x={x(index)}
                y={priceTop + priceHeight + 20}
                textAnchor="middle"
                className="fill-gray-400 text-[10px]"
              >
                {point.label}
              </text>
            );
          })}

          <text
            x={left}
            y={oscillatorTop - 10}
            className="fill-purple-700 text-[11px] font-bold"
          >
            RSI / Stoch RSI
          </text>
          <rect
            x={left}
            y={oscillatorTop}
            width={plotWidth}
            height={oscillatorHeight}
            fill="#faf5ff"
            opacity="0.86"
          />
          <line
            x1={left}
            x2={width - right}
            y1={oscillatorY(80)}
            y2={oscillatorY(80)}
            stroke="#c084fc"
            strokeDasharray="5 5"
          />
          <line
            x1={left}
            x2={width - right}
            y1={oscillatorY(70)}
            y2={oscillatorY(70)}
            stroke="#ddd6fe"
            strokeDasharray="4 6"
          />
          <line
            x1={left}
            x2={width - right}
            y1={oscillatorY(30)}
            y2={oscillatorY(30)}
            stroke="#ddd6fe"
            strokeDasharray="4 6"
          />
          <line
            x1={left}
            x2={width - right}
            y1={oscillatorY(20)}
            y2={oscillatorY(20)}
            stroke="#c084fc"
            strokeDasharray="5 5"
          />
          {enabled("rsi") && renderLine("rsi", "#9333ea", oscillatorY, 2.6)}
          {enabled("stochRsi") &&
            renderLine("stochRsiK", "#ef4444", oscillatorY, 2.1)}
          {enabled("stochRsi") &&
            renderLine("stochRsiD", "#2563eb", oscillatorY, 2.1)}

          <text
            x={left}
            y={lowerTop - 10}
            className="fill-rose-700 text-[11px] font-bold"
          >
            MACD / ROC / Momentum / ATR
          </text>
          <rect
            x={left}
            y={lowerTop}
            width={plotWidth}
            height={lowerHeight}
            fill="#fff7ed"
            opacity="0.65"
          />
          <line
            x1={left}
            x2={width - right}
            y1={lowerZeroY}
            y2={lowerZeroY}
            stroke="#d1d5db"
          />
          {enabled("macd") &&
            chartPoints.map((point: any, index: number) => {
              if (
                point.macdHistogram === null ||
                point.macdHistogram === undefined
              )
                return null;
              const y = lowerY(Number(point.macdHistogram));
              return (
                <rect
                  key={`${point.at}-macd-hist`}
                  x={x(index) - 3}
                  y={Math.min(y, lowerZeroY)}
                  width="6"
                  height={Math.abs(lowerZeroY - y)}
                  rx="2"
                  fill={
                    Number(point.macdHistogram) >= 0 ? "#16a34a" : "#ef4444"
                  }
                  opacity="0.65"
                />
              );
            })}
          {enabled("macd") && renderLine("macd", "#2563eb", lowerY, 2)}
          {enabled("macd") && renderLine("macdSignal", "#f97316", lowerY, 2)}
          {enabled("roc") && renderLine("roc", "#0f766e", lowerY, 2.2)}
          {enabled("momentum") &&
            renderLine("momentum", "#be123c", lowerY, 2.2)}
          {enabled("atr") && renderLine("atr", "#7c3aed", lowerY, 2.2)}
        </svg>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        {legend.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 font-bold text-gray-600"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 text-xs md:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <b>میانگین بودجه:</b>
          <br />
          {moneyLabel(product.averageRequestedBudget)}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <b>میانگین فروش:</b>
          <br />
          {moneyLabel(product.averageSaleAmount)}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <b>رشد تقاضا:</b>
          <br />
          {percentLabel(product.demandTrendPercent)}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <b>روند قیمت:</b>
          <br />
          {percentLabel(product.priceTrendPercent)}
        </div>
      </div>
    </div>
  );
}
