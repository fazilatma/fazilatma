import Link from "next/link";
import StoreAddToCartButton from "@/components/StoreAddToCartButton";
import StoreProductRemoteImage from "@/components/StoreProductRemoteImage";
import type { ComputerPartVisualKind } from "@/components/ComputerPartVisual";
import type { JsonStoreProduct } from "@/lib/json-store";
import { isComputerPartsCatalogProduct } from "@/lib/store-catalog-sections";
import { publicStoreProductBadges, publicStoreProductSpecs } from "@/lib/store-product-public";
import { isSuspiciousStoreProductPrice } from "@/lib/store-pricing";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

function discountPercent(product: JsonStoreProduct) {
  if (isSuspiciousStoreProductPrice(product)) return 0;
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

function computerPartVisualKind(product: JsonStoreProduct): ComputerPartVisualKind {
  const text = `${product.title} ${product.category} ${product.summary}`.toLowerCase();
  if (/کارت گرافیک|\bgpu\b|geforce|radeon|\brtx\b|\bgtx\b/.test(text)) return "gpu";
  if (/مادربرد|motherboard/.test(text)) return "motherboard";
  if (/رم کامپیوتر|حافظه رم|ماژول رم|ram module|memory module/.test(text)) return "ram";
  if (/\bssd\b|\bnvme\b|solid state|هارد اس اس دی/.test(text)) return "ssd";
  if (/پاور|منبع تغذیه|power supply|\bpsu\b/.test(text)) return "power";
  if (/خنک|cooler|فن پردازنده|خمیر سیلیکون/.test(text)) return "cooler";
  if (/کیس کامپیوتر|computer case|computer chassis/.test(text)) return "case";
  return "cpu";
}

const computerPartFallbackImages: Record<ComputerPartVisualKind, string> = {
  cpu: "/images/parts/cpu.png",
  gpu: "/images/parts/gpu.png",
  ram: "/images/parts/ram.png",
  ssd: "/images/parts/ssd.png",
  motherboard: "/images/parts/motherboard.png",
  power: "/images/parts/power.png",
  case: "/images/parts/case.png",
  cooler: "/images/parts/cooler.png",
};

export function LaptopVisual({ product, compact = false }: { product: JsonStoreProduct; compact?: boolean }) {
  const isComputerPart = isComputerPartsCatalogProduct(product);
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-100 via-white to-blue-50 ${compact ? "h-40" : "h-56"}`}
      aria-label={product.title}
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#00a8e8]/10" />
      <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-rose-500/10" />
      {isComputerPart ? (
        <img
          src={computerPartFallbackImages[computerPartVisualKind(product)]}
          alt={`تصویر مرتبط با ${product.title}`}
          className="relative h-[82%] w-[82%] object-contain drop-shadow-xl"
        />
      ) : (
        <div className="relative w-44 max-w-[75%]">
          <div className="mx-auto h-28 rounded-t-2xl border-[10px] border-slate-800 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] p-3 shadow-2xl">
            <div className="h-full rounded-lg bg-white/10" />
          </div>
          <div className="mx-auto h-4 w-56 max-w-full rounded-b-3xl bg-slate-700 shadow-xl" />
          <div className="mx-auto h-2 w-32 rounded-b-2xl bg-slate-400" />
        </div>
      )}
      <StoreProductRemoteImage
        src={product.imageUrl}
        alt={`عکس ${product.title}`}
        className="absolute inset-0 z-10 h-full w-full bg-white object-contain p-2"
      />
      <span className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#003b5c] shadow-sm">
        {product.brand}
      </span>
      {discountPercent(product) > 0 && (
        <span className="absolute left-4 top-4 z-20 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-sm">
          {discountPercent(product).toLocaleString("fa-IR")}٪
        </span>
      )}
    </div>
  );
}

export default function StoreProductCard({ product }: { product: JsonStoreProduct }) {
  const priceNeedsReview = isSuspiciousStoreProductPrice(product);
  const discount = discountPercent(product);
  const keySpecs = publicStoreProductSpecs(product.specs || {}).slice(0, 3);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl">
      <Link href={`/shop/${product.slug}`} className="block">
        <LaptopVisual product={product} compact />
        <div className="px-3 pt-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {publicStoreProductBadges(product.badges).slice(0, 2).map((badge) => (
              <span key={badge} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                {badge}
              </span>
            ))}
          </div>
          <p className="line-clamp-2 min-h-12 text-sm font-black leading-6 text-slate-900 transition group-hover:text-rose-600">
            {product.title}
          </p>
        </div>
      </Link>
      <div className="p-3">
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          {keySpecs.map(([key, value]) => (
            <p key={key} className="line-clamp-1">
              <b className="text-slate-700">{key}:</b> {value}
            </p>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-amber-500">
              ★ {product.rating.toLocaleString("fa-IR")} <span className="text-slate-400">({product.reviewsCount.toLocaleString("fa-IR")})</span>
            </div>
            {discount > 0 && (
              <p className="mt-1 text-xs text-slate-400 line-through">{money(product.originalPrice || 0)}</p>
            )}
            {priceNeedsReview ? (
              <p className="mt-1 text-sm font-black text-amber-700">در حال بررسی قیمت روز</p>
            ) : (
              <p className="mt-1 text-lg font-black text-slate-900">{money(product.price)}</p>
            )}
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
            موجود
          </span>
        </div>
        <div className="mt-4">
          {priceNeedsReview ? (
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
                price: product.price,
                originalPrice: product.originalPrice,
                brand: product.brand,
                warranty: product.warranty,
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}
