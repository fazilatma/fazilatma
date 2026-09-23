import Link from "next/link";
import type { JsonStoreProduct } from "@/lib/json-store";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

function discountPercent(product: JsonStoreProduct) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

function StaticLaptopVisual({ product }: { product: JsonStoreProduct }) {
  const discount = discountPercent(product);
  return (
    <div
      className="relative grid h-40 place-items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-100 via-white to-blue-50"
      aria-label={product.title}
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#00a8e8]/10" />
      <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-rose-500/10" />
      <div className="relative w-44 max-w-[75%]">
        <div className="mx-auto h-28 rounded-t-2xl border-[10px] border-slate-800 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] p-3 shadow-2xl">
          <div className="h-full rounded-lg bg-white/10" />
        </div>
        <div className="mx-auto h-4 w-56 max-w-full rounded-b-3xl bg-slate-700 shadow-xl" />
        <div className="mx-auto h-2 w-32 rounded-b-2xl bg-slate-400" />
      </div>
      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#003b5c] shadow-sm">
        {product.brand}
      </span>
      {discount > 0 && (
        <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-sm">
          {discount.toLocaleString("fa-IR")}٪
        </span>
      )}
    </div>
  );
}

export default function StoreProductSeoCard({
  product,
  sectionId = "",
}: {
  product: JsonStoreProduct;
  sectionId?: string;
}) {
  const discount = discountPercent(product);
  const keySpecs = Object.entries(product.specs || {}).slice(0, 3);
  const productHref = `/shop/${product.slug}${sectionId ? `#${sectionId}` : ""}`;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl">
      <Link href={productHref} className="block">
        <StaticLaptopVisual product={product} />
        <div className="px-3 pt-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {product.badges.slice(0, 2).map((badge) => (
              <span key={badge} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                {badge}
              </span>
            ))}
          </div>
          <div className="line-clamp-2 min-h-12 text-sm font-black leading-6 text-slate-900 transition group-hover:text-rose-600">
            {product.title}
          </div>
        </div>
      </Link>
      <div className="p-3">
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          {keySpecs.map(([key, value]) => (
            <div key={key} className="line-clamp-1">
              <b className="text-slate-700">{key}:</b> {value}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-amber-500">
              ★ {product.rating.toLocaleString("fa-IR")} <span className="text-slate-400">({product.reviewsCount.toLocaleString("fa-IR")})</span>
            </div>
            {discount > 0 && (
              <div className="mt-1 text-xs text-slate-400 line-through">{money(product.originalPrice || 0)}</div>
            )}
            <div className="mt-1 text-lg font-black text-slate-900">{money(product.price)}</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
            موجود
          </span>
        </div>
        <span className="mt-4 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-xs font-black text-white transition group-hover:bg-rose-600">
          مشاهده جزئیات و خرید
        </span>
      </div>
    </article>
  );
}
