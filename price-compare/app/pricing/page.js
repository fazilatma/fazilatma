"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PLANS = {
  free: {
    id: "free",
    name: "رایگان",
    priceText: "رایگان",
    badge: "🆓",
    features: ["۳ منبع", "۵ پیشنهاد", "۵ جستجو/روز", "تفکیک نو/استوک", "لینک مستقیم /p/"],
    not: ["بدون ROI فروش", "بدون تصویر/صدا/بارکد", "بدون سیگنال تقاضا", "بدون هشدار"],
  },
  pro: {
    id: "pro",
    name: "حرفه‌ای دراپشیپینگ",
    priceText: "۲۹۹,۰۰۰ تومان / ماه",
    badge: "🚀",
    popular: true,
    features: ["۶ منبع کامل", "۲۵+ پیشنهاد نامحدود", "جستجو نامحدود", "بهترین خرید نو/استوک جدا", "بهترین فروش + ROI + سود خالص", "تصویر/صدا/بارکد", "سیگنال تقاضا + AI", "هشدار بازار", "CSV خروجی", "پشتیبانی تلگرام"],
  }
};

export default function PricingPage() {
  const [plan, setPlan] = useState("free");
  useEffect(() => {
    try { const p = localStorage.getItem("qy_plan"); if(p) setPlan(p); } catch {}
  }, []);
  function upgrade() {
    try { localStorage.setItem("qy_plan", "pro"); } catch {}
    setPlan("pro");
    alert("🎉 ارتقا به حرفه‌ای انجام شد! حالا به صفحه اصلی برگردید.");
  }
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", direction: "rtl", fontFamily: "Tahoma" }}>
      <Link href="/" style={{ color: "#6c8cff", textDecoration: "none" }}>← بازگشت به خانه</Link>
      <h1 style={{ textAlign: "center", marginTop: 20 }}>💎 تعرفه‌ها — دو فاز برای دراپشیپینگ</h1>
      <p style={{ textAlign: "center", color: "#93a0c4" }}>فاز رایگان برای تست، فاز حرفه‌ای برای سود واقعی</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <div style={{ background: "#151d38", border: "1px solid #263156", borderRadius: 16, padding: 20, opacity: plan==="free" ? 1 : 0.8 }}>
          <div style={{ fontSize: 28 }}>🆓</div>
          <h2>رایگان</h2>
          <div style={{ fontWeight: 900, fontSize: 22 }}>رایگان</div>
          <div style={{ color: "#93a0c4", fontSize: 13 }}>۵ جستجو در روز — ۳ منبع</div>
          <ul style={{ lineHeight: 2.2, fontSize: 13, marginTop: 12 }}>
            {PLANS.free.features.map((f,i)=><li key={i}>✓ {f}</li>)}
            {PLANS.free.not.map((f,i)=><li key={i} style={{ color: "#93a0c4", textDecoration: "line-through" }}>✗ {f}</li>)}
          </ul>
          <button disabled={plan==="free"} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #263156", background: "#1a2444", color: "#93a0c4", marginTop: 12 }}>
            {plan==="free" ? "✓ فعال" : "فاز رایگان"}
          </button>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,.15), rgba(108,140,255,.1))", border: "2px solid #8b5cf6", borderRadius: 16, padding: 20, position: "relative", boxShadow: "0 0 40px rgba(139,92,246,.2)" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#8b5cf6,#6c8cff)", color: "#fff", padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>⭐ محبوب دراپ‌شیپرها</div>
          <div style={{ fontSize: 28 }}>🚀</div>
          <h2>حرفه‌ای — دراپشیپینگ</h2>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#a78bfa" }}>۲۹۹,۰۰۰ تومان / ماه</div>
          <div style={{ color: "#93a0c4", fontSize: 13 }}>نامحدود — ۶ منبع — ROI واقعی</div>
          <ul style={{ lineHeight: 2.2, fontSize: 13, marginTop: 12 }}>
            {PLANS.pro.features.map((f,i)=><li key={i}>✓ {f}</li>)}
          </ul>
          <button onClick={upgrade} disabled={plan==="pro"} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6c8cff)", color: "#fff", fontWeight: 800, marginTop: 12, cursor: "pointer" }}>
            {plan==="pro" ? "✓ فعال — حرفه‌ای" : "🚀 ارتقا به حرفه‌ای"}
          </button>
          <div style={{ fontSize: 11, color: "#93a0c4", textAlign: "center", marginTop: 8 }}>زرین‌پال — فعال‌سازی آنی — ۷ روز ضمانت</div>
        </div>
      </div>

      <div style={{ marginTop: 32, background: "#151d38", border: "1px solid #263156", borderRadius: 12, padding: 16 }}>
        <h3>📊 مقایسه دقیق</h3>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid #263156", color: "#93a0c4" }}><th style={{ textAlign: "right", padding: 8 }}>قابلیت</th><th style={{ textAlign: "center" }}>رایگان</th><th style={{ textAlign: "center" }}>حرفه‌ای</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: 8 }}>تعداد منبع</td><td style={{ textAlign: "center" }}>۳</td><td style={{ textAlign: "center" }}>۶</td></tr>
            <tr><td style={{ padding: 8 }}>پیشنهادها</td><td style={{ textAlign: "center" }}>۵</td><td style={{ textAlign: "center" }}>۲۵+</td></tr>
            <tr><td style={{ padding: 8 }}>جستجو روزانه</td><td style={{ textAlign: "center" }}>۵</td><td style={{ textAlign: "center" }}>∞</td></tr>
            <tr><td style={{ padding: 8 }}>بهترین فروش + ROI</td><td style={{ textAlign: "center" }}>✗</td><td style={{ textAlign: "center" }}>✓</td></tr>
            <tr><td style={{ padding: 8 }}>تصویر/صدا/بارکد</td><td style={{ textAlign: "center" }}>✗</td><td style={{ textAlign: "center" }}>✓</td></tr>
            <tr><td style={{ padding: 8 }}>سیگنال تقاضا</td><td style={{ textAlign: "center" }}>✗</td><td style={{ textAlign: "center" }}>✓</td></tr>
            <tr><td style={{ padding: 8 }}>هشدار بازار</td><td style={{ textAlign: "center" }}>✗</td><td style={{ textAlign: "center" }}>✓</td></tr>
            <tr><td style={{ padding: 8 }}>لینک مستقیم /p/</td><td style={{ textAlign: "center" }}>✓</td><td style={{ textAlign: "center" }}>✓</td></tr>
            <tr><td style={{ padding: 8 }}>تفکیک نو/استوک</td><td style={{ textAlign: "center" }}>✓</td><td style={{ textAlign: "center" }}>✓</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Link href="/" style={{ display: "inline-block", background: "linear-gradient(135deg,#6c8cff,#8b5cf6)", color: "#fff", padding: "12px 24px", borderRadius: 999, textDecoration: "none", fontWeight: 800 }}>شروع کنید — بازگشت به جستجو</Link>
      </div>
    </div>
  );
}
