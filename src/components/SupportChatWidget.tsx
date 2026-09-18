"use client";

import { useEffect, useState } from "react";

type ChatLine = {
  role: "support" | "user";
  text: string;
};

type SupportContent = {
  chatWelcome: string;
  phone: string;
  email: string;
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [support, setSupport] = useState<SupportContent>({
    chatWelcome:
      "سلام، به پشتیبانی آنلاین OptiBid خوش آمدید. پیام خود را بنویسید تا همکاران ما پاسخ دهند.",
    phone: "",
    email: "",
  });
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    content: "",
  });

  useEffect(() => {
    fetch("/api/support-chat", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.success && result.support) {
          setSupport(result.support);
          setLines([{ role: "support", text: result.support.chatWelcome }]);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm((current) => ({
      ...current,
      name: current.name || localStorage.getItem("userDisplayName") || "",
    }));
  }, [open]);

  const sendMessage = async () => {
    if (!form.content.trim() || sending) return;
    const content = form.content.trim();
    setLines((current) => [...current, { role: "user", text: content }]);
    setForm((current) => ({ ...current, content: "" }));
    setSending(true);
    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, content }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ارسال پیام ناموفق بود.");
      setLines((current) => [
        ...current,
        {
          role: "support",
          text: `${result.reply} کد پیگیری: ${result.message?.id || "—"}`,
        },
      ]);
    } catch (error) {
      setLines((current) => [
        ...current,
        {
          role: "support",
          text:
            error instanceof Error
              ? error.message
              : "ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-[80]">
      {open && (
        <section className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-2xl">
          <div className="bg-gradient-to-l from-[#003b5c] to-[#00a8e8] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-blue-100">پشتیبانی آنلاین</p>
                <h2 className="mt-1 font-black">گفتگو با پشتیبانی OptiBid</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/15 px-3 py-1 text-lg font-black"
                aria-label="بستن چت پشتیبانی"
              >
                ×
              </button>
            </div>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto bg-slate-50 p-4">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-6 ${line.role === "user" ? "mr-auto bg-[#003b5c] text-white" : "bg-white text-slate-700 shadow-sm"}`}
              >
                {line.text}
              </div>
            ))}
          </div>

          <div className="space-y-2 p-4">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="نام"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="موبایل"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
            </div>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ایمیل اختیاری"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="پیام خود را بنویسید..."
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !form.content.trim()}
              className="w-full rounded-xl bg-[#003b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#002d46] disabled:bg-slate-300"
            >
              {sending ? "در حال ارسال..." : "ارسال پیام"}
            </button>
            <p className="text-[11px] leading-5 text-slate-500">
              تلفن: {support.phone || "—"} · ایمیل: {support.email || "—"}
            </p>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full bg-[#003b5c] px-5 py-3 text-sm font-black text-white shadow-2xl ring-4 ring-blue-100 transition hover:-translate-y-0.5 hover:bg-[#002d46]"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
        </span>
        پشتیبانی آنلاین
      </button>
    </div>
  );
}
