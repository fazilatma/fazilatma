import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreProductCard from "@/components/StoreProductCard";
import { getJsonStoreProducts } from "@/lib/json-store";
import {
  getLaptopCollection,
  getLaptopCollectionProducts,
  laptopCollectionItems,
} from "@/lib/laptop-storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getLaptopCollection(slug);
  if (!collection) return { title: "بخش فروشگاه لپ‌تاپ | OptiBid" };
  return {
    title: `${collection.title} | فروشگاه لپ‌تاپ OptiBid`,
    description: collection.subtitle,
  };
}

export default async function LaptopCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getLaptopCollection(slug);
  if (!collection) notFound();

  const products = getLaptopCollectionProducts(
    await getJsonStoreProducts(),
    collection.slug,
  );

  const theme = {
    emerald: {
      gradient: "from-emerald-600 via-[#006494] to-[#003b5c]",
      badge: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-100",
    },
    blue: {
      gradient: "from-blue-600 via-[#006494] to-[#003b5c]",
      badge: "bg-blue-50 text-blue-700",
      border: "border-blue-100",
    },
    rose: {
      gradient: "from-rose-600 via-[#006494] to-[#003b5c]",
      badge: "bg-rose-50 text-rose-700",
      border: "border-rose-100",
    },
  }[collection.accent];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <section className={`bg-gradient-to-l ${theme.gradient} px-4 py-14 text-white`}>
        <div className="mx-auto max-w-7xl">
          <nav className="mb-6 text-sm text-white/80">
            <Link href="/" className="hover:text-white">خانه</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-white">فروشگاه لپ‌تاپ</Link>
            <span className="mx-2">/</span>
            <span>{collection.title}</span>
          </nav>
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-black ring-1 ring-white/20">
            {collection.badge}
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.7] md:text-5xl">
            {collection.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">
            {collection.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href="/shop"
              className="rounded-2xl bg-white px-6 py-3 font-black text-[#003b5c] shadow-lg"
            >
              همه محصولات فروشگاه
            </Link>
            <Link
              href="/cart"
              className="rounded-2xl border border-white/30 px-6 py-3 font-black text-white"
            >
              سبد خرید من
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className={`rounded-[2rem] border bg-white p-5 shadow-sm ${theme.border}`}>
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${theme.badge}`}>
                {products.length.toLocaleString("fa-IR")} مدل
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">
                لیست {collection.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                این صفحه مستقل برای بررسی سریع {collection.shortTitle} در فاز فروشگاهی OptiBid ساخته شده است.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {laptopCollectionItems
                .filter((item) => item.slug !== collection.slug)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {item.title}
                  </Link>
                ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              فعلاً محصولی برای این بخش ثبت نشده است.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
