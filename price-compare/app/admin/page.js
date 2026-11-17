"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("settings"); // settings | orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      setIsLoggedIn(true);
      loadSettings();
      loadOrders();
    }
  }, []);

  async function loadSettings() {
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "getSettings" })
      });
      const j = await r.json();
      if (j.ok) setSettings(j.settings);
    } catch {}
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const r = await fetch("/api/orders?all=1");
      const j = await r.json();
      if (j.ok) setOrders(j.orders);
    } catch {}
    setOrdersLoading(false);
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", orderId, status: newStatus, desc: `وضعیت به ${newStatus} تغییر کرد توسط ادمین` })
      });
      const j = await r.json();
      if (j.ok) {
        loadOrders();
        setMsg(`✅ سفارش ${orderId} به ${newStatus} تغییر کرد`);
      }
    } catch (e) {
      setMsg("❌ " + e.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "login", user, pass })
      });
      const j = await r.json();
      if (j.ok) {
        localStorage.setItem("admin_token", j.token);
        setIsLoggedIn(true);
        loadSettings();
        setMsg("✅ ورود موفق");
      } else {
        setMsg("❌ " + j.error);
      }
    } catch (e) {
      setMsg("❌ خطا: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "updateSettings", settings })
      });
      const j = await r.json();
      if (j.ok) {
        setSettings(j.settings);
        setMsg("✅ تنظیمات ذخیره شد - فاز خارج به داخل " + (j.settings.outsideInsideEnabled ? "فعال" : "غیرفعال") + " شد");
      } else {
        setMsg("❌ " + j.error);
      }
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
    setSettings(null);
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Vazirmatn" }}>
        <div style={{ background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", width: 360 }}>
          <h1 style={{ fontWeight: 900, fontSize: 20, textAlign: "center" }}>🔐 پنل ادمین - قیمت‌یار</h1>
          <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 8 }}>یوزر: admin / پس: 1234</p>
          <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder="یوزر ادمین" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }} />
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="پسورد" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }} />
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>{loading ? "..." : "ورود"}</button>
          </form>
          {msg && <div style={{ marginTop: 12, fontSize: 12, textAlign: "center", background: "#f0f9ff", padding: 8, borderRadius: 8 }}>{msg}</div>}
          <div style={{ marginTop: 16, textAlign: "center" }}><a href="/" style={{ fontSize: 12, color: "#0ea5e9" }}>← بازگشت به سایت</a></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20, fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 20px", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h1 style={{ fontWeight: 900, fontSize: 18 }}>⚙️ پنل ادمین - قیمت‌یار</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/" style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, textDecoration: "none", color: "#333" }}>🏠 سایت</a>
            <button onClick={logout} style={{ padding: "8px 12px", background: "#fee2e2", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>خروج</button>
          </div>
        </div>

        {msg && <div style={{ marginTop: 16, background: "#ecfdf5", border: "1px solid #6ee7b7", padding: 12, borderRadius: 8, fontSize: 13 }}>{msg}</div>}

        <div style={{ marginTop: 16, display: "flex", gap: 8, background: "#fff", padding: 6, borderRadius: 10, width: "fit-content" }}>
          <button onClick={()=>setActiveTab("settings")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: activeTab==="settings" ? "#0ea5e9" : "transparent", color: activeTab==="settings" ? "#fff" : "#333", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>⚙️ تنظیمات فاز خارج به داخل</button>
          <button onClick={()=>{ setActiveTab("orders"); loadOrders(); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: activeTab==="orders" ? "#0ea5e9" : "transparent", color: activeTab==="orders" ? "#fff" : "#333", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>📦 سفارشات لباس/کفش ({orders.length})</button>
        </div>

        {activeTab === "orders" && (
          <div style={{ marginTop: 20, background: "#fff", padding: 20, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 900, fontSize: 16 }}>📦 سفارشات خارج به داخل - لباس و کفش</h2>
              <button onClick={loadOrders} style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>🔄 رفرش</button>
            </div>
            {ordersLoading ? <div style={{ padding: 20, textAlign: "center" }}>در حال بارگذاری...</div> : orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 32 }}>📭</div>
                <div style={{ marginTop: 8 }}>هنوز سفارشی ثبت نشده</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>وقتی مشتری کفش/لباس سفارش بده اینجا میاد با سایز و نوع تحویل</div>
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{o.product.name} - سایز {o.size} - {o.offer.flag} {o.offer.source}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{o.id} | {o.trackingCode} | {o.userName} - {o.userMobile}</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>آدرس: {o.address}</div>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 900, fontSize: 12 }}>{Number(o.finalPrice).toLocaleString("fa-IR")} تومان</div>
                        <div style={{ fontSize: 10, background: "#f1f5f9", padding: "3px 8px", borderRadius: 999, marginTop: 4, display: "inline-block" }}>{o.status} - {o.deliveryType}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["purchasing","shipping","customs","delivering","delivered"].map(st => (
                        <button key={st} onClick={()=>updateOrderStatus(o.id, st)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: o.status===st ? "#0ea5e9" : "#fff", color: o.status===st ? "#fff" : "#333", cursor: "pointer" }}>{st}</button>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {o.statusHistory.map((h,i) => (
                        <span key={i} style={{ fontSize: 9, background: "#f8fafc", padding: "2px 6px", borderRadius: 999, border: "1px solid #e2e8f0" }}>{h.label} - {new Date(h.time).toLocaleDateString("fa-IR")}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && settings && (
          <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
            {/* فاز خارج به داخل */}
            <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "2px solid #fcd34d" }}>
              <h2 style={{ fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                🌍 فاز خارج به داخل (Import Dropship)
                <span style={{ fontSize: 11, background: settings.outsideInsideEnabled ? "#dcfce7" : "#fee2e2", color: settings.outsideInsideEnabled ? "#065f46" : "#991b1b", padding: "4px 8px", borderRadius: 999 }}>{settings.outsideInsideEnabled ? "✅ فعال" : "❌ غیرفعال"}</span>
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.8 }}>
                وقتی فعال باشه، تو نتایج جستجو علاوه بر منابع داخلی، منابع خارجی (ترندیول، آمازون دبی، علی‌اکسپرس) هم نشون داده میشه با ماشین حساب لندد کاست، زمان تحویل و ریسک اسکور.
              </p>

              <div style={{ marginTop: 16, background: "#fffbeb", padding: 16, borderRadius: 10, border: "1px solid #fde68a" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontWeight: 800, fontSize: 14 }}>
                  <input type="checkbox" checked={settings.outsideInsideEnabled} onChange={e=>setSettings({...settings, outsideInsideEnabled: e.target.checked})} style={{ width: 20, height: 20 }} />
                  فعال‌سازی فاز خارج به داخل برای کاربران
                </label>
                <div style={{ fontSize: 11, color: "#92400e", marginTop: 8, marginRight: 32 }}>
                  اگه تیک بزنی، کاربرا تو سایت بخش "🌍 خرید از خارج" رو میبینن با قیمت نهایی + گمرک + زمان تحویل
                </div>
              </div>

              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>مبداهای خارجی</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12 }}><input type="checkbox" checked={settings.outsideSources?.trendyol} onChange={e=>setSettings({...settings, outsideSources: {...settings.outsideSources, trendyol: e.target.checked}})} /> 🇹🇷 Trendyol ترکیه (5-7 روز)</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12 }}><input type="checkbox" checked={settings.outsideSources?.amazonAe} onChange={e=>setSettings({...settings, outsideSources: {...settings.outsideSources, amazonAe: e.target.checked}})} /> 🇦🇪 Amazon.ae دبی (3-5 روز)</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12 }}><input type="checkbox" checked={settings.outsideSources?.aliexpress} onChange={e=>setSettings({...settings, outsideSources: {...settings.outsideSources, aliexpress: e.target.checked}})} /> 🇨🇳 AliExpress چین (18-25 روز)</label>
                </div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>💰 محاسبه کامل قیمت نهایی (لندد کاست)</div>
                  <div style={{ marginTop: 8, fontSize: 11, display: "grid", gap: 6 }}>
                    <div>تعرفه گمرک: <input type="number" value={settings.customs?.defaultDutyPct} onChange={e=>setSettings({...settings, customs: {...settings.customs, defaultDutyPct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>مالیات ارزش افزوده: <input type="number" value={settings.customs?.vatPct ?? 10} onChange={e=>setSettings({...settings, customs: {...settings.customs, vatPct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>هلال احمر: <input type="number" value={settings.customs?.hilalPct ?? 1} onChange={e=>setSettings({...settings, customs: {...settings.customs, hilalPct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>بیمه: <input type="number" value={settings.customs?.insurancePct} onChange={e=>setSettings({...settings, customs: {...settings.customs, insurancePct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>کارمزد صرافی: <input type="number" step="0.1" value={settings.customs?.currencyFeePct ?? 2.5} onChange={e=>setSettings({...settings, customs: {...settings.customs, currencyFeePct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>کارمزد پلتفرم: <input type="number" value={settings.customs?.platformFeePct ?? 9} onChange={e=>setSettings({...settings, customs: {...settings.customs, platformFeePct: Number(e.target.value)}})} style={{ width: 50, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> ٪</div>
                    <div>حمل بین‌الملل: <input type="number" value={settings.customs?.shippingIntl} onChange={e=>setSettings({...settings, customs: {...settings.customs, shippingIntl: Number(e.target.value)}})} style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> تومان</div>
                    <div>ترخیصیه: <input type="number" value={settings.customs?.clearanceFee ?? 800000} onChange={e=>setSettings({...settings, customs: {...settings.customs, clearanceFee: Number(e.target.value)}})} style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> تومان</div>
                    <div>انبارداری: <input type="number" value={settings.customs?.warehousingFee ?? 200000} onChange={e=>setSettings({...settings, customs: {...settings.customs, warehousingFee: Number(e.target.value)}})} style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> تومان</div>
                    <div>حمل داخل: <input type="number" value={settings.customs?.domesticShipping ?? 150000} onChange={e=>setSettings({...settings, customs: {...settings.customs, domesticShipping: Number(e.target.value)}})} style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }} /> تومان</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, background: "#fff", padding: 6, borderRadius: 6, border: "1px dashed #cbd5e1" }}>
                    فرمول: CIF = کالا+حمل+بیمه | گمرک = CIF×تعرفه | VAT = (CIF+گمرک)×10% | نهایی = CIF+گمرک+هلال+VAT+ترخیص+انبار+صرافی+حمل داخل+کارمزد
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, background: "#f0f9ff", padding: 12, borderRadius: 8, fontSize: 11, lineHeight: 1.8 }}>
                <b>💡 مدل پیشنهادی برای کاهش ریسک:</b><br/>
                • فقط ترکیه و دبی رو اول فعال کن (زمان کم، گمرک روتین)<br/>
                • AliExpress رو فقط برای "پیش‌خرید اقتصادی" فعال کن<br/>
                • مشتری ۲ گزینه ببینه: فوری از انبار تهران / اقتصادی از خارج با تخفیف
              </div>
            </div>

            {/* ذخیره */}
            <div style={{ background: "#fff", padding: 16, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>آخرین ذخیره: {new Date().toLocaleString("fa-IR")}</div>
              <button onClick={saveSettings} disabled={loading} style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>{loading ? "در حال ذخیره..." : "💾 ذخیره تنظیمات"}</button>
            </div>

            {/* آمار */}
            <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
              <h3 style={{ fontWeight: 800, fontSize: 13 }}>📊 پیش‌نمایش فاز خارج به داخل</h3>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
                <div style={{ background: "#fef3c7", padding: 10, borderRadius: 8, textAlign: "center" }}><div>🇹🇷 ترندیول</div><div style={{ fontWeight: 800, marginTop: 4 }}>۵-۷ روز</div><div>تعرفه ۲۰٪</div></div>
                <div style={{ background: "#dbeafe", padding: 10, borderRadius: 8, textAlign: "center" }}><div>🇦🇪 دبی</div><div style={{ fontWeight: 800, marginTop: 4 }}>۳-۵ روز</div><div>تعرفه ۱۵٪</div></div>
                <div style={{ background: "#fee2e2", padding: 10, borderRadius: 8, textAlign: "center" }}><div>🇨🇳 چین</div><div style={{ fontWeight: 800, marginTop: 4 }}>۱۸-۲۵ روز</div><div>تعرفه ۱۰٪</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
