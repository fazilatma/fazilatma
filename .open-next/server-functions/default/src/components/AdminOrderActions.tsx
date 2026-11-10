"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "market" | "store";

type Action = {
  id: string;
  label: string;
  tone: "primary" | "neutral" | "danger" | "success";
  needsTracking?: boolean;
  confirmText?: string;
};

const MARKET_ACTIONS: Record<string, Action[]> = {
  pending_payment: [
    { id: "mark_paid", label: "ثبت پرداخت", tone: "primary" },
    { id: "cancel", label: "لغو سفارش", tone: "danger", confirmText: "این سفارش لغو شود؟" },
  ],
  paid: [
    { id: "ship", label: "ثبت ارسال", tone: "primary", needsTracking: true },
    { id: "complete", label: "تأیید تحویل", tone: "success", confirmText: "تحویل تأیید و وجه امانی آزاد شود؟" },
    { id: "cancel", label: "لغو و بازپرداخت", tone: "danger", confirmText: "سفارش لغو و مبلغ به کیف پول خریدار بازگردد؟" },
  ],
  shipped: [
    { id: "complete", label: "تأیید تحویل", tone: "success", confirmText: "تحویل تأیید و وجه امانی آزاد شود؟" },
  ],
};

const STORE_ACTIONS: Record<string, Action[]> = {
  pending_payment: [
    { id: "confirm_payment", label: "تأیید پرداخت", tone: "primary" },
    { id: "cancel", label: "لغو سفارش", tone: "danger", confirmText: "این سفارش فروشگاهی لغو شود؟" },
  ],
  paid: [
    { id: "processing", label: "در حال آماده‌سازی", tone: "neutral" },
    { id: "ship", label: "ثبت ارسال", tone: "primary", needsTracking: true },
    { id: "complete", label: "تحویل شد", tone: "success" },
    { id: "cancel", label: "لغو و بازپرداخت", tone: "danger", confirmText: "سفارش لغو و مبلغ به کیف پول خریدار بازگردد؟" },
  ],
  processing: [
    { id: "ship", label: "ثبت ارسال", tone: "primary", needsTracking: true },
    { id: "complete", label: "تحویل شد", tone: "success" },
    { id: "cancel", label: "لغو و بازپرداخت", tone: "danger", confirmText: "سفارش لغو و مبلغ به کیف پول خریدار بازگردد؟" },
  ],
  shipped: [{ id: "complete", label: "تحویل شد", tone: "success" }],
};

const TONE_CLASS: Record<Action["tone"], string> = {
  primary: "border-purple-200 bg-purple-600 text-white hover:bg-purple-700",
  neutral: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  success: "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export default function AdminOrderActions({
  kind,
  orderId,
  status,
  trackingCode,
  adminNote,
}: {
  kind: Kind;
  orderId: string;
  status: string;
  trackingCode?: string;
  adminNote?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [tracking, setTracking] = useState(trackingCode || "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(adminNote || "");
  const [error, setError] = useState("");
  const [okMessage, setOkMessage] = useState("");

  const actions = (kind === "store" ? STORE_ACTIONS[status] : MARKET_ACTIONS[status]) || [];

  const submit = async (action: string, payload: { trackingCode?: string; note?: string } = {}) => {
    setBusy(action);
    setError("");
    setOkMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, orderId, action, ...payload }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.message || "عملیات ناموفق بود.");
        return;
      }
      setOkMessage(result.message || "انجام شد.");
      setTrackingOpen(false);
      setNoteOpen(false);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-w-[168px] space-y-1.5">
      {actions.map((action) => {
        if (action.needsTracking && trackingOpen) return null;
        return (
          <button
            key={action.id}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => {
              if (action.needsTracking) {
                setTrackingOpen(true);
                setError("");
                return;
              }
              if (action.confirmText && !window.confirm(action.confirmText)) return;
              void submit(action.id);
            }}
            className={`w-full rounded-lg border px-2 py-1 text-[11px] font-bold transition disabled:opacity-50 ${TONE_CLASS[action.tone]}`}
          >
            {busy === action.id ? "در حال انجام…" : action.label}
          </button>
        );
      })}

      {trackingOpen && (
        <div className="space-y-1 rounded-lg border border-purple-200 bg-purple-50 p-2">
          <input
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            placeholder="کد رهگیری پستی"
            dir="ltr"
            className="w-full rounded-md border border-purple-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-purple-500"
          />
          <div className="flex gap-1">
            <button
              type="button"
              disabled={Boolean(busy) || !tracking.trim()}
              onClick={() => void submit("ship", { trackingCode: tracking })}
              className="flex-1 rounded-md bg-purple-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {busy === "ship" ? "…" : "ثبت ارسال"}
            </button>
            <button
              type="button"
              onClick={() => setTrackingOpen(false)}
              className="rounded-md border border-purple-200 bg-white px-2 py-1 text-[11px] font-bold text-purple-700"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {noteOpen ? (
        <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="یادداشت داخلی (فقط ادمین می‌بیند)"
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-purple-500"
          />
          <div className="flex gap-1">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void submit("note", { note })}
              className="flex-1 rounded-md bg-gray-900 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {busy === "note" ? "…" : "ذخیره"}
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-700"
            >
              بستن
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
        >
          📝 یادداشت
        </button>
      )}

      {adminNote && !noteOpen && (
        <p className="rounded-md bg-gray-50 px-2 py-1 text-[10px] leading-4 text-gray-500">
          یادداشت: {adminNote}
        </p>
      )}
      {error && <p className="text-[10px] font-bold text-rose-600">{error}</p>}
      {okMessage && <p className="text-[10px] font-bold text-emerald-600">{okMessage}</p>}
    </div>
  );
}
