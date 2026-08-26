"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import TradeSurvey from "@/components/TradeSurvey";
import SellerStars from "@/components/SellerStars";
import { ProductImageStrip, ProductThumb } from "@/components/ProductImages";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";

type BuyerDashboardData = {
  buyer: {
    id: number;
    fullName: string;
    email: string;
    avatarName?: string;
    walletBalance: number;
    defaultAddress?: string;
    bio?: string;
    categories?: string[];
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankCardNumber?: string;
    bankShebaNumber?: string;
    bankDetailsVerified?: boolean;
  };
  requests: any[];
  offers: any[];
  orders: any[];
  transactions: any[];
  withdrawals: any[];
  notifications: any[];
  messages: any[];
  reviews: any[];
};

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
];

const money = (value: number | string) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const maskCard = (value = "") =>
  value ? `${value.slice(0, 4)}-****-****-${value.slice(-4)}` : "ثبت نشده";
const maskSheba = (value = "") =>
  value
    ? `${value.slice(0, 4)} **** **** **** **** ${value.slice(-4)}`
    : "ثبت نشده";
const dateLabel = (value?: string) =>
  value
    ? new Date(value).toLocaleString("fa-IR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

export default function BuyerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<BuyerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openOffers, setOpenOffers] = useState<Record<number, boolean>>({});
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [buyerConfirmedOfferSpecs, setBuyerConfirmedOfferSpecs] =
    useState(false);
  const [useAlternateAddress, setUseAlternateAddress] = useState(false);
  const [alternateAddress, setAlternateAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "gateway">(
    "wallet",
  );
  const [topupAmount, setTopupAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState({
    fullName: "",
    defaultAddress: "",
    bio: "",
    categories: [] as string[],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const buyerId =
    typeof window === "undefined"
      ? 0
      : Number(localStorage.getItem("userId") || 0);

  const loadDashboard = async () => {
    if (!buyerId) {
      setError(
        "برای مشاهده داده‌های واقعی داشبورد، ابتدا با یک حساب خریدار ثبت‌نام یا وارد شوید.",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/buyer?buyerId=${buyerId}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "خطا در دریافت داشبورد");
      setData(result);
      setProfile({
        fullName: result.buyer.fullName || "",
        defaultAddress: result.buyer.defaultAddress || "",
        bio: result.buyer.bio || "",
        categories: result.buyer.categories || [],
      });
      setAvatarPreview(
        result.buyer.avatarName
          ? `/api/avatar?userId=${result.buyer.id}&v=${encodeURIComponent(result.buyer.avatarName)}`
          : "",
      );
      setAvatarFile(null);
      const initialCounterpart =
        result.offers[0]?.seller?.id || result.orders[0]?.sellerId || null;
      setActiveChatUserId((current) => current || initialCounterpart);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ارتباط با سرور ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const doAction = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "عملیات ناموفق بود.");
    return result;
  };

  const chooseOffer = async () => {
    if (!data || !selectedOffer) return;
    if (!buyerConfirmedOfferSpecs) {
      alert(
        "قبل از انتخاب پیشنهاد، مشخصات کالای اعلام‌شده توسط فروشنده را بررسی و تایید کنید.",
      );
      return;
    }
    const shippingAddress = useAlternateAddress
      ? alternateAddress
      : data.buyer.defaultAddress || "";
    if (!shippingAddress.trim()) {
      alert(
        "لطفاً ابتدا آدرس پیش‌فرض را در پروفایل ثبت کنید یا آدرس جدید تحویل را وارد کنید.",
      );
      return;
    }
    try {
      const result = await doAction("/api/orders/select-offer", {
        buyerId: data.buyer.id,
        offerId: selectedOffer.id,
        useAlternateAddress,
        shippingAddress,
        buyerConfirmedProductSpecs: true,
      });
      alert(result.message);
      setSelectedOffer(null);
      setActiveTab("orders");
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا در انتخاب پیشنهاد");
    }
  };

  const payOrder = async (orderId: string) => {
    if (!data) return;
    try {
      const result = await doAction("/api/orders/pay", {
        buyerId: data.buyer.id,
        orderId,
        paymentMethod,
      });
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "پرداخت ناموفق بود");
    }
  };

  const confirmReceived = async (orderId: string) => {
    if (
      !data ||
      !confirm(
        "آیا دریافت سالم کالا را تایید می‌کنید؟ با تایید شما، وجه پس از کسر کمیسیون به کیف پول فروشنده واریز می‌شود.",
      )
    )
      return;
    try {
      const result = await doAction("/api/orders/confirm-received", {
        buyerId: data.buyer.id,
        orderId,
      });
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "تایید دریافت ناموفق بود");
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!data || !confirm("آیا سفارش آماده پرداخت را لغو می‌کنید؟")) return;
    try {
      const result = await doAction("/api/orders/cancel", {
        buyerId: data.buyer.id,
        orderId,
      });
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "لغو سفارش ناموفق بود");
    }
  };

  const archiveOrder = async (orderId: string) => {
    if (!data) return;
    try {
      const result = await doAction("/api/orders/archive", {
        userId: data.buyer.id,
        orderId,
        role: "buyer",
      });
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "بایگانی ناموفق بود");
    }
  };

  const topupWallet = async () => {
    if (!data || !topupAmount) return;
    try {
      const result = await doAction("/api/wallet/topup", {
        userId: data.buyer.id,
        amount: topupAmount,
      });
      setTopupAmount("");
      alert(`${result.message} موجودی جدید: ${money(result.walletBalance)}`);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "شارژ کیف پول ناموفق بود");
    }
  };

  const requestWithdrawal = async () => {
    if (!data || !withdrawalAmount) return;
    try {
      const result = await doAction("/api/wallet/withdraw", {
        userId: data.buyer.id,
        amount: withdrawalAmount,
      });
      setWithdrawalAmount("");
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "درخواست برداشت ناموفق بود.");
    }
  };

  const handleAvatarChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("لطفاً یک فایل تصویری معتبر انتخاب کنید.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!data) return;
    try {
      const form = new FormData();
      form.append("buyerId", String(data.buyer.id));
      form.append("fullName", profile.fullName);
      form.append("defaultAddress", profile.defaultAddress);
      form.append("bio", profile.bio);
      form.append("categories", JSON.stringify(profile.categories));
      if (avatarFile) form.append("avatar", avatarFile);

      const response = await fetch("/api/buyer/profile", {
        method: "PATCH",
        body: form,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      localStorage.setItem("userDisplayName", profile.fullName);
      setAvatarFile(null);
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "ذخیره پروفایل ناموفق بود");
    }
  };

  const sendMessage = async () => {
    if (!data || !activeChatUserId || !messageText.trim()) return;
    try {
      const result = await doAction("/api/messages", {
        senderId: data.buyer.id,
        receiverId: activeChatUserId,
        content: messageText,
      });
      setMessageText("");
      alert(result.message);
      await loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "ارسال پیام ناموفق بود");
    }
  };

  const offersByRequest = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const offer of data?.offers || []) {
      const items = map.get(offer.requestId) || [];
      items.push(offer);
      map.set(offer.requestId, items);
    }
    return map;
  }, [data]);

  const counterparts = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const offer of data?.offers || [])
      if (offer.seller)
        map.set(offer.seller.id, {
          id: offer.seller.id,
          name: offer.seller.fullName,
        });
    for (const order of data?.orders || [])
      map.set(order.sellerId, { id: order.sellerId, name: order.sellerName });
    return [...map.values()];
  }, [data]);

  const activeMessages = (data?.messages || []).filter(
    (item) =>
      item.senderId === activeChatUserId ||
      item.receiverId === activeChatUserId,
  );
  const pendingOrders = (data?.orders || []).filter(
    (order) => order.status === "pending_payment",
  );
  const shippedOrders = (data?.orders || []).filter(
    (order) => order.status === "shipped",
  );
  const archiveOrders = (data?.orders || []).filter(
    (order) =>
      order.buyerArchived ||
      ["completed", "cancelled", "returned"].includes(order.status),
  );
  const invoiceOrders = (data?.orders || []).filter((order) =>
    ["paid", "shipped", "completed"].includes(order.status),
  );
  const reviewedOrderIds = new Set(
    (data?.reviews || [])
      .filter((review) => review.reviewerId === data?.buyer.id)
      .map((review) => review.orderId),
  );
  const pendingSurveys = (data?.orders || []).filter(
    (order) => order.status === "completed" && !reviewedOrderIds.has(order.id),
  );
  const ordersById = new Map(
    (data?.orders || []).map((order) => [order.id, order]),
  );
  const receivedReviews = (data?.reviews || []).filter(
    (review) => review.revieweeId === data?.buyer.id,
  );

  const tabs = [
    ["overview", "پیشخوان", "🏠"],
    ["requests", "درخواست‌ها", "📝"],
    ["offers", "پیشنهادها", "🎯"],
    ["orders", "سفارش‌ها", "📦"],
    ["receive", "دریافت کالا", "📥"],
    ["wallet", "کیف پول", "💰"],
    ["messages", "پیام‌ها", "💬"],
    ["reviews", "دیدگاه‌ها", "🗣️"],
    ["notifications", "اعلان‌ها", "🔔"],
    ["survey", "نظرسنجی", "⭐"],
    ["invoices", "فاکتورها", "🧾"],
    ["archive", "بایگانی", "🗂️"],
    ["profile", "پروفایل", "👤"],
    ["settings", "تنظیمات", "⚙️"],
  ] as const;

  if (loading)
    return (
      <div
        dir="rtl"
        className="grid min-h-[60vh] place-items-center bg-gray-50 text-[#003b5c]"
      >
        در حال بارگذاری داشبورد واقعی...
      </div>
    );
  if (error || !data)
    return (
      <div
        dir="rtl"
        className="mx-auto mt-12 max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"
      >
        <h1 className="text-xl font-bold text-amber-900">
          داشبورد خریدار آماده نیست
        </h1>
        <p className="mt-3 text-sm leading-7 text-amber-800">{error}</p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-xl bg-[#003b5c] px-6 py-3 font-bold text-white"
        >
          ثبت‌نام خریدار
        </Link>
      </div>
    );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f4f7f9] pb-16">
      <div className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl justify-between text-sm text-gray-500">
          <span>OptiBid / داشبورد خریدار</span>
          <span>{data.buyer.fullName}</span>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-[#003b5c]">
              {data.requests.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">درخواست‌های من</p>
          </div>
          <div className="rounded-2xl border-b-4 border-red-500 bg-white p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-red-600">
              {pendingOrders.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">آماده پرداخت</p>
          </div>
          <div className="rounded-2xl border-b-4 border-blue-500 bg-white p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-[#003b5c]">
              {shippedOrders.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">در انتظار دریافت</p>
          </div>
          <div className="rounded-2xl border-b-4 border-[#00a8e8] bg-white p-5 text-center shadow-sm">
            <p className="text-xl font-bold text-[#00a8e8]">
              {money(data.buyer.walletBalance)}
            </p>
            <p className="mt-1 text-sm text-gray-500">موجودی کیف پول</p>
          </div>
        </section>

        {pendingOrders.length > 0 && (
          <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-[#003b5c] to-[#005e94] p-5 text-white sm:flex-row">
            <div>
              <h2 className="font-bold">
                {pendingOrders.length} سفارش آماده پرداخت دارید
              </h2>
              <p className="mt-1 text-sm text-blue-100">
                پس از پرداخت، مبلغ نزد OptiBid امانت می‌ماند.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("orders")}
              className="rounded-xl bg-[#00a8e8] px-5 py-2.5 text-sm font-bold"
            >
              مشاهده سفارش‌ها
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-[2rem] border border-gray-200 bg-white/70 p-4 shadow-sm">
          {tabs.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${activeTab === id ? "border-[#003b5c] bg-[#003b5c] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-blue-50"}`}
            >
              {icon} {label}
              {id === "orders" && pendingOrders.length > 0
                ? ` (${pendingOrders.length})`
                : ""}
              {id === "notifications" &&
              data.notifications.filter((n) => !n.readAt).length > 0
                ? ` (${data.notifications.filter((n) => !n.readAt).length})`
                : ""}
              {id === "survey" && pendingSurveys.length > 0
                ? ` (${pendingSurveys.length})`
                : ""}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-tr from-[#003b5c] to-[#005e94] p-8 text-center text-white shadow-lg">
              <p className="text-blue-100">موجودی کیف پول</p>
              <p className="mt-3 text-4xl font-bold">
                {money(data.buyer.walletBalance)}
              </p>
              <button
                onClick={() => setActiveTab("wallet")}
                className="mt-6 rounded-xl bg-white px-5 py-2.5 font-bold text-[#003b5c]"
              >
                مدیریت کیف پول
              </button>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold">آخرین اعلان‌ها</h2>
              {data.notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="mb-3 rounded-xl bg-gray-50 p-3">
                  <p className="font-bold text-[#003b5c]">{n.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{n.body}</p>
                </div>
              ))}
              {data.notifications.length === 0 && (
                <p className="text-sm text-gray-500">هنوز اعلانی ندارید.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "requests" && (
          <section>
            <div className="mb-6 flex justify-between">
              <h1 className="text-2xl font-bold text-[#003b5c]">
                درخواست‌های من
              </h1>
              <Link
                href="/request-purchase"
                className="rounded-xl bg-[#00a8e8] px-5 py-2.5 text-sm font-bold text-white"
              >
                + درخواست جدید
              </Link>
            </div>
            <div className="space-y-5">
              {data.requests.length === 0 ? (
                <Empty text="درخواستی ثبت نشده است." />
              ) : (
                data.requests.map((request) => {
                  const offers = offersByRequest.get(request.id) || [];
                  return (
                    <div
                      key={request.id}
                      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <ProductThumb
                            images={request.productImages}
                            title={request.title}
                            className="h-16 w-16"
                          />
                          <div className="min-w-0">
                            <h2 className="text-xl font-bold text-[#003b5c]">
                              {request.title}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                              {request.category} · تعداد {request.quantity} ·
                              بودجه {money(request.budget)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {request.description}
                            </p>
                            {request.aiPriceEstimate && (
                              <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-900">
                                <b>تخمین هوشمند:</b> هر واحد{" "}
                                {money(
                                  request.aiPriceEstimate.estimatedUnitFair,
                                )}{" "}
                                · بازه کل{" "}
                                {money(
                                  request.aiPriceEstimate.estimatedTotalMin,
                                )}{" "}
                                تا{" "}
                                {money(
                                  request.aiPriceEstimate.estimatedTotalMax,
                                )}{" "}
                                · اعتماد {request.aiPriceEstimate.confidence}%
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {request.status}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setOpenOffers((all) => ({
                            ...all,
                            [request.id]: !all[request.id],
                          }))
                        }
                        className="rounded-xl border border-[#00a8e8]/30 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#00a8e8]"
                      >
                        مشاهده و انتخاب پیشنهادها ({offers.length})
                      </button>
                      {openOffers[request.id] && (
                        <div className="mt-4 space-y-3 rounded-2xl border border-blue-100 bg-[#f8fcfb] p-4">
                          {offers.length === 0 ? (
                            <p className="p-4 text-center text-sm text-gray-500">
                              هنوز پیشنهادی از فروشندگان دریافت نشده است.
                            </p>
                          ) : (
                            offers.map((offer) => (
                              <OfferCard
                                key={offer.id}
                                offer={offer}
                                onSelect={() => {
                                  setSelectedOffer(offer);
                                  setBuyerConfirmedOfferSpecs(false);
                                  setUseAlternateAddress(false);
                                  setAlternateAddress("");
                                }}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {activeTab === "offers" && (
          <section>
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              پیشنهادهای دریافتی فروشندگان
            </h1>
            <div className="space-y-4">
              {data.offers.length === 0 ? (
                <Empty text="هنوز پیشنهادی دریافت نشده است." />
              ) : (
                data.offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onSelect={() => {
                      setSelectedOffer(offer);
                      setBuyerConfirmedOfferSpecs(false);
                      setUseAlternateAddress(false);
                      setAlternateAddress("");
                    }}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {selectedOffer && (
          <section className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex justify-between">
                <h2 className="text-xl font-bold text-[#003b5c]">
                  تایید انتخاب پیشنهاد
                </h2>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="text-gray-400"
                >
                  ✕
                </button>
              </div>
              <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                فروشنده: {selectedOffer.sellerName} — مبلغ پیشنهادی:{" "}
                <b>{money(selectedOffer.amount)}</b>
              </p>
              <ProductImageStrip
                images={selectedOffer.productImages}
                title={selectedOffer.request?.title || "کالای پیشنهادی"}
                label="عکس‌های کالای پیشنهادی فروشنده"
              />
              <OfferSpecsSummary specs={selectedOffer.productSpecs} />
              <label
                className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-bold ${selectedOffer.productSpecs ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
              >
                <input
                  type="checkbox"
                  disabled={!selectedOffer.productSpecs}
                  checked={buyerConfirmedOfferSpecs}
                  onChange={(e) =>
                    setBuyerConfirmedOfferSpecs(e.target.checked)
                  }
                  className="mt-1"
                />{" "}
                {selectedOffer.productSpecs
                  ? "مشخصات کالای اعلام‌شده توسط فروشنده را بررسی کردم و تایید می‌کنم؛ پس از تایید، سفارش آماده پرداخت می‌شود."
                  : "این پیشنهاد هنوز مشخصات کامل کالا ندارد و قابل انتخاب برای پرداخت نیست."}
              </label>
              <div className="mt-5">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={useAlternateAddress}
                    onChange={(e) => setUseAlternateAddress(e.target.checked)}
                  />{" "}
                  ارسال به آدرس جدید
                </label>
                {useAlternateAddress ? (
                  <textarea
                    value={alternateAddress}
                    onChange={(e) => setAlternateAddress(e.target.value)}
                    placeholder="آدرس جدید تحویل را وارد کنید"
                    className="mt-3 min-h-24 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"
                  />
                ) : (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    آدرس پیش‌فرض:{" "}
                    {data.buyer.defaultAddress ||
                      "ثبت نشده — ابتدا پروفایل را تکمیل کنید."}
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="flex-1 rounded-xl bg-gray-100 py-3 font-bold"
                >
                  بازگشت
                </button>
                <button
                  onClick={chooseOffer}
                  disabled={
                    !buyerConfirmedOfferSpecs || !selectedOffer.productSpecs
                  }
                  className="flex-[2] rounded-xl bg-[#003b5c] py-3 font-bold text-white disabled:bg-gray-300"
                >
                  تایید مشخصات و انتقال به سفارش
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "orders" && (
          <section>
            <h1 className="mb-2 text-2xl font-bold text-[#003b5c]">
              سفارش‌های آماده پرداخت
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              پس از پرداخت، سفارش به فروشنده ارسال می‌شود تا کالا را به آدرس
              ثبت‌شده تحویل دهد.
            </p>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <Empty text="هیچ سفارش آماده پرداختی ندارید." />
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order}>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as "wallet" | "gateway",
                          )
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        <option value="wallet">پرداخت از کیف پول</option>
                        <option value="gateway">
                          پرداخت اینترنتی (شبیه‌سازی درگاه)
                        </option>
                      </select>
                      <button
                        onClick={() => payOrder(order.id)}
                        className="rounded-xl bg-red-500 px-5 py-2 font-bold text-white"
                      >
                        پرداخت امانی
                      </button>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-600"
                      >
                        انصراف
                      </button>
                    </div>
                  </OrderCard>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "receive" && (
          <section>
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              دریافت کالا
            </h1>
            <div className="space-y-4">
              {shippedOrders.length === 0 ? (
                <Empty text="هیچ کالای ارسالی برای تایید دریافت ندارید." />
              ) : (
                shippedOrders.map((order) => (
                  <OrderCard key={order.id} order={order}>
                    <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                      کد رهگیری فروشنده: <b>{order.trackingCode}</b>
                    </div>
                    <button
                      onClick={() => confirmReceived(order.id)}
                      className="mt-4 rounded-xl bg-[#0b9c56] px-5 py-3 font-bold text-white"
                    >
                      ✓ تایید دریافت کالا و آزادسازی وجه فروشنده
                    </button>
                  </OrderCard>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "wallet" && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-gradient-to-br from-[#003b5c] to-[#005e94] p-6 text-white shadow-lg">
                <p className="text-blue-100">موجودی قابل استفاده</p>
                <p className="mt-3 text-3xl font-bold">
                  {money(data.buyer.walletBalance)}
                </p>
                <div className="mt-6">
                  <input
                    value={topupAmount}
                    onChange={(e) =>
                      setTopupAmount(
                        e.target.value
                          .replace(/\D/g, "")
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                      )
                    }
                    placeholder="مبلغ شارژ"
                    className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-white placeholder:text-blue-100"
                  />
                  <button
                    onClick={topupWallet}
                    className="mt-3 w-full rounded-xl bg-white py-3 font-bold text-[#003b5c]"
                  >
                    شارژ کیف پول
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-[#003b5c]">
                  درخواست برداشت به حساب بانکی
                </h2>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                  <p>
                    <b>صاحب حساب:</b>{" "}
                    {data.buyer.bankAccountHolder || "ثبت نشده"}
                  </p>
                  <p>
                    <b>بانک:</b> {data.buyer.bankName || "ثبت نشده"}
                  </p>
                  <p dir="ltr" className="text-right">
                    <b>کارت:</b> {maskCard(data.buyer.bankCardNumber)}
                  </p>
                  <p dir="ltr" className="text-right">
                    <b>شبا:</b> {maskSheba(data.buyer.bankShebaNumber)}
                  </p>
                  <p
                    className={`mt-2 text-xs font-bold ${data.buyer.bankDetailsVerified ? "text-green-600" : "text-amber-600"}`}
                  >
                    {data.buyer.bankDetailsVerified
                      ? "✓ اطلاعات بانکی تایید شده"
                      : "درخواست برداشت توسط ادمین و اطلاعات حساب بررسی می‌شود"}
                  </p>
                </div>
                <input
                  value={withdrawalAmount}
                  onChange={(e) =>
                    setWithdrawalAmount(
                      e.target.value
                        .replace(/\D/g, "")
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    )
                  }
                  placeholder="مبلغ برداشت (تومان)"
                  className="mt-4 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"
                />
                <button
                  onClick={requestWithdrawal}
                  className="mt-3 w-full rounded-xl bg-[#0b9c56] py-3 font-bold text-white"
                >
                  ثبت درخواست برداشت
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold">تراکنش‌های واقعی کیف پول</h2>
                {data.transactions.length === 0 ? (
                  <Empty text="هنوز تراکنشی وجود ندارد." />
                ) : (
                  data.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between border-b py-3 text-sm"
                    >
                      <div>
                        <p className="font-bold">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {dateLabel(tx.createdAt)}
                        </p>
                      </div>
                      <b
                        className={
                          tx.amount >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {money(Math.abs(tx.amount))}
                      </b>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold">درخواست‌های برداشت</h2>
                {data.withdrawals.length === 0 ? (
                  <Empty text="هنوز درخواست برداشتی ثبت نشده است." />
                ) : (
                  data.withdrawals.map((item) => (
                    <div key={item.id} className="border-b py-3 text-sm">
                      <div className="flex justify-between">
                        <b>{money(item.amount)}</b>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-green-100 text-green-700" : item.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {item.status === "approved"
                            ? "تسویه شد"
                            : item.status === "rejected"
                              ? "رد شد"
                              : "در انتظار بررسی"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.id} · {dateLabel(item.createdAt)}
                      </p>
                      {item.adminNote && (
                        <p className="mt-1 text-xs text-gray-600">
                          یادداشت ادمین: {item.adminNote}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "survey" && (
          <section>
            <h1 className="mb-2 text-2xl font-bold text-[#003b5c]">
              نظرسنجی معاملات تکمیل‌شده
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              امتیاز شما مستقیماً در رتبه‌بندی فروشندگان برتر اثر دارد.
            </p>
            <div className="space-y-5">
              {pendingSurveys.length === 0 ? (
                <Empty text="نظرسنجی تکمیل‌نشده‌ای ندارید." />
              ) : (
                pendingSurveys.map((order) => (
                  <TradeSurvey
                    key={order.id}
                    role="buyer"
                    reviewerId={data.buyer.id}
                    order={order}
                    onSaved={loadDashboard}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "reviews" && (
          <section>
            <h1 className="mb-2 text-2xl font-bold text-[#003b5c]">
              دیدگاه‌ها
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              توضیحاتی که فروشندگان در فرم نظرسنجی درباره شما نوشته‌اند، اینجا
              نمایش داده می‌شود.
            </p>
            <div className="space-y-4">
              {receivedReviews.length === 0 ? (
                <Empty text="هنوز دیدگاهی برای شما ثبت نشده است." />
              ) : (
                receivedReviews.map((review) => {
                  const order = ordersById.get(review.orderId);
                  return (
                    <article
                      key={review.id}
                      className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#003b5c]">
                            {order?.sellerName || "فروشنده"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            سفارش {review.orderId}
                          </p>
                        </div>
                        <SellerStars score={review.overall * 20} size="sm" />
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                        {review.comment || "بدون توضیح"}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {activeTab === "invoices" && (
          <section>
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              فاکتورهای معامله
            </h1>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {invoiceOrders.length === 0 ? (
                <Empty text="پس از پرداخت سفارش، فاکتور در این بخش ایجاد می‌شود." />
              ) : (
                invoiceOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#003b5c]">
                        {order.id}
                      </p>
                      <p className="mt-1 font-bold">{order.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        فروشنده: {order.sellerName} · وضعیت: {order.status}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const html = generateInvoiceHTML({
                          ...order,
                          id: order.id,
                          date: dateLabel(order.paymentAt || order.createdAt),
                          totalAmount: order.totalAmount,
                          platformFee: order.platformFee,
                          sellerAmount: order.sellerAmount,
                          sellerName: order.sellerName,
                          buyerName: data.buyer.fullName,
                          product: order.title,
                          status: order.status,
                          quantity: order.quantity,
                          category: order.category,
                          shippingAddress: order.shippingAddress,
                          productSpecs: order.productSpecs,
                        });
                        window.open(
                          URL.createObjectURL(
                            new Blob([html], {
                              type: "text/html;charset=utf-8",
                            }),
                          ),
                          "_blank",
                        );
                      }}
                      className="rounded-xl bg-blue-50 px-4 py-2 font-bold text-[#00a8e8]"
                    >
                      چاپ فاکتور
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "archive" && (
          <section>
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              بایگانی سفارش‌ها
            </h1>
            <div className="space-y-4">
              {archiveOrders.length === 0 ? (
                <Empty text="هنوز سفارشی برای بایگانی ندارید." />
              ) : (
                archiveOrders.map((order) => (
                  <OrderCard key={order.id} order={order}>
                    <button
                      onClick={() => archiveOrder(order.id)}
                      className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600"
                    >
                      انتقال به بایگانی
                    </button>
                  </OrderCard>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "messages" && (
          <section className="grid min-h-[480px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-3">
            <div className="border-l bg-gray-50 p-4">
              <h2 className="mb-4 font-bold">گفتگو با فروشندگان</h2>
              {counterparts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  پس از دریافت پیشنهاد یا سفارش، گفتگوها اینجا نمایش داده
                  می‌شوند.
                </p>
              ) : (
                counterparts.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setActiveChatUserId(person.id)}
                    className={`mb-2 w-full rounded-xl p-3 text-right text-sm font-bold ${activeChatUserId === person.id ? "bg-blue-100 text-[#003b5c]" : "bg-white text-gray-600"}`}
                  >
                    {person.name}
                  </button>
                ))
              )}
            </div>
            <div className="flex flex-col p-5 md:col-span-2">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {activeMessages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    پیامی در این گفتگو وجود ندارد.
                  </p>
                ) : (
                  activeMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[75%] rounded-2xl p-3 text-sm ${message.senderId === data.buyer.id ? "mr-auto bg-[#003b5c] text-white" : "bg-gray-100 text-gray-800"}`}
                    >
                      {message.content}
                      <p className="mt-1 text-[10px] opacity-70">
                        {dateLabel(message.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 rounded-xl border p-3 outline-none focus:border-[#00a8e8]"
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-[#00a8e8] px-5 font-bold text-white"
                >
                  ارسال
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "notifications" && (
          <section>
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              اعلان‌های واقعی
            </h1>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {data.notifications.length === 0 ? (
                <Empty text="هنوز اعلانی ندارید." />
              ) : (
                data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-5 ${notification.readAt ? "bg-gray-50" : "bg-white"}`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#003b5c]">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.body}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {dateLabel(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              پروفایل خریدار
            </h1>
            <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-[#003b5c] text-white shadow-sm">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="تصویر پروفایل خریدار"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl font-bold">
                    {profile.fullName.charAt(0) || "👤"}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h2 className="font-bold text-gray-900">
                  عکس پروفایل / لوگوی خریدار
                </h2>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  فرمت مجاز JPG، PNG یا WEBP با حداکثر حجم ۳ مگابایت. پس از
                  انتخاب، روی ذخیره پروفایل کلیک کنید.
                </p>
                <label className="mt-3 inline-flex cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8] hover:bg-blue-100">
                  انتخاب یا تغییر عکس
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handleAvatarChange(event.target.files?.[0])
                    }
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="نام یا نام شرکت"
                value={profile.fullName}
                onChange={(value) =>
                  setProfile({ ...profile, fullName: value })
                }
              />
              <Field
                label="آدرس پیش‌فرض ارسال"
                value={profile.defaultAddress}
                onChange={(value) =>
                  setProfile({ ...profile, defaultAddress: value })
                }
              />
            </div>
            <label className="mt-4 block text-sm font-bold text-gray-700">
              درباره خریدار
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="mt-2 min-h-28 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"
            />
            <button
              onClick={saveProfile}
              className="mt-5 rounded-xl bg-[#003b5c] px-7 py-3 font-bold text-white"
            >
              ذخیره پروفایل
            </button>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-2xl font-bold text-[#003b5c]">
              تنظیمات خریدار
            </h1>

            <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-[#003b5c] text-white shadow-sm">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="عکس یا لوگوی خریدار"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl font-bold">
                    {profile.fullName.charAt(0) || "👤"}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h2 className="font-bold text-gray-900">عکس / لوگوی خریدار</h2>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  از این بخش می‌توانید عکس پروفایل یا لوگوی حساب خریدار را
                  بارگذاری یا ویرایش کنید. فرمت مجاز JPG، PNG یا WEBP با حداکثر
                  حجم ۳ مگابایت است.
                </p>
                <label className="mt-3 inline-flex cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8] hover:bg-blue-100">
                  انتخاب یا تغییر عکس / لوگو
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handleAvatarChange(event.target.files?.[0])
                    }
                  />
                </label>
              </div>
            </div>

            <h2 className="border-b pb-3 text-sm font-bold">
              حوزه‌های خرید مورد علاقه
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {categoryOptions.map((category) => (
                <label
                  key={category}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold ${profile.categories.includes(category) ? "border-[#00a8e8] bg-blue-50" : "bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={profile.categories.includes(category)}
                    onChange={() =>
                      setProfile({
                        ...profile,
                        categories: profile.categories.includes(category)
                          ? profile.categories.filter((x) => x !== category)
                          : [...profile.categories, category],
                      })
                    }
                  />
                  {category}
                </label>
              ))}
            </div>
            <div className="mt-8 border-t pt-5">
              <h2 className="mb-3 text-sm font-bold">تنظیمات اعلان و پرداخت</h2>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked /> اعلان پیشنهاد جدید از
                فروشنده
              </label>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked /> اعلان ارسال کالا و کد
                رهگیری
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked /> انتقال مستقیم به پرداخت
                پس از انتخاب پیشنهاد
              </label>
            </div>
            <button
              onClick={saveProfile}
              className="mt-6 rounded-xl bg-[#003b5c] px-7 py-3 font-bold text-white"
            >
              ذخیره تنظیمات
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-bold text-gray-700">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]"
      />
    </label>
  );
}
function OfferCard({ offer, onSelect }: { offer: any; onSelect: () => void }) {
  const images = offer.productImages?.length
    ? offer.productImages
    : offer.request?.productImages || [];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <ProductThumb
              images={images}
              title={offer.request?.title || "کالای پیشنهادی"}
              className="h-16 w-16"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#003b5c]">
                {offer.sellerName}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                برای درخواست: {offer.request?.title || "—"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {offer.message || "توضیحی ثبت نشده است."}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            زمان تحویل: {offer.deliveryDays} روز
          </p>
          {offer.productSpecs && (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
              مشخصات: {offer.productSpecs.brand} {offer.productSpecs.exactModel}{" "}
              · {offer.productSpecs.cpu} · {offer.productSpecs.ram} ·{" "}
              {offer.productSpecs.storage}
            </p>
          )}
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-[#0b9c56]">
            {money(offer.amount)}
          </p>
          <button
            onClick={onSelect}
            disabled={offer.status !== "pending" || !offer.productSpecs}
            className="mt-4 rounded-xl bg-[#003b5c] px-5 py-2.5 text-sm font-bold text-white disabled:bg-gray-300"
          >
            {!offer.productSpecs
              ? "نیازمند تکمیل مشخصات فروشنده"
              : offer.status === "pending"
                ? "انتخاب پیشنهاد"
                : offer.status === "accepted"
                  ? "انتخاب شده"
                  : "رد شده"}
          </button>
        </div>
      </div>
    </div>
  );
}
function OrderCard({ order, children }: { order: any; children: ReactNode }) {
  const images = order.productImages?.length
    ? order.productImages
    : order.requestImages || [];
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <div className="mb-2 flex gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {order.status}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs">
              {order.id}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <ProductThumb
              images={images}
              title={order.title}
              className="h-16 w-16"
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#003b5c]">
                {order.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                فروشنده: {order.sellerName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                آدرس تحویل: {order.shippingAddress}
              </p>
            </div>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xl font-bold text-[#0b9c56]">
            {money(order.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            کمیسیون: {money(order.platformFee)}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function OfferSpecsSummary({ specs }: { specs?: any }) {
  if (!specs) {
    return (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
        این پیشنهاد هنوز مشخصات کامل کالا ندارد و نباید برای پرداخت انتخاب شود.
      </div>
    );
  }
  const rows = [
    ["برند", specs.brand],
    ["مدل دقیق", specs.exactModel],
    ["کد مدل/کانفیگ", specs.serialOrConfig],
    ["CPU", specs.cpu],
    ["RAM", specs.ram],
    ["حافظه", specs.storage],
    ["GPU", specs.gpu],
    ["نمایشگر", specs.display],
    ["سال ساخت", specs.manufactureYear],
    ["وضعیت کالا", specs.productCondition],
    ["گارانتی", specs.warrantyStatus],
    ["سلامت کلی", specs.partsHealth],
    ["CPU", specs.cpuHealth],
    ["مادربرد", specs.motherboardHealth],
    ["نمایشگر", specs.displayHealth],
    ["SSD/HDD", specs.storageHealth],
    ["RAM", specs.ramHealth],
    ["GPU", specs.gpuHealth],
    ["کیبورد/تاچ‌پد", specs.keyboardTouchpadHealth],
    ["بدنه/لولا", specs.bodyHingeHealth],
    [
      "باتری",
      specs.batteryHealthPercent ? `${specs.batteryHealthPercent}%` : "—",
    ],
    ["گرید ظاهری", specs.appearanceGrade],
    ["سابقه تعمیر", specs.repairHistory],
    ["کارکرد", specs.usageLevel],
    ["لوازم", specs.accessoriesStatus],
    ["شارژر", specs.chargerStatus],
    [
      "مهلت تست",
      specs.testDeadlineDays ? `${specs.testDeadlineDays} روز` : "—",
    ],
  ];
  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 font-bold text-[#003b5c]">
        مشخصات کالای اعلام‌شده توسط فروشنده
      </h3>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={`${label}-${value}`}
            className="flex justify-between gap-2 rounded-xl bg-white px-3 py-2"
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
        <p className="mt-2 rounded-xl bg-white p-3 text-xs leading-6 text-gray-600">
          <b>توضیحات:</b> {specs.notes}
        </p>
      )}
    </div>
  );
}
