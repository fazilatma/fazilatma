"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StoreAddToCartButton from "@/components/StoreAddToCartButton";
import {
  fetchBrowserStorePrices,
  readBrowserStorePrice,
  STORE_PRICE_SYNC_EVENT,
  type BrowserStorePrice,
} from "@/lib/browser-store-prices";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

type CardPriceProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  brand: string;
  warranty: string;
  rating: number;
  reviewsCount: number;
  priceVerifiedAt?: string;
  priceAvailable?: boolean;
};

type PriceListener = (value: BrowserStorePrice | null) => void;
const queuedIds = new Set<string>();
const queuedListeners = new Map<string, Set<PriceListener>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushPriceQueue() {
  flushTimer = null;
  const ids = Array.from(queuedIds);
  queuedIds.clear();
  for (let offset = 0; offset < ids.length; offset += 30) {
    const batch = ids.slice(offset, offset + 30);
    let prices: Record<string, BrowserStorePrice> = {};
    try {
      prices = await fetchBrowserStorePrices(batch);
    } catch {
      // قیمت اولیهٔ SSR حفظ می‌شود؛ فقط دکمه بعد از پایان تلاش فعال خواهد شد.
    }
    for (const productId of batch) {
      const listeners = queuedListeners.get(productId);
      queuedListeners.delete(productId);
      for (const listener of listeners || []) listener(prices[productId] || null);
    }
  }
}

function requestStorePrice(productId: string, listener: PriceListener) {
  const listeners = queuedListeners.get(productId) || new Set<PriceListener>();
  listeners.add(listener);
  queuedListeners.set(productId, listeners);
  queuedIds.add(productId);
  if (!flushTimer) flushTimer = setTimeout(flushPriceQueue, 0);
  return () => {
    const current = queuedListeners.get(productId);
    current?.delete(listener);
    if (current && current.size === 0) queuedListeners.delete(productId);
  };
}

function newerPrice(current: BrowserStorePrice, candidate: BrowserStorePrice) {
  return Date.parse(candidate.updatedAt) >= Date.parse(current.updatedAt) ? candidate : current;
}

export default function StoreCardPrice({
  product,
  priceNeedsReview,
}: {
  product: CardPriceProduct;
  priceNeedsReview: boolean;
}) {
  // زمان نقشهٔ مشترک SSR معیار اعتبار نیست؛ ممکن است یک نوشتن هم‌زمان، قیمت
  // قدیمی را با timestamp جدیدتر در آن گذاشته باشد. پاسخ کلید مستقل باید برنده شود.
  const [current, setCurrent] = useState<BrowserStorePrice>({
    price: product.price,
    updatedAt: "1970-01-01T00:00:00.000Z",
    available: product.priceAvailable !== false,
  });
  // حتی نقشهٔ مشترک SSR ممکن است در اثر هم‌زمانی KV قدیمی باشد؛ تا پاسخ کلید
  // مستقل محصول نرسیده، قیمت/دکمهٔ خرید را قطعی نمایش نمی‌دهیم.
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const local = readBrowserStorePrice(product.id);
    if (local) {
      setCurrent((value) => newerPrice(value, local));
      setSynced(true);
    }
    const stopRequests: Array<() => void> = [];
    const requestLatestPrice = () => {
      stopRequests.push(requestStorePrice(product.id, (value) => {
        // endpoint از کلید مستقل محصول می‌خواند و از نقشهٔ مشترک/قیمت اولیه معتبرتر است.
        if (value) setCurrent(value);
        setSynced(true);
      }));
    };
    requestLatestPrice();
    const handlePriceSync = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string; value?: BrowserStorePrice }>).detail;
      if (detail?.productId === product.id && detail.value) {
        setCurrent((existing) => newerPrice(existing, detail.value as BrowserStorePrice));
        setSynced(true);
      }
    };
    // بازگشت با دکمه Back ممکن است صفحهٔ فهرست را از bfcache برگرداند و state
    // قدیمی را نگه دارد؛ در بازگشت/فوکوس دوباره کلید مستقل محصول خوانده می‌شود.
    const handlePageShow = () => requestLatestPrice();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestLatestPrice();
    };
    window.addEventListener(STORE_PRICE_SYNC_EVENT, handlePriceSync);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopRequests.forEach((stopRequest) => stopRequest());
      window.removeEventListener(STORE_PRICE_SYNC_EVENT, handlePriceSync);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [product.id]);

  const priceChanged = current.price !== product.price;
  const originalPrice = priceChanged ? undefined : product.originalPrice;
  const discount = useMemo(() => {
    if (!originalPrice || originalPrice <= current.price) return 0;
    return Math.round(((originalPrice - current.price) / originalPrice) * 100);
  }, [current.price, originalPrice]);
  const reviewRequired = priceNeedsReview && !priceChanged;

  return (
    <>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-xs text-amber-500">
            ★ {product.rating.toLocaleString("fa-IR")} <span className="text-slate-400">({product.reviewsCount.toLocaleString("fa-IR")})</span>
          </div>
          {current.available && discount > 0 && (
            <p className="mt-1 text-xs text-slate-400 line-through">{money(originalPrice || 0)}</p>
          )}
          {!synced ? (
            <p className="mt-1 text-sm font-black text-sky-700">در حال همگام‌سازی قیمت…</p>
          ) : !current.available ? (
            <p className="mt-1 text-sm font-black text-slate-600">قیمت فعال موجود نیست</p>
          ) : reviewRequired ? (
            <p className="mt-1 text-sm font-black text-amber-700">در حال بررسی قیمت روز</p>
          ) : (
            <p className="mt-1 text-lg font-black text-slate-900">{money(current.price)}</p>
          )}
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${synced && !current.available ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
          {synced && !current.available ? "ناموجود" : "موجود"}
        </span>
      </div>
      <div className="mt-4">
        {!synced ? (
          <span className="block rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black text-slate-500">
            بررسی آخرین قیمت
          </span>
        ) : !current.available ? (
          <Link
            href={`/shop/${product.slug}`}
            className="block rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black text-slate-600 ring-1 ring-slate-200"
          >
            مشاهده وضعیت موجودی
          </Link>
        ) : reviewRequired ? (
          <Link
            href={`/shop/${product.slug}`}
            className="block rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs font-black text-amber-800 ring-1 ring-amber-200"
          >
            بررسی قیمت معتبر
          </Link>
        ) : (
          <StoreAddToCartButton
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: current.price,
              originalPrice,
              brand: product.brand,
              warranty: product.warranty,
            }}
          />
        )}
      </div>
    </>
  );
}
