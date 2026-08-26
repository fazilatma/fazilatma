"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import SellerStars from "@/components/SellerStars";
import TradeSurvey from "@/components/TradeSurvey";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";

const money = (value: string | number) => `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const maskCard = (value = "") => value ? `${value.slice(0, 4)}-****-****-${value.slice(-4)}` : "ثبت نشده";
const maskSheba = (value = "") => value ? `${value.slice(0, 4)} **** **** **** **** ${value.slice(-4)}` : "ثبت نشده";
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }) : "—";

const categoryMap: Record<string, string> = {
  digital: "کالای دیجیتال", clothing: "مد و پوشاک", home: "خانه و آشپزخانه", beauty: "زیبایی و سلامت", books: "کتاب و لوازم تحریر", sports: "ورزش و سفر", toys: "اسباب‌بازی و کودک", auto: "خودرو و موتور", industrial: "صنعتی و اداری", other: "سایر",
};

const defaultOfferSpecs = {
  brand: "",
  exactModel: "",
  serialOrConfig: "",
  cpu: "",
  ram: "",
  storage: "",
  gpu: "ندارد / نامرتبط",
  display: "",
  manufactureYear: "",
  productCondition: "used_good",
  warrantyStatus: "test",
  warrantyMonths: "",
  partsHealth: "all_healthy",
  cpuHealth: "healthy",
  motherboardHealth: "healthy",
  displayHealth: "healthy",
  storageHealth: "healthy",
  ramHealth: "healthy",
  gpuHealth: "not_applicable",
  keyboardTouchpadHealth: "healthy",
  bodyHingeHealth: "healthy",
  batteryHealthPercent: "",
  appearanceGrade: "A",
  repairHistory: "none",
  usageLevel: "normal",
  accessoriesStatus: "complete",
  chargerStatus: "original",
  originalPackaging: "unknown",
  purchaseInvoiceAvailable: "unknown",
  testDeadlineDays: "7",
  returnPolicy: "در صورت مغایرت مشخصات یا خرابی اعلام‌نشده، مرجوعی پذیرفته می‌شود.",
  notes: "",
};

type OfferSpecs = typeof defaultOfferSpecs;

const healthOptions = [
  ["healthy", "سالم"],
  ["minor_issue", "ایراد جزئی"],
  ["needs_repair", "نیازمند تعمیر"],
  ["not_applicable", "نامرتبط"],
] as const;

type SellerData = {
  seller: {
    id: number;
    fullName: string;
    email: string;
    avatarName?: string;
    walletBalance: number;
    bio?: string;
    categories?: string[];
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankCardNumber?: string;
    bankShebaNumber?: string;
    bankDetailsVerified?: boolean;
  };
  matchingRequests: any[];
  orders: any[];
  offers: any[];
  transactions: any[];
  withdrawals: any[];
  notifications: any[];
  messages: any[];
  reviews: any[];
};

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<SellerData | null>(null);
  const [sellerScore, setSellerScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queueIndex, setQueueIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDeliveryDays, setOfferDeliveryDays] = useState("3");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerSpecs, setOfferSpecs] = useState<OfferSpecs>({ ...defaultOfferSpecs });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, string>>({});
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null);
  const [settings, setSettings] = useState({ storeName: "", bio: "", categories: [] as string[] });
  const [storeAvatarFile, setStoreAvatarFile] = useState<File | null>(null);
  const [storeAvatarPreview, setStoreAvatarPreview] = useState("");

  const sellerId = typeof window === "undefined" ? 0 : Number(localStorage.getItem("userId") || 0);

  const loadDashboard = async () => {
    if (!sellerId) {
      setError("برای مشاهده داده‌های واقعی فروشنده، ابتدا با حساب فروشنده ثبت‌نام یا وارد شوید.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dashboardResponse, scoreResponse] = await Promise.all([
        fetch(`/api/dashboard/seller?sellerId=${sellerId}`, { cache: "no-store" }),
        fetch(`/api/seller-score?sellerId=${sellerId}`, { cache: "no-store" }),
      ]);
      const dashboard = await dashboardResponse.json();
      const score = await scoreResponse.json();
      if (!dashboard.success) throw new Error(dashboard.message || "خطا در دریافت داشبورد فروشنده");
      setData(dashboard);
      if (score.success) setSellerScore(score.score);
      setSettings({ storeName: dashboard.seller.fullName || "", bio: dashboard.seller.bio || "", categories: dashboard.seller.categories || [] });
      setStoreAvatarPreview(dashboard.seller.avatarName ? `/api/avatar?userId=${dashboard.seller.id}&v=${encodeURIComponent(dashboard.seller.avatarName)}` : "");
      setStoreAvatarFile(null);
      setActiveChatUserId((current) => current || dashboard.orders[0]?.buyerId || dashboard.matchingRequests[0]?.buyerId || null);
      setQueueIndex(0);
      setTimeLeft(60);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرور ناموفق بود.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const action = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "عملیات ناموفق بود");
    return result;
  };

  const updateOfferSpec = (key: keyof OfferSpecs, value: string) => {
    setOfferSpecs((current) => ({ ...current, [key]: value }));
  };

  const resetOfferForm = () => {
    setOfferAmount("");
    setOfferMessage("");
    setOfferSpecs({ ...defaultOfferSpecs });
  };

  const queue = data?.matchingRequests || [];
  const currentRequest = queue[queueIndex] || null;
  const remainingQueue = queue.slice(queueIndex);
  const pendingPayment = (data?.orders || []).filter((order) => order.status === "pending_payment");
  const readyToShip = (data?.orders || []).filter((order) => order.status === "paid");
  const shipped = (data?.orders || []).filter((order) => order.status === "shipped");
  const archiveOrders = (data?.orders || []).filter((order) => order.sellerArchived || ["completed", "cancelled", "returned"].includes(order.status));
  const reviewedOrderIds = new Set((data?.reviews || []).filter((review) => review.reviewerId === data?.seller.id).map((review) => review.orderId));
  const pendingSurveys = (data?.orders || []).filter((order) => order.status === "completed" && !reviewedOrderIds.has(order.id));
  const ordersById = new Map((data?.orders || []).map((order) => [order.id, order]));
  const receivedReviews = (data?.reviews || []).filter((review) => review.revieweeId === data?.seller.id);

  useEffect(() => {
    if (!currentRequest) return;
    if (timeLeft <= 0) { void rejectCurrent(); return; }
    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentRequest, timeLeft]);

  const rejectCurrent = async () => {
    if (!currentRequest || !data) return;
    try { await action("/api/seller-request-action", { sellerId: data.seller.id, requestId: currentRequest.id, action: "rejected" }); } catch { /* progress locally even if API transiently fails */ }
    setQueueIndex((value) => value + 1);
    setTimeLeft(60);
    resetOfferForm();
  };

  const submitOffer = async () => {
    if (!data || !currentRequest) return;
    const amount = offerAmount.replace(/\D/g, "");
    if (!amount) { alert("قیمت پیشنهادی را وارد کنید."); return; }
    setIsSubmittingOffer(true);
    try {
      const result = await action("/api/submit-offer", { sellerId: data.seller.id, requestId: currentRequest.id, amount, deliveryDays: Number(offerDeliveryDays), message: offerMessage, productSpecs: offerSpecs });
      alert(result.message);
      setQueueIndex((value) => value + 1);
      setTimeLeft(60);
      resetOfferForm();
      await loadDashboard();
    } catch (err) { alert(err instanceof Error ? err.message : "ثبت پیشنهاد ناموفق بود"); }
    finally { setIsSubmittingOffer(false); }
  };

  const shipOrder = async (orderId: string) => {
    if (!data) return;
    const trackingCode = trackingByOrder[orderId] || "";
    if (!trackingCode.trim()) { alert("کد رهگیری ارسال را وارد کنید."); return; }
    try {
      const result = await action("/api/orders/ship", { sellerId: data.seller.id, orderId, trackingCode });
      alert(result.message);
      await loadDashboard();
    } catch (err) { alert(err instanceof Error ? err.message : "تایید ارسال ناموفق بود"); }
  };

  const requestWithdrawal = async () => {
    if (!data || !withdrawalAmount) return;
    try {
      const result = await action("/api/wallet/withdraw", {
        userId: data.seller.id,
        amount: withdrawalAmount,
      });
      setWithdrawalAmount("");
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "درخواست برداشت ناموفق بود.");
    }
  };

  const archiveOrder = async (orderId: string) => {
    if (!data) return;
    try { const result = await action("/api/orders/archive", { userId: data.seller.id, orderId, role: "seller" }); alert(result.message); await loadDashboard(); }
    catch (err) { alert(err instanceof Error ? err.message : "بایگانی ناموفق بود"); }
  };

  const handleStoreAvatarChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("لطفاً یک فایل تصویری معتبر برای لوگوی فروشگاه انتخاب کنید.");
      return;
    }
    setStoreAvatarFile(file);
    setStoreAvatarPreview(URL.createObjectURL(file));
  };

  const saveSettings = async () => {
    if (!data) return;
    try {
      const form = new FormData();
      form.append("sellerId", String(data.seller.id));
      form.append("fullName", settings.storeName);
      form.append("bio", settings.bio);
      form.append("categories", JSON.stringify(settings.categories));
      if (storeAvatarFile) form.append("avatar", storeAvatarFile);

      const response = await fetch("/api/seller/profile", { method: "PATCH", body: form });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      localStorage.setItem("userDisplayName", settings.storeName);
      setStoreAvatarFile(null);
      alert(result.message);
      await loadDashboard();
    } catch (err) { alert(err instanceof Error ? err.message : "ذخیره تنظیمات ناموفق بود"); }
  };

  const counterpartUsers = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const order of data?.orders || []) map.set(order.buyerId, { id: order.buyerId, name: order.buyerName });
    for (const req of data?.matchingRequests || []) map.set(req.buyerId, { id: req.buyerId, name: req.buyerName });
    return [...map.values()];
  }, [data]);
  const currentMessages = (data?.messages || []).filter((message) => message.senderId === activeChatUserId || message.receiverId === activeChatUserId);

  const sendMessage = async () => {
    if (!data || !activeChatUserId || !messageText.trim()) return;
    try { const result = await action("/api/messages", { senderId: data.seller.id, receiverId: activeChatUserId, content: messageText }); setMessageText(""); alert(result.message); await loadDashboard(); }
    catch (err) { alert(err instanceof Error ? err.message : "ارسال پیام ناموفق بود"); }
  };

  const tabs = [
    ["overview", "پیشخوان", "🏠"], ["requests", "رادار درخواست‌ها", "📡"], ["orders", "سفارش‌ها", "📦"], ["shipping", "ارسال کالا", "🚚"], ["wallet", "کیف پول", "💰"], ["messages", "پیام‌ها", "💬"], ["reviews", "دیدگاه‌ها", "🗣️"], ["notifications", "اعلان‌ها", "🔔"], ["survey", "نظرسنجی", "⭐"], ["archive", "بایگانی", "🗂️"], ["settings", "تنظیمات", "⚙️"],
  ] as const;

  if (loading) return <div dir="rtl" className="grid min-h-[60vh] place-items-center bg-gray-50 text-[#003b5c]">در حال بارگذاری داشبورد فروشنده...</div>;
  if (error || !data) return <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"><h1 className="text-xl font-bold text-amber-900">داشبورد فروشنده آماده نیست</h1><p className="mt-3 text-sm leading-7 text-amber-800">{error}</p><Link href="/register" className="mt-6 inline-block rounded-xl bg-[#003b5c] px-6 py-3 font-bold text-white">ثبت‌نام فروشنده</Link></div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fcfb] pb-16">
      {currentRequest && <section className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border-4 border-[#0b9c56] bg-white p-6 shadow-2xl"><div className="absolute -right-10 -top-10 h-32 w-32 animate-ping rounded-full bg-green-500/20" /><div className="relative z-10 mb-4 flex justify-between"><span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white animate-pulse">درخواست مرتبط {queueIndex + 1} از {queue.length}</span><span className={`font-mono text-2xl font-bold ${timeLeft <= 10 ? "animate-bounce text-red-600" : "text-gray-800"}`}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></div><h2 className="relative z-10 text-xl font-bold text-[#003b5c]">{currentRequest.title}</h2><p className="relative z-10 mt-2 text-sm leading-7 text-gray-600">{currentRequest.description}</p><div className="relative z-10 mt-4 space-y-2 rounded-2xl bg-gray-50 p-4 text-sm"><p>دسته: <b className="text-blue-700">{currentRequest.category}</b></p><p>خریدار: <b>{currentRequest.buyerName}</b></p><p>تعداد: <b>{currentRequest.quantity}</b></p><p className="border-t pt-2">بودجه: <b className="text-lg text-green-600">{money(currentRequest.budget)}</b></p></div><div className="relative z-10 mt-4 rounded-2xl bg-blue-50 p-4">
  <p className="font-bold text-[#003b5c]">ثبت پیشنهاد و مشخصات کالا در صفحه جداگانه</p>
  <p className="mt-2 text-sm leading-7 text-blue-900">برای جلوگیری از بسته شدن فرم و ثبت دقیق مشخصات، قیمت و مشخصات کامل محصول پیشنهادی را در صفحه اختصاصی پر کنید.</p>
  <Link href={`/requests/${currentRequest.id}/offer`} className="mt-4 inline-block rounded-xl bg-[#003b5c] px-5 py-3 text-sm font-bold text-white hover:bg-[#002d46]">
    رفتن به فرم مشخصات کالای پیشنهادی
  </Link>
</div><div className="relative z-10 mt-4 flex gap-3"><button onClick={rejectCurrent} className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700">رد و مورد بعدی</button><Link href={`/requests/${currentRequest.id}/offer`} className="flex-[2] rounded-xl bg-[#0b9c56] py-3 text-center font-bold text-white">تکمیل فرم و ثبت پیشنهاد</Link></div><div className="absolute bottom-0 left-0 h-1.5 bg-[#0b9c56]" style={{ width: `${(timeLeft / 60) * 100}%` }} /></div></section>}

      <div className="border-b bg-white px-4 py-3 shadow-sm"><div className="mx-auto flex max-w-6xl justify-between text-sm text-gray-500"><span>OptiBid / داشبورد فروشنده</span><span>{data.seller.fullName}</span></div></div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"><Metric value={remainingQueue.length} label="درخواست مرتبط" color="blue" /><Metric value={pendingPayment.length} label="منتظر پرداخت خریدار" color="amber" /><Metric value={readyToShip.length} label="آماده ارسال" color="orange" /><Metric value={money(data.seller.walletBalance)} label="کیف پول فروشنده" color="green" /></section>
        <section className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 bg-gradient-to-l from-[#003b5c] to-[#005e94] p-5 text-white md:flex-row md:items-center"><div><p className="text-sm font-bold text-blue-100">امتیاز اعتماد فروشنده</p><h2 className="mt-1 text-2xl font-bold">{sellerScore?.label || "در حال ارزیابی"}</h2></div><div><SellerStars score={sellerScore?.finalScore || 0} size="lg" light /><p className="mt-1 text-xs text-blue-100">اعتبار داده: {sellerScore?.confidence || 0}%</p></div></div><div className="grid grid-cols-2 gap-px bg-gray-100 md:grid-cols-4"><Metric value={`${sellerScore?.rates.responseRate24h || 0}%`} label="پاسخ ۲۴ساعته" color="plain" /><Metric value={`${sellerScore?.rates.onTimeShippingRate || 0}%`} label="ارسال به‌موقع" color="plain" /><Metric value={`${sellerScore?.rates.validTrackingRate || 0}%`} label="رهگیری معتبر" color="plain" /><Metric value={`${sellerScore?.rates.defectRate || 0}%`} label="نرخ نقص" color="plain" /></div></section>
        <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-[2rem] border border-gray-200 bg-white/70 p-4 shadow-sm">{tabs.map(([id, label, icon]) => <button key={id} onClick={() => setActiveTab(id)} className={`rounded-full border px-4 py-2 text-sm font-bold ${activeTab === id ? "border-[#003b5c] bg-[#003b5c] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-blue-50"}`}>{icon} {label}{id === "requests" && remainingQueue.length ? ` (${remainingQueue.length})` : ""}{id === "shipping" && readyToShip.length ? ` (${readyToShip.length})` : ""}{id === "survey" && pendingSurveys.length ? ` (${pendingSurveys.length})` : ""}</button>)}</div>

        {activeTab === "overview" && <section className="grid gap-6 md:grid-cols-2"><div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold text-[#003b5c]">درخواست‌های مرتبط در صف</h2>{remainingQueue.length === 0 ? <Empty text="درخواستی در حوزه‌های شما باقی نمانده است." /> : remainingQueue.map((req, index) => <div key={req.id} className="mb-3 flex justify-between rounded-xl bg-gray-50 p-3"><div><p className="font-bold">{req.title}</p><p className="mt-1 text-xs text-gray-500">{req.category} · {money(req.budget)}</p></div><button onClick={() => { setQueueIndex(queueIndex + index); setTimeLeft(60); }} className="rounded-lg bg-[#0b9c56] px-3 py-2 text-xs font-bold text-white">باز کردن</button></div>)}</div><div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold text-[#003b5c]">سفارش‌های نیازمند ارسال</h2>{readyToShip.length === 0 ? <Empty text="پس از پرداخت خریدار، سفارش‌ها اینجا می‌آیند." /> : readyToShip.map((order) => <div key={order.id} className="mb-3 rounded-xl bg-amber-50 p-3"><p className="font-bold">{order.title}</p><p className="mt-1 text-xs text-gray-600">آدرس: {order.shippingAddress}</p></div>)}</div></section>}

        {activeTab === "requests" && <section><h1 className="mb-6 text-2xl font-bold text-[#003b5c]">صف پنج درخواست مرتبط</h1><div className="space-y-4">{remainingQueue.length === 0 ? <Empty text="درخواست جدیدی در حوزه‌های شما موجود نیست." /> : remainingQueue.map((req, index) => <div key={req.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">درخواست {queueIndex + index + 1} از {queue.length}</span><h2 className="mt-3 font-bold text-[#003b5c]">{req.title}</h2><p className="mt-2 text-sm text-gray-600">{req.category} · {req.quantity} عدد · بودجه {money(req.budget)}</p></div><button onClick={() => { setQueueIndex(queueIndex + index); setTimeLeft(60); }} className="h-fit rounded-xl bg-[#0b9c56] px-4 py-2.5 text-sm font-bold text-white">ثبت پیشنهاد</button></div></div>)}</div></section>}

        {activeTab === "orders" && <section><h1 className="mb-2 text-2xl font-bold text-[#003b5c]">سفارش‌ها</h1><p className="mb-6 text-sm text-gray-500">ابتدا سفارش منتخب در انتظار پرداخت خریدار است؛ بلافاصله پس از پرداخت، همان سفارش آماده ارسال می‌شود.</p><div className="mb-8"><h2 className="mb-3 text-lg font-bold text-amber-800">منتظر پرداخت خریدار ({pendingPayment.length})</h2><div className="space-y-4">{pendingPayment.length === 0 ? <Empty text="هیچ سفارشی منتظر پرداخت خریدار نیست." /> : pendingPayment.map((order) => <OrderCard key={order.id} order={order}><p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">پس از پرداخت خریدار، این سفارش به فهرست آماده ارسال منتقل می‌شود.</p></OrderCard>)}</div></div><div><h2 className="mb-3 text-lg font-bold text-[#0b9c56]">پرداخت‌شده و آماده ارسال ({readyToShip.length})</h2><div className="space-y-4">{readyToShip.length === 0 ? <Empty text="سفارش پرداخت‌شده و آماده ارسال ندارید." /> : readyToShip.map((order) => <OrderCard key={order.id} order={order}><div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 p-3 text-sm text-green-900"><span>خریدار پرداخت را انجام داده؛ کالا را به آدرس ثبت‌شده ارسال کنید.</span><button onClick={() => setActiveTab("shipping")} className="rounded-lg bg-[#0b9c56] px-4 py-2 font-bold text-white">ثبت ارسال</button></div></OrderCard>)}</div></div></section>}

        {activeTab === "shipping" && <section><h1 className="mb-2 text-2xl font-bold text-[#003b5c]">ارسال کالا</h1><p className="mb-6 text-sm text-gray-500">هر سفارش پرداخت‌شده را جداگانه ارسال و کد رهگیری را ثبت کنید؛ این کار اعلان خریدار را ایجاد می‌کند.</p><div className="space-y-4">{readyToShip.length === 0 ? <Empty text="سفارش پرداخت‌شده و آماده ارسال ندارید." /> : readyToShip.map((order) => <OrderCard key={order.id} order={order}><div className="mt-4 rounded-xl bg-blue-50 p-4"><p className="mb-2 text-sm font-bold text-blue-900">آدرس تحویل خریدار</p><p className="text-sm text-blue-800">{order.shippingAddress}</p><div className="mt-4 flex gap-3"><input value={trackingByOrder[order.id] || ""} onChange={(e) => setTrackingByOrder({ ...trackingByOrder, [order.id]: e.target.value })} placeholder="کد رهگیری مرسوله" className="flex-1 rounded-xl border bg-white p-3 text-sm outline-none focus:border-[#00a8e8]" /><button onClick={() => shipOrder(order.id)} className="rounded-xl bg-[#0b9c56] px-5 py-3 font-bold text-white">✓ تایید ارسال کالا</button></div></div></OrderCard>)}</div></section>}

        {activeTab === "wallet" && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-gradient-to-br from-[#003b5c] to-[#005e94] p-6 text-white shadow-lg">
                <p className="text-blue-100">موجودی قابل برداشت</p>
                <p className="mt-3 text-3xl font-bold">{money(data.seller.walletBalance)}</p>
                <p className="mt-5 text-sm leading-7 text-blue-100">فقط پس از تایید دریافت کالا توسط خریدار، سهم خالص فروشنده پس از کسر کمیسیون به این کیف پول افزوده می‌شود.</p>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-[#003b5c]">برداشت موجودی به حساب فروشنده</h2>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                  <p><b>صاحب حساب:</b> {data.seller.bankAccountHolder || "ثبت نشده"}</p>
                  <p><b>بانک:</b> {data.seller.bankName || "ثبت نشده"}</p>
                  <p dir="ltr" className="text-right"><b>کارت:</b> {maskCard(data.seller.bankCardNumber)}</p>
                  <p dir="ltr" className="text-right"><b>شبا:</b> {maskSheba(data.seller.bankShebaNumber)}</p>
                  <p className={`mt-2 text-xs font-bold ${data.seller.bankDetailsVerified ? "text-green-600" : "text-amber-600"}`}>{data.seller.bankDetailsVerified ? "✓ اطلاعات بانکی تایید شده" : "درخواست برداشت توسط ادمین بررسی می‌شود"}</p>
                </div>
                <input value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))} placeholder="مبلغ برداشت (تومان)" className="mt-4 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]" />
                <button onClick={requestWithdrawal} className="mt-3 w-full rounded-xl bg-[#0b9c56] py-3 font-bold text-white">ثبت درخواست برداشت</button>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold">گردش کیف پول فروشنده</h2>{data.transactions.length === 0 ? <Empty text="هنوز تراکنش واریز یا تسویه ندارید." /> : data.transactions.map((tx) => <div key={tx.id} className="flex justify-between border-b py-3 text-sm"><div><p className="font-bold">{tx.description}</p><p className="text-xs text-gray-500">{dateLabel(tx.createdAt)}</p></div><b className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>{tx.amount >= 0 ? "+" : ""}{money(Math.abs(tx.amount))}</b></div>)}</div>
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold">درخواست‌های برداشت</h2>{data.withdrawals.length === 0 ? <Empty text="هنوز درخواست برداشتی ندارید." /> : data.withdrawals.map((item) => <div key={item.id} className="border-b py-3 text-sm"><div className="flex justify-between"><b>{money(item.amount)}</b><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-green-100 text-green-700" : item.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status === "approved" ? "تسویه شد" : item.status === "rejected" ? "رد شد" : "در انتظار بررسی"}</span></div><p className="mt-1 text-xs text-gray-500">{item.id} · {dateLabel(item.createdAt)}</p>{item.adminNote && <p className="mt-1 text-xs text-gray-600">یادداشت ادمین: {item.adminNote}</p>}</div>)}</div>
            </div>
          </section>
        )}

        {activeTab === "survey" && (
          <section>
            <h1 className="mb-2 text-2xl font-bold text-[#003b5c]">ارزیابی خریداران معاملات تکمیل‌شده</h1>
            <p className="mb-6 text-sm text-gray-500">این امتیازها مبنای انتخاب خریداران برتر OptiBid هستند.</p>
            <div className="space-y-5">
              {pendingSurveys.length === 0 ? (
                <Empty text="نظرسنجی تکمیل‌نشده‌ای ندارید." />
              ) : (
                pendingSurveys.map((order) => (
                  <TradeSurvey key={order.id} role="seller" reviewerId={data.seller.id} order={order} onSaved={loadDashboard} />
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "reviews" && <section><h1 className="mb-2 text-2xl font-bold text-[#003b5c]">دیدگاه‌ها</h1><p className="mb-6 text-sm text-gray-500">توضیحاتی که خریداران در فرم نظرسنجی درباره شما نوشته‌اند، اینجا نمایش داده می‌شود.</p><div className="space-y-4">{receivedReviews.length === 0 ? <Empty text="هنوز دیدگاهی برای شما ثبت نشده است." /> : receivedReviews.map((review) => { const order = ordersById.get(review.orderId); return <article key={review.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-[#003b5c]">{order?.buyerName || "خریدار"}</p><p className="mt-1 text-xs text-gray-500">سفارش {review.orderId}</p></div><SellerStars score={review.overall * 20} size="sm" /></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{review.comment || "بدون توضیح"}</p></article>; })}</div></section>}

        {activeTab === "archive" && <section><h1 className="mb-6 text-2xl font-bold text-[#003b5c]">بایگانی فروشنده</h1><div className="space-y-4">{archiveOrders.length === 0 ? <Empty text="پس از تکمیل یا لغو سفارش، امکان بایگانی آن فعال می‌شود." /> : archiveOrders.map((order) => <OrderCard key={order.id} order={order}><button onClick={() => archiveOrder(order.id)} className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600">انتقال به بایگانی</button></OrderCard>)}</div></section>}

        {activeTab === "messages" && <section className="grid min-h-[480px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-3"><div className="border-l bg-gray-50 p-4"><h2 className="mb-4 font-bold">گفتگو با خریداران</h2>{counterpartUsers.length === 0 ? <p className="text-sm text-gray-500">پس از دریافت درخواست یا سفارش، گفتگوها در این بخش فعال می‌شوند.</p> : counterpartUsers.map((user) => <button key={user.id} onClick={() => setActiveChatUserId(user.id)} className={`mb-2 w-full rounded-xl p-3 text-right text-sm font-bold ${activeChatUserId === user.id ? "bg-blue-100 text-[#003b5c]" : "bg-white text-gray-600"}`}>{user.name}</button>)}</div><div className="flex flex-col p-5 md:col-span-2"><div className="flex-1 space-y-3 overflow-y-auto">{currentMessages.length === 0 ? <p className="text-center text-sm text-gray-500">پیامی در این گفتگو وجود ندارد.</p> : currentMessages.map((message) => <div key={message.id} className={`max-w-[75%] rounded-2xl p-3 text-sm ${message.senderId === data.seller.id ? "mr-auto bg-[#003b5c] text-white" : "bg-gray-100 text-gray-800"}`}>{message.content}<p className="mt-1 text-[10px] opacity-70">{dateLabel(message.createdAt)}</p></div>)}</div><div className="mt-4 flex gap-2"><input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="پیام به خریدار..." className="flex-1 rounded-xl border p-3 text-sm outline-none focus:border-[#00a8e8]" /><button onClick={sendMessage} className="rounded-xl bg-[#00a8e8] px-5 font-bold text-white">ارسال</button></div></div></section>}

        {activeTab === "notifications" && <section><h1 className="mb-6 text-2xl font-bold text-[#003b5c]">اعلان‌ها</h1><div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">{data.notifications.length === 0 ? <Empty text="هنوز اعلانی ندارید." /> : data.notifications.map((n) => <div key={n.id} className="border-b p-5"><div className="flex justify-between gap-4"><div><p className="font-bold text-[#003b5c]">{n.title}</p><p className="mt-1 text-sm text-gray-600">{n.body}</p></div><p className="text-xs text-gray-400">{dateLabel(n.createdAt)}</p></div></div>)}</div></section>}

        {activeTab === "settings" && (
          <section className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">تنظیمات فروشگاه</h1>
            <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-[#003b5c] text-white shadow-sm">
                {storeAvatarPreview ? <img src={storeAvatarPreview} alt="لوگوی فروشگاه" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-3xl font-bold">{settings.storeName.charAt(0) || "🏪"}</div>}
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h2 className="font-bold text-gray-900">لوگوی فروشگاه / تصویر فروشنده</h2>
                <p className="mt-1 text-xs leading-6 text-gray-500">فرمت مجاز JPG، PNG یا WEBP با حداکثر حجم ۳ مگابایت. پس از انتخاب، روی ذخیره تنظیمات کلیک کنید.</p>
                <label className="mt-3 inline-flex cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8] hover:bg-blue-100">
                  انتخاب یا تغییر لوگو
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleStoreAvatarChange(event.target.files?.[0])} />
                </label>
              </div>
            </div>
            <Field label="نام فروشگاه / شرکت" value={settings.storeName} onChange={(value) => setSettings({ ...settings, storeName: value })} />
            <label className="mt-4 block text-sm font-bold text-gray-700">درباره فروشگاه</label>
            <textarea value={settings.bio} onChange={(e) => setSettings({ ...settings, bio: e.target.value })} className="mt-2 min-h-28 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]" />
            <h2 className="mt-6 border-b pb-3 text-sm font-bold">حوزه‌های فعالیت — فقط این درخواست‌ها به رادار شما می‌آیند</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{Object.values(categoryMap).map((category) => <label key={category} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold ${settings.categories.includes(category) ? "border-[#00a8e8] bg-blue-50" : "bg-gray-50"}`}><input type="checkbox" checked={settings.categories.includes(category)} onChange={() => setSettings({ ...settings, categories: settings.categories.includes(category) ? settings.categories.filter((x) => x !== category) : [...settings.categories, category] })} />{category}</label>)}</div>
            <button onClick={saveSettings} className="mt-6 rounded-xl bg-[#003b5c] px-7 py-3 font-bold text-white">ذخیره تنظیمات</button>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ value, label, color }: { value: string | number; label: string; color: "blue" | "amber" | "orange" | "green" | "plain" }) { const c = { blue: "border-b-4 border-blue-500", amber: "border-b-4 border-amber-500", orange: "border-b-4 border-orange-500", green: "border-b-4 border-[#00a8e8]", plain: "" }[color]; return <div className={`rounded-2xl bg-white p-5 text-center shadow-sm ${c}`}><p className="text-2xl font-bold text-[#003b5c]">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">{text}</div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-bold text-gray-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]" /></label>; }
