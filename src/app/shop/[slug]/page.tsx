import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreAddToCartButton from "@/components/StoreAddToCartButton";
import { LaptopVisual } from "@/components/StoreProductCard";
import { getJsonStoreProductBySlug, getJsonStoreProducts } from "@/lib/json-store";

export const dynamic = "force-dynamic";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getJsonStoreProductBySlug(slug);
  if (!product) return { title: "محصول پیدا نشد | OptiBid" };
  return {
    title: `${product.title} | فروشگاه لپ‌تاپ OptiBid`,
    description: product.summary,
  };
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getJsonStoreProductBySlug(slug);
  if (!product) notFound();
  const related = (await getJsonStoreProducts())
    .filter((item) => item.id !== product.id && item.brand === product.brand)
    .slice(0, 3);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-rose-600">خانه</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-rose-600">فروشگاه</Link>
          <span className="mx-2">/</span>
          <span>{product.title}</span>
        </nav>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <LaptopVisual product={product} />
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {badge}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-black leading-10 text-slate-900 md:text-3xl">
                {product.title}
              </h1>
              <p className="mt-3 text-sm leading-8 text-slate-600">{product.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
                  ★ {product.rating.toLocaleString("fa-IR")} از ۵
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                  {product.reviewsCount.toLocaleString("fa-IR")} دیدگاه کاربران
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                  موجود در انبار فروشگاه
                </span>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-sm text-slate-400 line-through">{money(product.originalPrice)}</p>
                )}
                <p className="text-3xl font-black text-rose-600">{money(product.price)}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {product.warranty} · {product.shippingNote}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                  <Link href="/cart" className="rounded-2xl border border-rose-200 bg-white px-5 py-3 text-center text-sm font-black text-rose-600 transition hover:bg-rose-50">
                    مشاهده سبد خرید
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">مشخصات فنی</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <span className="text-slate-500">{key}</span>
                  <b className="mt-1 block text-slate-900">{value}</b>
                </div>
              ))}
            </div>
            <h2 className="mt-8 text-xl font-black text-slate-900">توضیحات کالا</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">
              {product.description}
            </p>
          </div>
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-900">خدمات فروشگاه</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">✓ امکان ثبت سفارش آنلاین</p>
              <p className="rounded-2xl bg-blue-50 p-3 text-blue-800">✓ بررسی مشخصات و سلامت کالا</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-800">✓ پشتیبانی و هماهنگی ارسال</p>
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">محصولات مشابه {product.brand}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/shop/${item.slug}`} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-rose-50">
                  <p className="font-black text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm font-black text-rose-600">{money(item.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
