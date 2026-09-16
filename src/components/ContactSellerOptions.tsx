"use client";

import { useEffect, useMemo, useState } from "react";

type ContactSellerOptionsProps = {
  sellerId: number;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  requestId?: number;
  requestTitle?: string;
  requestBuyerId?: number;
  compact?: boolean;
  className?: string;
};

const generatedPhoneEmailDomain = "@phone.optibid.local";

function cleanPhone(value?: string) {
  return String(value || "").trim();
}

function cleanEmail(value?: string) {
  const email = String(value || "").trim();
  if (!email || email.includes(generatedPhoneEmailDomain)) return "";
  return email;
}

function currentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export default function ContactSellerOptions({
  sellerId,
  sellerName,
  sellerPhone,
  sellerEmail,
  requestId,
  requestTitle,
  requestBuyerId,
  compact = false,
  className = "",
}: ContactSellerOptionsProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [directOpen, setDirectOpen] = useState(false);
  const [sendingRelay, setSendingRelay] = useState(false);
  const [notice, setNotice] = useState("");

  const phone = useMemo(() => cleanPhone(sellerPhone), [sellerPhone]);
  const email = useMemo(() => cleanEmail(sellerEmail), [sellerEmail]);
  const hasDirectContact = Boolean(phone || email);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  const requireSignedIn = () => {
    if (userId) return true;
    sessionStorage.setItem("redirectAfterAuth", currentPath());
    window.location.href = "/login";
    return false;
  };

  const requireAllowedBuyer = () => {
    if (!requestBuyerId || userId === requestBuyerId) return true;
    alert(
      "برای حفظ حریم خصوصی فروشنده، اطلاعات تماس و شروع ارتباط فقط برای خریدار صاحب همین درخواست فعال است.",
    );
    return false;
  };

  const ensureCanContact = () => {
    if (!requireSignedIn()) return false;
    if (!requireAllowedBuyer()) return false;
    if (role === "admin") {
      alert("ادمین برای ارتباط با فروشنده باید با حساب خریدار/فروشنده وارد شود.");
      return false;
    }
    return true;
  };

  const openDirectContact = () => {
    if (!ensureCanContact()) return;
    setNotice("");
    setDirectOpen((current) => !current);
  };

  const sendRelayRequest = async () => {
    if (!ensureCanContact() || sendingRelay) return;
    setSendingRelay(true);
    setNotice("");
    try {
      const context = requestTitle
        ? `برای درخواست «${requestTitle}»${requestId ? ` (کد ${requestId})` : ""}`
        : `برای پروفایل فروشنده «${sellerName}»`;
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: sellerId,
          content: `درخواست تماس امن از طریق OptiBid ${context}. لطفاً بدون نمایش شماره تلفن، زمان و روش هماهنگی را در چت OptiBid اعلام کنید.`,
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ارسال درخواست تماس ناموفق بود.");
      setNotice(
        "درخواست تماس امن برای فروشنده ارسال شد؛ پاسخ فروشنده در پیام‌های OptiBid نمایش داده می‌شود.",
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "ارسال درخواست تماس از طریق OptiBid ناموفق بود.",
      );
    } finally {
      setSendingRelay(false);
    }
  };

  const openOptibidChat = () => {
    if (!ensureCanContact()) return;
    sessionStorage.setItem("optibidChatTargetId", String(sellerId));
    sessionStorage.setItem("optibidChatTargetName", sellerName);
    const params = new URLSearchParams({
      tab: "messages",
      chatWith: String(sellerId),
      chatName: sellerName,
    });
    window.location.href = `/buyer/dashboard?${params.toString()}`;
  };

  return (
    <div
      className={`${compact ? "mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4" : "rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"} ${className}`}
      dir="rtl"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#003b5c]">
            راه‌های ارتباط با فروشنده
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            OptiBid فقط بستر معرفی و مقایسه است؛ خریدار می‌تواند مستقیم، امن یا
            از طریق چت داخلی هماهنگ کند.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          هر ۳ گزینه فعال
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={openDirectContact}
          className="rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-right text-xs font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50"
        >
          <span className="block text-lg">📞</span>
          اطلاعات تماس فروشنده
          <span className="mt-1 block font-normal text-emerald-700/80">
            {hasDirectContact ? "شماره/ایمیل مستقیم" : "در انتظار تکمیل پروفایل"}
          </span>
        </button>
        <button
          type="button"
          onClick={sendRelayRequest}
          disabled={sendingRelay}
          className="rounded-2xl border border-blue-200 bg-white px-3 py-3 text-right text-xs font-bold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
        >
          <span className="block text-lg">☎️</span>
          تماس از طریق OptiBid
          <span className="mt-1 block font-normal text-blue-700/80">
            {sendingRelay ? "در حال ارسال درخواست..." : "بدون نمایش شماره"}
          </span>
        </button>
        <button
          type="button"
          onClick={openOptibidChat}
          className="rounded-2xl border border-violet-200 bg-white px-3 py-3 text-right text-xs font-bold text-violet-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50"
        >
          <span className="block text-lg">💬</span>
          چت از طریق OptiBid
          <span className="mt-1 block font-normal text-violet-700/80">
            گفتگو داخل داشبورد
          </span>
        </button>
      </div>

      {directOpen && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-7 text-slate-700">
          {hasDirectContact ? (
            <div className="space-y-2">
              <p className="font-bold text-emerald-800">
                اطلاعات تماس مستقیم {sellerName}
              </p>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-bold text-emerald-800"
                  dir="ltr"
                >
                  <span>{phone}</span>
                  <span dir="rtl">تماس تلفنی</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 font-bold text-slate-700"
                  dir="ltr"
                >
                  <span>{email}</span>
                  <span dir="rtl">ارسال ایمیل</span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-amber-700">
              فروشنده هنوز شماره یا ایمیل مستقیم را در پروفایل ثبت نکرده است؛ از
              «تماس از طریق OptiBid» یا «چت از طریق OptiBid» استفاده کنید.
            </p>
          )}
          <p className="mt-3 text-xs leading-6 text-slate-500">
            برای فروشنده‌هایی که نمی‌خواهند شماره‌شان عمومی شود، دو مسیر امن
            OptiBid فعال است و شماره طرفین نمایش داده نمی‌شود.
          </p>
        </div>
      )}

      {notice && (
        <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold leading-6 text-emerald-800">
          {notice}
        </p>
      )}
    </div>
  );
}