function OrderCard({ order, children }: { order: any; children: ReactNode }) { return <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="mb-2 flex gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{order.status}</span><span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs">{order.id}</span></div><h2 className="text-xl font-bold text-[#003b5c]">{order.title}</h2><p className="mt-1 text-sm text-gray-600">خریدار: {order.buyerName}</p><p className="mt-1 text-xs text-gray-500">آدرس ارسال: {order.shippingAddress}</p></div><div className="text-left"><p className="text-xl font-bold text-[#0b9c56]">{money(order.totalAmount)}</p><p className="mt-1 text-xs text-gray-500">خالص فروشنده پس از کمیسیون: {money(order.sellerAmount)}</p></div></div>{children}</div>; }


function OfferSpecsForm({ specs, onChange }: { specs: OfferSpecs; onChange: (key: keyof OfferSpecs, value: string) => void }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 text-right">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="font-bold text-[#003b5c]">مشخصات واقعی کالای پیشنهادی فروشنده</h3>
        <p className="mt-1 text-xs leading-6 text-gray-500">این مشخصات قبل از پرداخت به خریدار نمایش داده می‌شود و خریدار باید آن را تایید کند. تمام فیلدهای اصلی را دقیق وارد کنید.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SpecInput label="برند" value={specs.brand} onChange={(value) => onChange("brand", value)} placeholder="Lenovo" />
        <SpecInput label="مدل دقیق" value={specs.exactModel} onChange={(value) => onChange("exactModel", value)} placeholder="ThinkPad E14" />
        <SpecInput label="کد مدل / کانفیگ" value={specs.serialOrConfig} onChange={(value) => onChange("serialOrConfig", value)} placeholder="E14 Gen / 155H / 16/512" />
        <SpecInput label="پردازنده CPU" value={specs.cpu} onChange={(value) => onChange("cpu", value)} placeholder="Core Ultra 7 155H" />
        <SpecInput label="RAM" value={specs.ram} onChange={(value) => onChange("ram", value)} placeholder="16GB" />
        <SpecInput label="حافظه SSD/HDD" value={specs.storage} onChange={(value) => onChange("storage", value)} placeholder="512GB SSD" />
        <SpecInput label="GPU / گرافیک" value={specs.gpu} onChange={(value) => onChange("gpu", value)} placeholder="Intel Arc / ندارد" />
        <SpecInput label="نمایشگر" value={specs.display} onChange={(value) => onChange("display", value)} placeholder="14 inch FHD" />
        <SpecInput label="سال ساخت" value={specs.manufactureYear} onChange={(value) => onChange("manufactureYear", value.replace(/\D/g, "").slice(0, 4))} placeholder="2023" />
        <SpecSelect label="وضعیت کالا" value={specs.productCondition} onChange={(value) => onChange("productCondition", value)} options={[["new", "نو"], ["open_box", "اپن‌باکس"], ["refurbished", "ریفربیشد"], ["used_like_new", "دست‌دوم در حد نو"], ["used_good", "دست‌دوم سالم"], ["used_fair", "دست‌دوم معمولی"], ["for_parts", "قطعاتی/نیازمند تعمیر"]]} />
        <SpecSelect label="گارانتی" value={specs.warrantyStatus} onChange={(value) => onChange("warrantyStatus", value)} options={[["manufacturer", "رسمی/شرکتی"], ["seller", "گارانتی فروشنده"], ["test", "مهلت تست"], ["none", "بدون گارانتی"]]} />
        <SpecInput label="مدت گارانتی/تست (ماه/روز)" value={specs.warrantyMonths} onChange={(value) => onChange("warrantyMonths", value.replace(/\D/g, "").slice(0, 3))} placeholder="3" />
        <SpecSelect label="سلامت کلی قطعات" value={specs.partsHealth} onChange={(value) => onChange("partsHealth", value)} options={[["all_healthy", "همه قطعات سالم"], ["minor_issue", "ایراد جزئی"], ["needs_repair", "نیازمند تعمیر"]]} />
        <SpecSelect label="سلامت CPU" value={specs.cpuHealth} onChange={(value) => onChange("cpuHealth", value)} options={healthOptions} />
        <SpecSelect label="سلامت مادربرد" value={specs.motherboardHealth} onChange={(value) => onChange("motherboardHealth", value)} options={healthOptions} />
        <SpecSelect label="سلامت نمایشگر" value={specs.displayHealth} onChange={(value) => onChange("displayHealth", value)} options={healthOptions} />
        <SpecSelect label="سلامت SSD/HDD" value={specs.storageHealth} onChange={(value) => onChange("storageHealth", value)} options={healthOptions} />
        <SpecSelect label="سلامت RAM" value={specs.ramHealth} onChange={(value) => onChange("ramHealth", value)} options={healthOptions} />
        <SpecSelect label="سلامت GPU" value={specs.gpuHealth} onChange={(value) => onChange("gpuHealth", value)} options={healthOptions} />
        <SpecSelect label="کیبورد/تاچ‌پد" value={specs.keyboardTouchpadHealth} onChange={(value) => onChange("keyboardTouchpadHealth", value)} options={healthOptions} />
        <SpecSelect label="بدنه/لولا" value={specs.bodyHingeHealth} onChange={(value) => onChange("bodyHingeHealth", value)} options={healthOptions} />
        <SpecInput label="سلامت باتری (%)" value={specs.batteryHealthPercent} onChange={(value) => onChange("batteryHealthPercent", value.replace(/\D/g, "").slice(0, 3))} placeholder="85" />
        <SpecSelect label="گرید ظاهری" value={specs.appearanceGrade} onChange={(value) => onChange("appearanceGrade", value)} options={[["A", "A - بسیار تمیز"], ["B", "B - خط‌وخش جزئی"], ["C", "C - آسیب قابل مشاهده"]]} />
        <SpecSelect label="سابقه تعمیر" value={specs.repairHistory} onChange={(value) => onChange("repairHistory", value)} options={[["none", "بدون تعمیر"], ["minor", "تعمیر جزئی"], ["major", "تعمیر اساسی"]]} />
        <SpecSelect label="میزان کارکرد" value={specs.usageLevel} onChange={(value) => onChange("usageLevel", value)} options={[["low", "کم‌کارکرد"], ["normal", "معمولی"], ["heavy", "پرکارکرد"]]} />
        <SpecSelect label="لوازم جانبی" value={specs.accessoriesStatus} onChange={(value) => onChange("accessoriesStatus", value)} options={[["complete", "کامل"], ["missing_minor", "کسری جزئی"], ["missing_key", "کسری مهم"]]} />
        <SpecSelect label="شارژر/آداپتور" value={specs.chargerStatus} onChange={(value) => onChange("chargerStatus", value)} options={[["original", "اصل"], ["compatible", "سازگار/غیراصل"], ["missing", "ندارد"], ["not_applicable", "نامرتبط"]]} />
        <SpecSelect label="جعبه اصلی" value={specs.originalPackaging} onChange={(value) => onChange("originalPackaging", value)} options={[["yes", "دارد"], ["no", "ندارد"], ["unknown", "نامشخص"]]} />
        <SpecSelect label="فاکتور/اصالت" value={specs.purchaseInvoiceAvailable} onChange={(value) => onChange("purchaseInvoiceAvailable", value)} options={[["yes", "دارد"], ["no", "ندارد"], ["unknown", "نامشخص"]]} />
        <SpecInput label="مهلت تست/مرجوعی (روز)" value={specs.testDeadlineDays} onChange={(value) => onChange("testDeadlineDays", value.replace(/\D/g, "").slice(0, 3))} placeholder="7" />
      </div>
      <label className="mt-3 block text-xs font-bold text-gray-700">شرایط مرجوعی/تعهد فروشنده<textarea value={specs.returnPolicy} onChange={(e) => onChange("returnPolicy", e.target.value)} className="mt-1 min-h-16 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]" /></label>
      <label className="mt-3 block text-xs font-bold text-gray-700">توضیحات تکمیلی مشخصات<textarea value={specs.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="مثلاً شارژر اصل است، خط روی قاب دارد، باتری تست شده، پورت‌ها سالم هستند..." className="mt-1 min-h-16 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]" /></label>
    </div>
  );
}

function SpecInput({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block text-xs font-bold text-gray-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]" /></label>;
}

function SpecSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) {
  return <label className="block text-xs font-bold text-gray-700">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border bg-white p-2 font-normal outline-none focus:border-[#00a8e8]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
