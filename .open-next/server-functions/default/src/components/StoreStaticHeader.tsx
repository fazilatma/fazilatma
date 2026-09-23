import Link from "next/link";

const quickLinks = [
  { href: "/shop#brand-search", label: "همه لپ‌تاپ‌ها" },
  { href: "/shop?use=business#static-header", label: "اداری" },
  { href: "/shop?use=student#static-header", label: "دانشجویی" },
  { href: "/shop?use=gaming#static-header", label: "گیمینگ" },
  { href: "/shop?condition=stock#static-header", label: "استوک" },
  { href: "/shop/collections/special-offers", label: "فروش ویژه" },
  { href: "/support", label: "پشتیبانی" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="OptiBid">
      <span className="text-2xl font-black text-[#003b5c]">
        Opti<span className="text-[#00a8e8]">Bid</span>
      </span>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#003b5c] to-[#00a8e8] text-white shadow-sm">
        ↗
      </span>
    </Link>
  );
}

export default function StoreStaticHeader() {
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
              <Link href="/cart" className="mt-2 block rounded-2xl bg-[#003b5c] px-4 py-3 text-center text-sm font-black text-white">
                سبد خرید
              </Link>
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

        <Link href="/cart" className="rounded-2xl bg-[#003b5c] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#005f8f]">
          سبد خرید
        </Link>
      </div>
    </header>
  );
}
