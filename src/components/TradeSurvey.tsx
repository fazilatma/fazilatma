"use client";

import { useState } from "react";

type TradeSurveyProps = {
  role: "buyer" | "seller";
  reviewerId: number;
  order: { id: string; title: string; buyerName: string; sellerName: string };
  onSaved: () => void | Promise<void>;
};

const criteria = {
  buyer: [
    ["quality", "کیفیت و سلامت کالا"],
    ["match", "تطابق کالا با پیشنهاد"],
    ["shipping", "سرعت و تعهد در ارسال"],
    ["packaging", "بسته‌بندی و تحویل"],
    ["communication", "پاسخ‌گویی و رفتار فروشنده"],
  ],
  seller: [
    ["clarity", "شفافیت و دقت درخواست"],
    ["cooperation", "همکاری در فرایند معامله"],
    ["communication", "ارتباط و پاسخ‌گویی خریدار"],
    ["receipt", "سرعت بررسی و تایید دریافت"],
    ["conduct", "رفتار حرفه‌ای در معامله"],
  ],
} as const;

function Stars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition hover:scale-110 ${star <= value ? "text-amber-400" : "text-gray-200"}`}
          aria-label={`${star} ستاره`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function TradeSurvey({ role, reviewerId, order, onSaved }: TradeSurveyProps) {
  const rows = criteria[role];
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(rows.map(([key]) => [key, 5]))
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const overall = Math.round(
    Object.values(scores).reduce((sum, value) => sum + value, 0) /
      Math.max(1, Object.values(scores).length)
  );
  const targetName = role === "buyer" ? order.sellerName : order.buyerName;

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reviewerId, overall, scores, comment }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      alert(result.message);
      await onSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : "ثبت نظرسنجی ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold text-[#00a8e8]">سفارش {order.id}</p>
          <h3 className="mt-1 text-lg font-bold text-[#003b5c]">ارزیابی {targetName}</h3>
          <p className="mt-1 text-sm text-gray-500">{order.title}</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-2 text-center">
          <p className="text-2xl text-amber-400">{"★".repeat(overall)}{"☆".repeat(5 - overall)}</p>
          <p className="text-xs font-bold text-amber-800">امتیاز نهایی {overall} از ۵</p>
        </div>
      </div>

      <div className="space-y-3 border-y border-gray-100 py-5">
        {rows.map(([key, label]) => (
          <div key={key} className="flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <Stars value={scores[key]} onChange={(value) => setScores({ ...scores, [key]: value })} />
          </div>
        ))}
      </div>

      <label className="mt-5 block text-sm font-bold text-gray-700">توضیحات شما (اختیاری)</label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="تجربه واقعی خود از این معامله را بنویسید..."
        className="mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#00a8e8]"
      />
      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-4 rounded-xl bg-[#003b5c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d46] disabled:bg-gray-400"
      >
        {submitting ? "در حال ثبت..." : "ثبت نهایی امتیاز و نظر"}
      </button>
    </article>
  );
}
