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
    const stopRequest = requestStorePrice(product.id, (value) => {
      // endpoint از کلید مستقل محصول می‌خواند و از نقشهٔ مشترک/قیمت اولیه معتبرتر است.
      if (value) setCurrent(value);
      setSynced(true);
    });
    const handlePriceSync = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string; value?: BrowserStorePrice }>).detail;
      if (detail?.productId === product.id && detail.value) {
        setCurrent((existing) => newerPrice(existing, detail.value as BrowserStorePrice));
        setSynced(true);
      }
    };
    window.addEventListener(STORE_PRICE_SYNC_EVENT, handlePriceSync);
    return () => {
      stopRequest();
      window.removeEventListener(STORE_PRICE_SYNC_EVENT, handlePriceSync);
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
          {discount > 0 && (
            <p className="mt-1 text-xs text-slate-400 line-through">{money(originalPrice || 0)}</p>
          )}
          {!synced ? (
            <p className="mt-1 text-sm font-black text-sky-700">در حال همگام‌سازی قیمت…</p>
          ) : reviewRequired ? (
            <p className="mt-1 text-sm font-black text-amber-700">در حال بررسی قیمت روز</p>
          ) : (
            <p className="mt-1 text-lg font-black text-slate-900">{money(current.price)}</p>
          )}
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
          موجود
        </span>
      </div>
      <div className="mt-4">
        {!synced ? (
          <span className="block rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black text-slate-500">
            بررسی آخرین قیمت
          </span>
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
