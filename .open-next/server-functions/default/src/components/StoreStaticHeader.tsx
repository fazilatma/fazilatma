import Link from "next/link";
import OptiBidLogo from "@/components/OptiBidLogo";
import { getJsonStoreCatalogSettings } from "@/lib/json-store";

const laptopQuickLinks = [
  { href: "/shop?ref=brand-search#brand-search", label: "همه لپ‌تاپ‌ها" },
  { href: "/shop?use=business&ref=business#static-header", label: "اداری" },
  { href: "/shop?use=student&ref=student#static-header", label: "دانشجویی" },
  { href: "/shop?use=gaming&ref=gaming#static-header", label: "گیمینگ" },
  { href: "/shop?condition=stock&ref=stock#static-header", label: "استوک" },
  { href: "/shop/collections/special-offers", label: "فروش ویژه" },
  { href: "/support?ref=static-header", label: "پشتیبانی" },
];

const computerPartsQuickLinks = [
  { href: "/shop?category=computer-parts", label: "همه قطعات" },
  { href: "/shop?category=computer-parts&part=cpu", label: "پردازنده" },
  { href: "/shop?category=computer-parts&part=gpu", label: "کارت گرافیک" },
  { href: "/shop?category=computer-parts&part=motherboard", label: "مادربرد" },
  { href: "/shop?category=computer-parts&part=ram", label: "رم" },
  { href: "/shop?category=computer-parts&part=ssd", label: "SSD" },
  { href: "/support?ref=static-header", label: "پشتیبانی" },
];

export default async function StoreStaticHeader() {
  const catalog = await getJsonStoreCatalogSettings();
  const quickLinks = catalog.computerPartsEnabled && !catalog.laptopEnabled
    ? computerPartsQuickLinks
    : laptopQuickLinks;
  return (
    <header dir="rtl" className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <details className="group relative">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-2xl border border-slate-200 text-slate-700 [&::-webkit-details-marker]:hidden">
              ☰
            </summary>
            <div className="absolute right-0 top-12 w-64 rounded-3xl border border-slate-100 bg-white p-3 shadow-2xl">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-600">
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                <Link href="/login" className="block rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-3 text-center text-sm font-black text-[#003b5c]">
                  ورود
                </Link>
                <Link href="/register" className="block rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700">
                  ثبت‌نام
                </Link>
                <Link href="/cart" className="block rounded-2xl bg-[#003b5c] px-4 py-3 text-center text-sm font-black text-white">
                  سبد خرید
                </Link>
              </div>
            </div>
          </details>
        </div>

        <OptiBidLogo />

        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-700 md:flex">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-rose-600">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-2 text-sm font-black text-[#003b5c] shadow-sm transition hover:bg-blue-50 sm:inline-flex"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:inline-flex"
          >
            ثبت‌نام
          </Link>
          <Link href="/cart" className="rounded-2xl bg-[#003b5c] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#005f8f]">
            سبد خرید
          </Link>
        </div>
      </div>
    </header>
  );
}
