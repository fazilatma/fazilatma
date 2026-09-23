"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CART_KEY } from "@/components/StoreAddToCartButton";
import {
  categoryHref,
  defaultCatalogCategories,
  type CatalogCategory,
} from "@/lib/catalog-categories";


type StoreTopNavMenu = {
  title: string;
  href: string;
  groups: Array<{ title: string; items: string[] }>;
};

const storeTopNavMenus: StoreTopNavMenu[] = [
  {
    title: "لپ‌تاپ",
    href: "/shop#laptop-menu",
    groups: [
      { title: "بر اساس برند", items: ["لپ‌تاپ لنوو", "لپ‌تاپ اچ‌پی", "لپ‌تاپ دل", "لپ‌تاپ ایسوس", "مک‌بوک اپل"] },
      { title: "بر اساس کاربری", items: ["لپ‌تاپ اداری", "لپ‌تاپ استوک", "لپ‌تاپ گیمینگ", "لپ‌تاپ مهندسی", "لپ‌تاپ دانشجویی"] },
      { title: "بر اساس مشخصات", items: ["رم ۱۶ گیگ", "SSD 512GB", "Core i7", "گرافیک RTX", "لپ‌تاپ سبک"] },
    ],
  },
  {
    title: "قطعات کامپیوتر",
    href: "/shop?category=computer-parts",
    groups: [
      { title: "قطعات پردازنده", items: ["پردازنده", "پردازنده بر اساس برند", "پردازنده Intel", "پردازنده AMD", "Core Ultra و Core i"] },
      { title: "پردازنده بر اساس نسل Intel", items: ["پردازنده نسل ۱۴", "پردازنده نسل ۱۳", "پردازنده نسل ۱۲", "پردازنده نسل ۱۱", "پردازنده نسل ۱۰"] },
      { title: "پردازنده بر اساس مدل AMD", items: ["Ryzen 9", "Ryzen 7", "Ryzen 5", "Ryzen 3", "سوکت AM5 و AM4"] },
      { title: "سایر قطعات", items: ["مادربرد", "کارت گرافیک", "مانیتور", "رم کامپیوتر", "هارد اینترنال", "SSD", "کیس", "پاور", "خنک کننده پردازنده", "فن کیس", "خمیر سیلیکون"] },
    ],
  },
  {
    title: "لوازم جانبی کامپیوتر",
    href: "/shop?category=accessories",
    groups: [
      { title: "ماوس بر اساس برند", items: ["ماوس MSI", "ماوس Redragon", "ماوس Razer", "ماوس Logitech", "ماوس Green", "ماوس Apple"] },
      { title: "ماوس بر اساس نوع اتصال", items: ["ماوس بی‌سیم", "ماوس سیم‌دار", "ماوس گیمینگ"] },
      { title: "کیبورد و ورودی", items: ["کیبورد", "کیبورد و ماوس", "دسته و فرمان بازی", "پد ماوس"] },
      { title: "صوت، تصویر و ابزار", items: ["هدست و هدفون", "میکروفون", "اسپیکر", "وب‌کم", "کارت صدا", "پایه دیواری و مانیتور", "پاوربانک"] },
    ],
  },
  {
    title: "کامپیوتر آماده",
    href: "/shop?category=ready-pc",
    groups: [
      { title: "کامپیوتر آماده", items: ["کیس آماده اداری", "کیس آماده گیمینگ", "کامپیوتر اقتصادی", "کامپیوتر حرفه‌ای"] },
      { title: "فرم‌فکتور", items: ["مینی پی‌سی", "آل‌این‌وان", "کامپیوتر کوچک", "ورک‌استیشن"] },
      { title: "کاربری", items: ["حسابداری", "برنامه‌نویسی", "طراحی", "رندرینگ", "بازی"] },
    ],
  },
  {
    title: "وسایل گیمینگ",
    href: "/shop?use=gaming",
    groups: [
      { title: "بر اساس برند", items: ["لپ‌تاپ گیمینگ ایسوس", "لپ‌تاپ گیمینگ لنوو", "لپ‌تاپ گیمینگ HP", "لپ‌تاپ گیمینگ ایسر"] },
      { title: "تجهیزات گیمینگ", items: ["مانیتور گیمینگ", "کیبورد گیمینگ", "ماوس گیمینگ", "هدست گیمینگ", "اسپیکر گیمینگ"] },
      { title: "قطعات گیمینگ", items: ["پردازنده گیمینگ", "کارت گرافیک گیمینگ", "مادربرد گیمینگ", "کیس گیمینگ", "پاور گیمینگ", "فن پردازنده گیمینگ"] },
      { title: "اکسسوری گیمینگ", items: ["صندلی گیمینگ", "میز گیمینگ", "اکسسوری گیمینگ", "تجهیزات گیمینگ", "محصولات سفید گیمینگ"] },
    ],
  },
  {
    title: "کنسول بازی",
    href: "/shop?category=console",
    groups: [
      { title: "کنسول‌ها", items: ["PlayStation", "Xbox", "Nintendo Switch", "کنسول دستی"] },
      { title: "لوازم جانبی کنسول", items: ["دسته بازی", "هدست کنسول", "پایه شارژ", "کیف و محافظ"] },
      { title: "بازی و اشتراک", items: ["بازی PS5", "بازی Xbox", "اکانت و اشتراک", "کارت هدیه"] },
    ],
  },
  {
    title: "تجهیزات شبکه",
    href: "/shop?category=network",
    groups: [
      { title: "مودم و روتر ADSL/VDSL", items: ["مودم روتر TP-Link", "مودم روتر D-Link", "مودم روتر Asus", "مودم روتر Netis", "مودم روتر Neterbit"] },
      { title: "مودم روتر 3G/4G/5G", items: ["مودم روتر TP-Link 4G", "مودم روتر D-Link 4G", "مودم روتر Naztech 4G", "مودم روتر Neterbit 4G", "مودم روتر DU 5G"] },
      { title: "مودم روتر فیبر نوری", items: ["مودم روتر فیبر نوری Huawei", "مودم روتر فیبر نوری", "ONT فیبر نوری"] },
      { title: "شبکه و توسعه", items: ["کارت شبکه", "سوییچ و اکستندر", "روتر و اکسس پوینت", "کابل شبکه"] },
    ],
  },
  {
    title: "ماشین‌های اداری",
    href: "/shop?category=office-machines",
    groups: [
      { title: "پرینتر بر اساس برند", items: ["پرینتر HP", "پرینتر Canon", "پرینتر Epson", "پرینتر Brother"] },
      { title: "پرینتر بر اساس نوع چاپ", items: ["پرینتر لیزری", "پرینتر جوهرافشان", "پرینتر چندکاره", "پرینتر لیبل"] },
      { title: "پرینتر بر اساس کاربری", items: ["پرینتر خانگی", "پرینتر اداری", "پرینتر فروشگاهی"] },
      { title: "سایر ماشین‌های اداری", items: ["اسکنر", "لیبل پرینتر", "بارکد خوان", "تونر و کارتریج", "ویدئو پروژکتور", "پرده نمایش", "کاغذ خردکن"] },
    ],
  },
];

