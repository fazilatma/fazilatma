"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CART_KEY, type StoreCartProduct } from "@/components/StoreAddToCartButton";

type CartItem = StoreCartProduct & { quantity: number };

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

function readCart(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function StoreCartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    receiverName: "",
    receiverPhone: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    setItems(readCart());
    setForm((current) => ({
      ...current,
      receiverName: localStorage.getItem("userDisplayName") || "",
    }));
    const refresh = () => setItems(readCart());
    window.addEventListener("optibid-store-cart-updated", refresh);
    return () => window.removeEventListener("optibid-store-cart-updated", refresh);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const updateQuantity = (id: string, quantity: number) => {
    const next = items
      .map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      )
      .filter((item) => item.quantity > 0);
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const removeItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const submitOrder = async () => {
    const userId = Number(localStorage.getItem("userId") || 0);
    const role = localStorage.getItem("userRole");
    if (!userId || !role) {
      sessionStorage.setItem("redirectAfterAuth", "/cart");
      window.location.href = "/login";
      return;
    }
    if (items.length === 0) {
      alert("سبد خرید شما خالی است.");
      return;
    }
    if (!form.receiverName.trim() || !form.receiverPhone.trim() || !form.address.trim()) {
      alert("نام گیرنده، شماره تماس و آدرس ارسال را کامل کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: userId,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          receiverName: form.receiverName,
          receiverPhone: form.receiverPhone,
          shippingAddress: form.address,
          note: form.note,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "ثبت سفارش ناموفق بود.");
      localStorage.removeItem(CART_KEY);
      setItems([]);
      alert(`${result.message}\nکد سفارش: ${result.order?.id || "—"}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ثبت سفارش فروشگاهی ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">سبد خرید شما خالی است</h1>
        <p className="mt-2 text-sm text-slate-500">از فروشگاه لپ‌تاپ، مدل مورد نظر را انتخاب کنید.</p>
        <Link href="/shop" className="mt-6 inline-flex rounded-2xl bg-rose-600 px-7 py-3 font-black text-white">
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <section className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <Link href={`/shop/${item.slug}`} className="text-lg font-black text-[#003b5c] hover:text-rose-600">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-slate-500">{item.brand} · {item.warranty}</p>
                <p className="mt-2 text-xl font-black text-slate-900">{money(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-lg font-black"
                >
                  −
                </button>
                <span className="grid h-10 w-12 place-items-center rounded-xl border border-slate-200 font-black">
                  {item.quantity.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-lg font-black"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="mr-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-600"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">خلاصه سفارش</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">تعداد کالا</span>
            <b>{items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("fa-IR")}</b>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-slate-500">مبلغ کل</span>
            <b className="text-lg text-rose-600">{money(total)}</b>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={form.receiverName}
            onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
            placeholder="نام گیرنده"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <input
            value={form.receiverPhone}
            onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
            placeholder="شماره تماس"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="آدرس کامل ارسال"
            className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="توضیح اختیاری سفارش"
            className="min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={submitOrder}
          className="mt-5 w-full rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-rose-700 disabled:bg-slate-300"
        >
          {submitting ? "در حال ثبت سفارش..." : "ثبت سفارش و ادامه پرداخت"}
        </button>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          پس از ثبت سفارش، جزئیات پرداخت و ارسال در حساب کاربری شما ثبت می‌شود.
        </p>
      </aside>
    </div>
  );
}
