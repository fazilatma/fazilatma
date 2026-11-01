"use client";

import { useEffect, useMemo, useState } from "react";

type ContactBuyerOptionsProps = {
  buyerId: number;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  requestId: number;
  requestTitle: string;
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

export default function ContactBuyerOptions({
  buyerId,
  buyerName,
  buyerPhone,
  buyerEmail,
  requestId,
  requestTitle,
  compact = false,
  className = "",
}: ContactBuyerOptionsProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [directOpen, setDirectOpen] = useState(false);
  const [sendingRelay, setSendingRelay] = useState(false);
  const [notice, setNotice] = useState("");

  const phone = useMemo(() => cleanPhone(buyerPhone), [buyerPhone]);
  const email = useMemo(() => cleanEmail(buyerEmail), [buyerEmail]);
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

  const requireSeller = () => {
    if (role === "admin") {
      alert("ادمین برای ارتباط با خریدار باید با حساب خریدار/فروشنده وارد شود.");
      return false;
    }
    if (userId === buyerId) {
      alert("این درخواست خرید متعلق به خود شماست.");
      return false;
    }
    if (role !== "seller") {
      alert("برای ارتباط با خریدار، ابتدا وارد حالت فروشنده شوید یا پیشنهاد فروشنده ثبت کنید.");
      return false;
    }
    return true;
  };

  const ensureCanContact = () => requireSignedIn() && requireSeller();

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
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: buyerId,
          content: `درخواست ارتباط فروشنده از طریق OptiBid برای درخواست «${requestTitle}» (کد ${requestId}). لطفاً زمان و روش هماهنگی را در چت OptiBid اعلام کنید.`,
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ارسال درخواست ارتباط ناموفق بود.");
      setNotice("درخواست ارتباط برای خریدار ارسال شد؛ پاسخ در پیام‌های OptiBid نمایش داده می‌شود.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "ارسال درخواست ارتباط با خریدار ناموفق بود.",
      );
    } finally {
      setSendingRelay(false);
    }
  };

  const openOptibidChat = () => {
    if (!ensureCanContact()) return;
    sessionStorage.setItem("optibidChatTargetId", String(buyerId));
    sessionStorage.setItem("optibidChatTargetName", buyerName);
    const params = new URLSearchParams({
      tab: "messages",
      chatWith: String(buyerId),
      chatName: buyerName,
    });
    window.location.href = `/seller/dashboard?${params.toString()}`;
  };

  return (
    <div
      className={`${
        compact
          ? "rounded-3xl border border-amber-100 bg-gradient-to-l from-amber-50/90 to-white p-4 shadow-sm"
          : "rounded-3xl border border-amber-100 bg-white p-6 shadow-sm"
      } ${className}`}
      dir="rtl"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-900">
            راه‌های ارتباط با خریدار
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            فروشنده می‌تواند برای هماهنگی پیشنهاد، جزئیات کالا و زمان ارسال با خریدار ارتباط بگیرد.
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
          مخصوص فروشنده‌ها
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={openDirectContact}
          className="flex min-h-24 items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-right text-xs font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-lg">📞</span>
          <span className="min-w-0">
            <span className="block">اطلاعات تماس خریدار</span>
            <span className="mt-1 block font-normal leading-5 text-emerald-700/80">
              {hasDirectContact ? "شماره/ایمیل مستقیم" : "در انتظار تکمیل پروفایل"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={sendRelayRequest}
          disabled={sendingRelay}
          className="flex min-h-24 items-center gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-right text-xs font-bold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg">☎️</span>
          <span className="min-w-0">
            <span className="block">تماس از طریق OptiBid</span>
            <span className="mt-1 block font-normal leading-5 text-blue-700/80">
              {sendingRelay ? "در حال ارسال درخواست..." : "بدون نمایش شماره"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={openOptibidChat}
          className="flex min-h-24 items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-right text-xs font-bold text-violet-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-lg">💬</span>
          <span className="min-w-0">
            <span className="block">چت از طریق OptiBid</span>
            <span className="mt-1 block font-normal leading-5 text-violet-700/80">
              گفتگو داخل داشبورد فروشنده
            </span>
          </span>
        </button>
      </div>

      {directOpen && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-7 text-slate-700">
          {hasDirectContact ? (
            <div className="space-y-2">
              <p className="font-bold text-emerald-800">
                اطلاعات تماس مستقیم {buyerName}
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
              خریدار هنوز شماره یا ایمیل مستقیم را در پروفایل ثبت نکرده است؛ از «تماس از طریق OptiBid» یا «چت از طریق OptiBid» استفاده کنید.
            </p>
          )}
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
