"use client";
import { useState, useEffect } from "react";

export default function OrdersPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("qy_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        loadOrders(u.id);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  async function loadOrders(userId) {
    setLoading(true);
    try {
      const r = await fetch(`/api/orders?userId=${userId}`);
      const j = await r.json();
      if (j.ok) setOrders(j.orders);
    } catch {}
    setLoading(false);
  }

  const statusColors = {
    pending: "#f59e0b",
    purchasing: "#0ea5e9",
    shipping: "#8b5cf6",
    customs: "#ef4444",
    delivering: "#10b981",
    delivered: "#065f46",
    returned: "#6b7280",
    cancelled: "#991b1b"
  };

  const statusLabels = {
    pending: "ثبت سفارش",
    purchasing: "در حال خرید از خارج",
    shipping: "در حال حمل بین‌الملل",
    customs: "در گمرک",
    delivering: "در حال تحویل",
    delivered: "تحویل داده شد",
    returned: "مرجوع",
    cancelled: "لغو شد"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20, fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 20px", borderRadius: 12 }}>
          <h1 style={{ fontWeight: 900, fontSize: 18 }}>📦 سفارشات من - خارج به داخل</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/" style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, textDecoration: "none", color: "#333" }}>🏠 سایت</a>
            <a href="/admin" style={{ padding: "8px 12px", background: "#1e293b", color: "#fff", borderRadius: 8, fontSize: 12, textDecoration: "none" }}>⚙️ ادمین</a>
          </div>
        </div>

        {!user && !loading && (
          <div style={{ marginTop: 20, background: "#fff", padding: 40, borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <div style={{ fontWeight: 900, marginTop: 12 }}>برای دیدن سفارشات وارد شوید</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>سفارشات لباس و کفش خارج به داخل اینجا نمایش داده میشه</div>
            <a href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", background: "#0ea5e9", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>رفتن به سایت و ورود</a>
          </div>
        )}

        {loading && <div style={{ marginTop: 20, textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>}

        {user && !loading && orders.length === 0 && (
          <div style={{ marginTop: 20, background: "#fff", padding: 40, borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <div style={{ fontWeight: 900, marginTop: 12 }}>هنوز سفارشی ندارید</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>وقتی کفش یا لباس از خارج سفارش بدید اینجا میاد</div>
            <a href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", background: "#0ea5e9", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>جستجوی کالا</a>
          </div>
        )}

        {orders.length > 0 && (
          <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: "#fff", padding: 16, borderRadius: 12, borderLeft: `4px solid ${statusColors[order.status] || "#e2e8f0"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>{order.product.name} - سایز {order.size}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{order.id} | رهگیری: {order.trackingCode} | {order.offer.flag} {order.offer.source}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, background: statusColors[order.status], color: "#fff", padding: "4px 10px", borderRadius: 999, display: "inline-block" }}>{statusLabels[order.status] || order.status}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>{Number(order.finalPrice).toLocaleString("fa-IR")} تومان</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{order.deliveryType === "immediate" ? "⚡ فوری" : "💰 اقتصادی"} - {order.offer.delivery}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {order.statusHistory.map((h, i) => (
                    <div key={i} style={{ fontSize: 10, background: i === order.statusHistory.length - 1 ? "#0ea5e9" : "#f1f5f9", color: i === order.statusHistory.length - 1 ? "#fff" : "#475569", padding: "4px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{h.label}</span>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>{new Date(h.time).toLocaleDateString("fa-IR")}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 11, lineHeight: 1.7 }}>
                  <div>📦 {order.offer.breakdown?.slice(0, 100) || ""}...</div>
                  <div>📍 {order.address || "آدرس ثبت نشده"}</div>
                  <div>📱 {order.userMobile}</div>
                  <div>⏰ تحویل تخمینی: {new Date(order.estimatedDelivery).toLocaleDateString("fa-IR")}</div>
                  {order.deliveryType === "immediate" && <div style={{ color: "#065f46", fontWeight: 800 }}>✅ ۲ ساعت فرصت تست سایز موقع تحویل</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