const storeLaptopCategories: CatalogCategory[] = [
  {
    id: "store-laptop-brands",
    legacyId: 101,
    name: "برند لپ‌تاپ",
    icon: "💻",
    isActive: true,
    subcategories: [
      { id: "store-brands-main", title: "برندهای اصلی", items: ["لپ‌تاپ لنوو", "لپ‌تاپ اچ‌پی", "لپ‌تاپ دل", "لپ‌تاپ ایسوس", "مک‌بوک اپل"] },
      { id: "store-brands-series", title: "سری‌های محبوب", items: ["ThinkPad", "Latitude", "EliteBook", "TUF Gaming", "Legion"] },
      { id: "store-brands-choice", title: "انتخاب سریع", items: ["پرفروش‌ها", "پیشنهاد ویژه", "موجود در انبار", "اقتصادی"] },
    ],
  },
  {
    id: "store-laptop-use",
    legacyId: 102,
    name: "کاربری لپ‌تاپ",
    icon: "🎯",
    isActive: true,
    subcategories: [
      { id: "store-use-daily", title: "کاربری روزمره", items: ["لپ‌تاپ دانشجویی", "لپ‌تاپ اداری", "لپ‌تاپ سبک", "کار خانگی"] },
      { id: "store-use-pro", title: "کاربری حرفه‌ای", items: ["لپ‌تاپ مهندسی", "لپ‌تاپ برنامه‌نویسی", "تدوین و طراحی", "رندرینگ"] },
      { id: "store-use-gaming", title: "قدرت پردازشی", items: ["لپ‌تاپ گیمینگ", "گرافیک RTX", "نمایشگر 144Hz", "خنک‌کنندگی قوی"] },
    ],
  },
  {
    id: "store-laptop-specs",
    legacyId: 103,
    name: "مشخصات فنی",
    icon: "⚙️",
    isActive: true,
    subcategories: [
      { id: "store-spec-cpu", title: "پردازنده", items: ["Core i5", "Core i7", "Ryzen 5", "Ryzen 7", "Apple M1"] },
      { id: "store-spec-memory", title: "رم و حافظه", items: ["رم 8GB", "رم 16GB", "SSD 256GB", "SSD 512GB", "SSD 1TB"] },
      { id: "store-spec-display", title: "نمایشگر", items: ["13 اینچ", "14 اینچ", "15.6 اینچ", "Full HD", "نرخ 144Hz"] },
    ],
  },
  {
    id: "store-laptop-budget",
    legacyId: 104,
    name: "بودجه و وضعیت",
    icon: "💰",
    isActive: true,
    subcategories: [
      { id: "store-budget", title: "بازه قیمت", items: ["اقتصادی", "میان‌رده", "حرفه‌ای", "ویژه گیمینگ"] },
      { id: "store-condition", title: "وضعیت کالا", items: ["نو", "کارکرده تمیز", "استوک شرکتی", "مهلت تست"] },
      { id: "store-service", title: "خدمات خرید", items: ["ارسال سریع", "گارانتی تست", "مقایسه فنی", "مشاوره خرید"] },
    ],
  },
];

