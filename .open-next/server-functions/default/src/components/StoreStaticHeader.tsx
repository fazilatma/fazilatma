import Link from "next/link";
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

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="OptiBid">
      <span className="text-2xl font-black text-[#003b5c]">
        Opti<span className="text-[#00a8e8]">Bid</span>
      </span>
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50"
          stroke="url(#staticBlueGrad)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80"
          stroke="#003b5c"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40"
          stroke="#00a8e8"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id="staticBlueGrad"
            x1="15"
            y1="20"
            x2="65"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#003b5c" />
            <stop offset="1" stopColor="#00a8e8" />
          </linearGradient>
        </defs>
      </svg>
    </Link>
  );
}

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

        <Logo />

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