function storeLaptopHref(label: string) {
  const text = label.toLowerCase();
  const fragment = encodeURIComponent(
    text
      .replace(/[\s\u200c]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "shop",
  );
  const withFragment = (href: string) => `${href}#${fragment}`;
  if (text.includes("لنوو") || text.includes("thinkpad") || text.includes("legion")) return withFragment("/shop?brand=Lenovo");
  if (text.includes("اچ") || text.includes("hp") || text.includes("elitebook")) return withFragment("/shop?brand=HP");
  if (text.includes("دل") || text.includes("dell") || text.includes("latitude")) return withFragment("/shop?brand=Dell");
  if (text.includes("ایسوس") || text.includes("asus") || text.includes("tuf")) return withFragment("/shop?brand=Asus");
  if (text.includes("اپل") || text.includes("مک") || text.includes("apple") || text.includes("m1")) return withFragment("/shop?brand=Apple");
  if (text.includes("استوک")) return withFragment("/shop?condition=stock");
  if (text.includes("کارکرده")) return withFragment("/shop?condition=used");
  if (text.includes("نو")) return withFragment("/shop?condition=new");
  if (text.includes("گیم") || text.includes("rtx") || text.includes("144")) return withFragment("/shop?use=gaming");
  if (text.includes("دانشجو") || text.includes("سبک")) return withFragment("/shop?use=student");
  if (text.includes("مهندس") || text.includes("رندر") || text.includes("تدوین") || text.includes("طراحی")) return withFragment("/shop?use=engineering");
  if (text.includes("اداری") || text.includes("شرکتی") || text.includes("برنامه")) return withFragment("/shop?use=business");
  return withFragment("/shop");
}


function StoreTopNavItem({ menu }: { menu: StoreTopNavMenu }) {
  return (
    <div className="group relative py-5">
      <Link
        href={menu.href}
        className="flex items-center gap-1 text-sm font-bold text-gray-700 transition hover:text-rose-600"
      >
        {menu.title}
        <span className="text-xs text-gray-400 transition group-hover:rotate-180">⌄</span>
      </Link>
      <div className="invisible fixed left-1/2 top-16 z-50 w-[min(78rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-b-[2rem] border border-gray-100 bg-white text-right opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
        <div className="grid min-h-[360px] grid-cols-12">
          <div className="col-span-3 border-l border-gray-100 bg-gray-50 p-4">
            <Link
              href={menu.href}
              className="mb-4 block rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#003b5c] shadow-sm transition hover:text-rose-600"
            >
              همه موارد {menu.title} ‹
            </Link>
            <div className="space-y-2">
              {menu.groups.map((group) => (
                <a
                  key={group.title}
                  href={`#${group.title}`}
                  className="block rounded-xl px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-white hover:text-rose-600"
                >
                  {group.title}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-9 max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-4 gap-x-8 gap-y-7">
              {menu.groups.map((group) => (
                <div key={group.title} id={group.title}>
                  <Link
                    href={storeLaptopHref(group.title)}
                    className="mb-3 block border-r-2 border-rose-500 pr-2 text-sm font-black text-gray-900 hover:text-rose-600"
                  >
                    <span className="ml-1 text-rose-500">•</span>
                    {group.title}
                  </Link>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <Link
                        key={item}
                        href={storeLaptopHref(item)}
                        className="block text-xs leading-6 text-gray-500 transition hover:text-rose-600"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function readStoreCartCount() {
  if (typeof window === "undefined") return 0;
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce(
      (sum, item) => sum + Math.max(1, Number(item?.quantity || 1)),
      0,
    );
  } catch {
    return 0;
  }
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [previousUserRole, setPreviousUserRole] = useState<string | null>(null);
  const [siteMode, setSiteMode] = useState<"store" | "request">("store");
  const [cartCount, setCartCount] = useState(0);
  const [headerCategories, setHeaderCategories] = useState<CatalogCategory[]>(
    defaultCatalogCategories,
  );
  const [activeHeaderCategoryId, setActiveHeaderCategoryId] = useState(
    defaultCatalogCategories[0]?.id || "",
  );
  const router = useRouter();
  const pathname = usePathname();
  const showMobileAuthDock =
    !userRole && !["/login", "/register"].includes(pathname);

  useEffect(() => {
    // خواندن نقش کاربر از لوکال استوریج در کلاینت‌ساید
    setUserRole(localStorage.getItem("userRole"));
    setPreviousUserRole(localStorage.getItem("previousUserRole"));
    const refreshCartCount = () => setCartCount(readStoreCartCount());
    refreshCartCount();
    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("optibid-store-cart-updated", refreshCartCount);
    fetch("/api/site-mode")
      .then((response) => response.json())
      .then((result) => {
        if (result.success && (result.siteMode === "store" || result.siteMode === "request")) {
          setSiteMode(result.siteMode);
        }
      })
      .catch(() => undefined);
    fetch("/api/catalog-categories")
      .then((response) => response.json())
      .then((result) => {
        if (result.success && Array.isArray(result.categories)) {
          setHeaderCategories(result.categories);
        }
      })
      .catch(() => undefined);
    return () => {
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("optibid-store-cart-updated", refreshCartCount);
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("previousUserRole");
    sessionStorage.removeItem("redirectAfterAuth");
    setPreviousUserRole(null);
    setUserRole(null);
    // بعد از خروج از هر نقش، مستقیم به صفحه اصلی برو؛ reload مسیر داشبورد قبلی خطای «آماده نیست» می‌داد.
    window.location.replace("/");
  };

  const switchBackToBuyerMode = () => {
    localStorage.setItem("userRole", "buyer");
    localStorage.removeItem("previousUserRole");
    setUserRole("buyer");
    setPreviousUserRole(null);
    router.push("/buyer/dashboard");
    setTimeout(() => window.location.reload(), 200);
  };

  const switchBackToSellerMode = () => {
    localStorage.setItem("userRole", "seller");
    localStorage.removeItem("previousUserRole");
    setUserRole("seller");
    setPreviousUserRole(null);
    router.push("/seller/dashboard");
    setTimeout(() => window.location.reload(), 200);
  };

  const rememberLoginReturnPath = () => {
    if (
      pathname.startsWith("/requests") ||
      pathname === "/request-purchase" ||
      pathname.startsWith("/shop") ||
      pathname === "/cart"
    ) {
      const query = window.location.search || "";
      sessionStorage.setItem("redirectAfterAuth", `${pathname}${query}`);
      return;
    }
    sessionStorage.removeItem("redirectAfterAuth");
  };

  const visibleHeaderCategories = (
    siteMode === "store" ? storeLaptopCategories : headerCategories
  ).filter((category) => category.isActive !== false);
  const activeHeaderCategory =
    visibleHeaderCategories.find(
      (category) => category.id === activeHeaderCategoryId,
    ) || visibleHeaderCategories[0];
  const effectiveUserRole =
    siteMode === "store" && userRole === "seller" ? "buyer" : userRole;
  const showRoleSwitchButtons = siteMode !== "store";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50"
                  stroke="url(#blueGrad)"
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
                    id="blueGrad"
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
            </div>
            <div className="text-xl font-bold text-[#003b5c] tracking-tight max-[360px]:hidden sm:text-2xl">
              Opti<span className="text-[#00a8e8]">Bid</span>
            </div>
          </Link>            <div className="group relative hidden py-5 md:block">
              <Link
                href={siteMode === "store" ? "/shop#store-categories" : "/categories"}
                className="flex items-center gap-1 text-gray-900 hover:text-green-600 transition font-black"
              >
                <span className="text-lg leading-none">☰</span>{" "}
                {siteMode === "store" ? "دسته‌بندی لپ‌تاپ‌ها" : "دسته‌بندی کالاها"}
              </Link>
              <div className="invisible absolute right-0 top-full z-50 w-[840px] overflow-hidden rounded-3xl border border-gray-100 bg-white text-right opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                <div className="grid min-h-[420px] grid-cols-12">
                  <div className="col-span-4 max-h-[70vh] overflow-y-auto border-l border-gray-100 bg-gray-50 p-3">
                    {visibleHeaderCategories.map((category) => {
                      const active = category.id === activeHeaderCategory?.id;
                      return (
                        <Link
                          key={category.id}
                          href={siteMode === "store" ? storeLaptopHref(category.name) : categoryHref(category)}
                          onMouseEnter={() => setActiveHeaderCategoryId(category.id)}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                            active
                              ? "bg-white text-[#003b5c] shadow-sm"
                              : "text-gray-700 hover:bg-white hover:text-[#003b5c]"
                          }`}
                        >
                          <span className="text-xl">{category.icon}</span>
                          <span>{category.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="col-span-8 max-h-[70vh] overflow-y-auto p-5">
                    {activeHeaderCategory && (
                      <>
                        <Link
                          href={siteMode === "store" ? "/shop#all-laptops" : categoryHref(activeHeaderCategory)}
                          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#003b5c] hover:text-[#00a8e8]"
                        >
                          {siteMode === "store"
                            ? "همه لپ‌تاپ‌ها"
                            : `همه محصولات ${activeHeaderCategory.name}`}
                          <span>‹</span>
                        </Link>
                        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                          {activeHeaderCategory.subcategories.map((group) => (
                            <div key={group.id}>
                              <Link
                                href={siteMode === "store" ? storeLaptopHref(group.title) : categoryHref(activeHeaderCategory)}
                                className="mb-3 block border-r-2 border-red-500 pr-2 text-sm font-black text-gray-900 hover:text-[#00a8e8]"
                              >
                                {group.title}
                              </Link>
                              <div className="space-y-2">
                                {group.items.map((item) => (
                                  <Link
                                    key={item}
                                    href={siteMode === "store" ? storeLaptopHref(item) : categoryHref(activeHeaderCategory)}
                                    className="block text-xs text-gray-500 hover:text-[#00a8e8]"
                                  >
                                    {item}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5 space-x-reverse">
            {siteMode === "store" ? (
              <>
                {storeTopNavMenus.map((menu) => (
                  <StoreTopNavItem key={menu.title} menu={menu} />
                ))}
                <Link
                  href="/support"
                  className="text-gray-700 hover:text-rose-600 transition font-medium"
                >
                  پشتیبانی
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/requests"
                  className="text-gray-700 hover:text-green-600 transition font-medium"
                >
                  درخواست‌های خرید
                </Link>
                <Link
                  href="/request-board"
                  className="text-gray-700 hover:text-green-600 transition font-medium"
                >
                  تابلوی آگهی‌ها
                </Link>
                <Link
                  href="/sellers"
                  className="text-gray-700 hover:text-green-600 transition font-medium"
                >
                  فروشندگان
                </Link>
                <Link
                  href="/buyers"
                  className="text-gray-700 hover:text-green-600 transition font-medium"
                >
                  خریداران
                </Link>
                <Link
                  href="/how-it-works"
                  className="pr-6 text-gray-700 hover:text-green-600 transition font-medium"
                >
                  راهنما
                </Link>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            <Link
              href="/external-link"
              className="bg-blue-50 hover:bg-blue-100 text-[#003b5c] text-xs font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1 border border-blue-200"
              title="لینک خارجی arena.site"
            >
              🌐 arena.site
            </Link>
            <Link
              href={siteMode === "store" ? "/cart" : "/request-purchase"}
              className={`${siteMode === "store" ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-500 hover:bg-orange-600"} relative inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition`}
            >
              <span>{siteMode === "store" ? "سبد خرید" : "ثبت درخواست خرید"}</span>
              {siteMode === "store" && cartCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-xs font-black text-rose-600 shadow-sm">
                  {cartCount.toLocaleString("fa-IR")}
                </span>
              )}
            </Link>

            {userRole ? (
              <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
                {effectiveUserRole === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    پنل مدیریت
                  </Link>
                )}
                {(effectiveUserRole === "buyer" || effectiveUserRole === "seller") && (
                  <Link
                    href="/account/completion"
                    className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    تکمیل اطلاعات
                  </Link>
                )}
                {effectiveUserRole === "buyer" && (
                  <Link
                    href="/buyer/dashboard"
                    className="text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    داشبورد خریدار
                  </Link>
                )}
                {effectiveUserRole === "seller" && (
                  <Link
                    href="/seller/dashboard"
                    className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    داشبورد فروشنده
                  </Link>
                )}
                {showRoleSwitchButtons && userRole === "seller" && previousUserRole === "buyer" && (
                  <button
                    onClick={switchBackToBuyerMode}
                    className="text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    بازگشت به حالت خریدار
                  </button>
                )}
                {showRoleSwitchButtons && userRole === "buyer" && previousUserRole === "seller" && (
                  <button
                    onClick={switchBackToSellerMode}
                    className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    بازگشت به حالت فروشنده
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition font-bold text-sm flex items-center gap-1"
                >
                  خروج
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={rememberLoginReturnPath}
                  className="text-gray-700 hover:text-green-600 transition px-3 py-2 font-bold text-sm"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-bold text-sm"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          {/* Mobile quick action buttons - visible like desktop */}
          <div className="mr-auto ml-1 flex items-center gap-1 md:hidden">
            {userRole ? (
              <Link
                href={`/${effectiveUserRole === "admin" ? "admin" : effectiveUserRole}/dashboard`}
                className="rounded-lg bg-[#003b5c] px-3 py-2 text-xs font-bold text-white shadow-sm"
              >
                داشبورد
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={rememberLoginReturnPath}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg border border-gray-200 p-2 text-gray-700"
            aria-label="باز کردن منوی موبایل"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3 space-y-reverse">
              {siteMode === "store" ? (
                <>
                  <Link
                    href="/shop#mobile-store"
                    className="text-gray-700 hover:text-rose-600 transition py-2 font-bold"
                  >
                    🛍️ فروشگاه لپ‌تاپ
                  </Link>
                  <Link
                    href="/shop?use=business"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    💼 لپ‌تاپ اداری
                  </Link>
                  <Link
                    href="/shop?condition=stock"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    ♻️ لپ‌تاپ استوک
                  </Link>
                  <Link
                    href="/shop?use=gaming"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    🎮 لپ‌تاپ گیمینگ
                  </Link>
                  <Link
                    href="/shop?use=engineering"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    🧮 لپ‌تاپ مهندسی
                  </Link>
                  <Link
                    href="/shop/guides"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    📘 راهنمای خرید
                  </Link>
                  <Link
                    href="/support"
                    className="text-gray-700 hover:text-rose-600 transition py-2"
                  >
                    🎧 پشتیبانی
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 py-2 text-center font-bold text-white transition hover:bg-rose-700"
                  >
                    <span>سبد خرید</span>
                    {cartCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-xs font-black text-rose-600">
                        {cartCount.toLocaleString("fa-IR")}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/requests"
                    className="text-gray-700 hover:text-green-600 transition py-2 font-bold"
                  >
                    📋 درخواست‌های خرید
                  </Link>
                  <Link
                    href="/request-board"
                    className="text-gray-700 hover:text-green-600 transition py-2 font-bold"
                  >
                    🧭 تابلوی آگهی‌ها
                  </Link>
                  <Link
                    href="/request-purchase"
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition text-center font-bold"
                  >
                    ثبت درخواست خرید جدید
                  </Link>
                  <Link
                    href="/sellers"
                    className="text-gray-700 hover:text-green-600 transition py-2"
                  >
                    🏪 فروشندگان
                  </Link>
                  <Link
                    href="/buyers"
                    className="text-gray-700 hover:text-green-600 transition py-2"
                  >
                    🧾 خریداران
                  </Link>
                  <Link
                    href="/categories"
                    className="text-gray-700 hover:text-green-600 transition py-2"
                  >
                    📂 دسته‌بندی‌ها
                  </Link>
                </>
              )}
              <Link
                href="/external-link"
                className="text-[#003b5c] bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition font-bold"
              >
                🌐 لینک خارجی arena.site
              </Link>
              <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                <Link
                  href="/buyer/dashboard"
                  className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition flex items-center gap-2"
                >
                  <span>👤</span> داشبورد خریدار
                </Link>
                {siteMode !== "store" && (
                  <>
                    <Link
                      href="/seller/dashboard"
                      className="text-gray-700 hover:text-green-600 transition flex items-center gap-2"
                    >
                      <span>💼</span> داشبورد فروشنده
                    </Link>
                    <Link
                      href="/seller/sales"
                      className="text-gray-700 hover:text-green-600 transition flex items-center gap-2"
                    >
                      <span>💰</span> فروش‌های من (فروشنده)
                    </Link>
                  </>
                )}
                {(effectiveUserRole === "buyer" || effectiveUserRole === "seller") && (
                  <Link
                    href="/account/completion"
                    className="text-amber-700 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition flex items-center gap-2"
                  >
                    <span>🧩</span> تکمیل اطلاعات حساب
                  </Link>
                )}
                <Link
                  href="/admin/dashboard"
                  className="text-purple-700 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition flex items-center gap-2 mt-1"
                >
                  <span>👑</span> پنل مدیریت پلتفرم (ادمین)
                </Link>
              </div>
              {userRole ? (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="text-center text-sm font-bold text-gray-500 mb-2">
                    {effectiveUserRole === "admin"
                      ? "شما ادمین هستید"
                      : effectiveUserRole === "seller"
                        ? "شما فروشنده هستید"
                        : "شما خریدار هستید"}
                  </div>
                  {showRoleSwitchButtons && userRole === "seller" && previousUserRole === "buyer" && (
                    <button
                      onClick={switchBackToBuyerMode}
                      className="w-full text-center border border-green-200 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition font-bold"
                    >
                      بازگشت به حالت خریدار
                    </button>
                  )}
                  {showRoleSwitchButtons && userRole === "buyer" && previousUserRole === "seller" && (
                    <button
                      onClick={switchBackToSellerMode}
                      className="w-full text-center border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-bold"
                    >
                      بازگشت به حالت فروشنده
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-center border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-bold"
                  >
                    خروج از حساب
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t">
                  <Link
                    href="/login"
                    onClick={rememberLoginReturnPath}
                    className="flex-1 text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-bold"
                  >
                    ورود
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-bold"
                  >
                    ثبت‌نام
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      {showMobileAuthDock && (
        <div className="fixed inset-x-3 bottom-3 z-[60] grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:hidden">
          <Link
            href="/login"
            onClick={rememberLoginReturnPath}
            className="rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-extrabold text-gray-800"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-extrabold text-white"
          >
            ثبت‌نام
          </Link>
        </div>
      )}
    </header>
  );
}
