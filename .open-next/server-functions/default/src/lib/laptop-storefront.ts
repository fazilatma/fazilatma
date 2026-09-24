import type { JsonStoreProduct } from "@/lib/json-store";

export type LaptopCategoryItem = {
  title: string;
  href: string;
  badge?: string;
};

export type LaptopGuideItem = {
  slug: string;
  title: string;
  shortTitle: string;
  text: string;
  href: string;
  shopHref?: string;
  accent: "blue" | "emerald" | "amber" | "rose";
  icon:
    | "briefcase"
    | "student"
    | "engineering"
    | "gaming"
    | "test"
    | "settings"
    | "battery"
    | "shipping"
    | "payment"
    | "support";
  keywords: string[];
  checklist: string[];
};

export type LaptopCollectionItem = {
  slug: "growing" | "best-selling" | "special-offers";
  title: string;
  shortTitle: string;
  subtitle: string;
  href: string;
  badge: string;
  accent: "emerald" | "blue" | "rose";
  icon: "trend" | "fire" | "sale";
};

export const laptopCategoryItems: LaptopCategoryItem[] = [
  { title: "لپ‌تاپ لنوو", href: "/shop?brand=Lenovo", badge: "Lenovo" },
  { title: "لپ‌تاپ اچ‌پی", href: "/shop?brand=HP", badge: "HP" },
  { title: "لپ‌تاپ دل", href: "/shop?brand=Dell", badge: "Dell" },
  { title: "لپ‌تاپ ایسوس", href: "/shop?brand=Asus", badge: "Asus" },
  { title: "مک‌بوک اپل", href: "/shop?brand=Apple", badge: "Apple" },
  { title: "لپ‌تاپ استوک", href: "/shop?condition=stock", badge: "Stock" },
  { title: "لپ‌تاپ کارکرده تمیز", href: "/shop?condition=used", badge: "Clean" },
  { title: "لپ‌تاپ سبک", href: "/shop?use=student&display=14", badge: "Light" },
  { title: "لپ‌تاپ لمسی", href: "/shop?touch=yes", badge: "Touch" },
  { title: "لپ‌تاپ گیمینگ", href: "/shop?use=gaming", badge: "RTX" },
  { title: "لپ‌تاپ اداری", href: "/shop?use=business", badge: "Office" },
  { title: "لپ‌تاپ دانشجویی", href: "/shop?use=student", badge: "Student" },
  { title: "لپ‌تاپ مهندسی", href: "/shop?use=engineering", badge: "CAD" },
  { title: "برنامه‌نویسی", href: "/shop?use=business&ram=16GB", badge: "Dev" },
  { title: "تدوین و طراحی", href: "/shop?use=engineering&gpuType=dedicated", badge: "Design" },
  { title: "رم ۱۶ گیگ", href: "/shop?ram=16GB", badge: "16GB" },
  { title: "SSD 512GB", href: "/shop?ssd=512GB", badge: "SSD" },
  { title: "Core i7", href: "/shop?cpu=i7", badge: "i7" },
  { title: "گرافیک RTX", href: "/shop?gpuType=rtx", badge: "RTX" },
  { title: "اقتصادی", href: "/shop?maxPrice=45000000", badge: "Budget" },
  { title: "حرفه‌ای", href: "/shop?minPrice=60000000", badge: "Pro" },
];

export const laptopGuideItems: LaptopGuideItem[] = [
  {
    slug: "business",
    title: "کار اداری و حسابداری",
    shortTitle: "اداری و حسابداری",
    text: "Core i5، رم ۱۶GB و SSD برای سرعت پایدار روزانه کافی است.",
    href: "/shop/guides/business",
    accent: "blue",
    icon: "briefcase",
    keywords: ["اداری", "شرکتی", "business", "حسابداری", "برنامه"],
    checklist: [
      "پردازنده Core i5 یا Core i7 کم‌مصرف",
      "رم ۱۶ گیگابایت برای اجرای همزمان نرم‌افزارها",
      "حافظه SSD حداقل ۵۱۲ گیگابایت",
      "بدنه مقاوم و کیبورد راحت برای کار طولانی",
    ],
  },
  {
    slug: "student",
    title: "دانشجو و حمل روزانه",
    shortTitle: "دانشجویی و سبک",
    text: "وزن کم، باتری سالم و نمایشگر ۱۳ تا ۱۴ اینچ اولویت دارد.",
    href: "/shop/guides/student",
    accent: "emerald",
    icon: "student",
    keywords: ["دانشجویی", "student", "سبک", "روزمره", "باتری"],
    checklist: [
      "وزن کمتر برای حمل روزانه",
      "باتری سالم و شارژدهی قابل قبول",
      "SSD سریع برای بالا آمدن سریع سیستم",
      "نمایشگر با کیفیت برای کلاس و مطالعه",
    ],
  },
  {
    slug: "engineering",
    title: "مهندسی و طراحی",
    shortTitle: "مهندسی و طراحی",
    text: "پردازنده قوی‌تر، رم بالاتر و در صورت نیاز گرافیک مجزا انتخاب کنید.",
    href: "/shop/guides/engineering",
    accent: "amber",
    icon: "engineering",
    keywords: ["مهندسی", "workstation", "مهندس", "رندر", "طراحی", "تدوین"],
    checklist: [
      "پردازنده Core i7 یا Ryzen 7 برای نرم‌افزارهای سنگین",
      "رم حداقل ۱۶ گیگابایت و ترجیحاً قابل ارتقا",
      "گرافیک مجزا برای طراحی سه‌بعدی و رندر",
      "حافظه SSD پرسرعت برای پروژه‌های حجیم",
    ],
  },
  {
    slug: "gaming",
    title: "گیمینگ و تدوین",
    shortTitle: "گیمینگ و تدوین",
    text: "کارت گرافیک RTX، خنک‌کنندگی مناسب و نمایشگر ۱۴۴Hz مهم است.",
    href: "/shop/guides/gaming",
    accent: "rose",
    icon: "gaming",
    keywords: ["گیمینگ", "gaming", "rtx", "بازی", "144", "تدوین"],
    checklist: [
      "کارت گرافیک RTX برای بازی و تدوین",
      "سیستم خنک‌کننده قوی برای کار طولانی",
      "نمایشگر با نرخ نوسازی بالا",
      "SSD یک ترابایت برای بازی‌ها و فایل‌های حجیم",
    ],
  },
  {
    slug: "health-check",
    title: "مهلت تست و بررسی سلامت لپ‌تاپ",
    shortTitle: "بررسی سلامت",
    text: "قبل از خرید، سلامت باتری، نمایشگر، پورت‌ها، کیبورد، بدنه و قطعات اصلی را بررسی کنید.",
    href: "/shop/guides/health-check",
    shopHref: "/shop?condition=stock&ref=guide-health-check",
    accent: "emerald",
    icon: "test",
    keywords: ["استوک", "کارکرده", "مهلت تست", "سلامت", "باتری", "نمایشگر"],
    checklist: [
      "وضعیت باتری و شارژدهی واقعی بررسی شود",
      "نمایشگر از نظر پیکسل سوخته، خط، هاله و نور یکنواخت کنترل شود",
      "پورت‌ها، کیبورد، تاچ‌پد، وب‌کم و اسپیکر تست شوند",
      "مشخصات واقعی CPU، RAM، SSD و گرافیک با آگهی تطبیق داده شود",
    ],
  },
  {
    slug: "spec-comparison",
    title: "مقایسه کانفیگ واقعی لپ‌تاپ",
    shortTitle: "مقایسه کانفیگ",
    text: "پردازنده، رم، SSD، گرافیک و نسل قطعات را با نیاز واقعی خود تطبیق دهید.",
    href: "/shop/guides/spec-comparison",
    shopHref: "/shop?ram=16GB&ssd=512GB&ref=guide-spec-comparison",
    accent: "blue",
    icon: "settings",
    keywords: ["core i5", "core i7", "ryzen", "16gb", "512gb", "ssd", "گرافیک"],
    checklist: [
      "برای کار روزمره Core i5 و رم ۱۶ گیگ معمولاً کافی است",
      "برای طراحی و تدوین، گرافیک مجزا و رم بالاتر ارزش بیشتری دارد",
      "برای سرعت سیستم، SSD از ظرفیت HDD مهم‌تر است",
      "نسل پردازنده و نوع رم را با قیمت نهایی مقایسه کنید",
    ],
  },
  {
    slug: "battery",
    title: "راهنمای باتری و شارژدهی لپ‌تاپ",
    shortTitle: "باتری و شارژدهی",
    text: "برای حمل روزانه، سلامت باتری، وزن دستگاه و اندازه نمایشگر اهمیت زیادی دارد.",
    href: "/shop/guides/battery",
    shopHref: "/shop?use=student&display=14&battery=long&ref=guide-battery",
    accent: "emerald",
    icon: "battery",
    keywords: ["دانشجویی", "سبک", "باتری", "14", "13.3", "شارژدهی"],
    checklist: [
      "برای دانشگاه و رفت‌وآمد، وزن کمتر از ۱.۵ کیلوگرم بهتر است",
      "سلامت باتری مدل‌های کارکرده حتماً بررسی شود",
      "نمایشگر ۱۳ تا ۱۴ اینچ حمل روزانه را آسان‌تر می‌کند",
      "شارژر اصلی و پورت شارژ باید تست شود",
    ],
  },
  {
    slug: "shipping",
    title: "ارسال قابل پیگیری سفارش لپ‌تاپ",
    shortTitle: "ارسال و پیگیری",
    text: "بعد از ثبت سفارش، وضعیت ارسال، هماهنگی تحویل و پیگیری سفارش باید شفاف باشد.",
    href: "/shop/guides/shipping",
    shopHref: "/support?ref=guide-shipping#online-support",
    accent: "amber",
    icon: "shipping",
    keywords: ["لپ‌تاپ", "ارسال", "پشتیبانی", "سفارش", "تحویل"],
    checklist: [
      "آدرس و شماره تماس گیرنده سفارش دقیق ثبت شود",
      "بسته‌بندی محافظ برای لپ‌تاپ ضروری است",
      "کد یا مسیر پیگیری ارسال را از پشتیبانی دریافت کنید",
      "در زمان تحویل، وضعیت ظاهری بسته بررسی شود",
    ],
  },
  {
    slug: "payment",
    title: "پرداخت امن خرید لپ‌تاپ",
    shortTitle: "پرداخت امن",
    text: "برای خرید مطمئن، قیمت نهایی، روش پرداخت و اطلاعات سفارش را قبل از پرداخت کنترل کنید.",
    href: "/shop/guides/payment",
    shopHref: "/cart?ref=guide-payment",
    accent: "blue",
    icon: "payment",
    keywords: ["لپ‌تاپ", "قیمت", "پرداخت", "سبد خرید", "سفارش"],
    checklist: [
      "قیمت نهایی و تعداد کالا قبل از پرداخت بررسی شود",
      "مدل، کانفیگ و شرایط تست را دوباره کنترل کنید",
      "از مسیرهای پرداخت فعال سایت استفاده کنید",
      "رسید پرداخت و شماره سفارش را نگه دارید",
    ],
  },
  {
    slug: "advice",
    title: "مشاوره انتخاب مدل لپ‌تاپ",
    shortTitle: "مشاوره خرید",
    text: "اگر بین چند مدل مردد هستید، بر اساس بودجه، کاربری و اولویت‌ها بهترین گزینه را انتخاب کنید.",
    href: "/shop/guides/advice",
    shopHref: "/support?ref=guide-advice#online-support",
    accent: "rose",
    icon: "support",
    keywords: ["لپ‌تاپ", "اداری", "دانشجویی", "مهندسی", "گیمینگ", "مشاوره"],
    checklist: [
      "بودجه و نوع استفاده اصلی خود را مشخص کنید",
      "بین مدل نو، استوک و کارکرده تمیز مقایسه انجام دهید",
      "حداقل رم، حافظه و پردازنده مورد نیازتان را تعیین کنید",
      "اگر مردد هستید، از پشتیبانی برای انتخاب نهایی کمک بگیرید",
    ],
  },
];

export function getLaptopGuide(slug: string) {
  return laptopGuideItems.find((guide) => guide.slug === slug) || null;
}

export const laptopCollectionItems: LaptopCollectionItem[] = [
  {
    slug: "growing",
    title: "محصولات در حال رشد",
    shortTitle: "در حال رشد",
    subtitle:
      "مدل‌هایی که با توجه به تقاضای بازار لپ‌تاپ، مشخصات فنی و جذابیت قیمت، رشد توجه بیشتری دارند.",
    href: "/shop/collections/growing",
    badge: "رشد تقاضا",
    accent: "emerald",
    icon: "trend",
  },
  {
    slug: "best-selling",
    title: "محصولات پرفروش",
    shortTitle: "پرفروش",
    subtitle:
      "لپ‌تاپ‌هایی که برای کار اداری، دانشجویی و حرفه‌ای بیشترین انتخاب و بازدید را می‌گیرند.",
    href: "/shop/collections/best-selling",
    badge: "پرفروش",
    accent: "blue",
    icon: "fire",
  },
  {
    slug: "special-offers",
    title: "فروش ویژه",
    shortTitle: "فروش ویژه",
    subtitle:
      "مدل‌هایی با قیمت جذاب‌تر، تخفیف بیشتر و فرصت خرید بهتر برای شروع سریع‌تر.",
    href: "/shop/collections/special-offers",
    badge: "تخفیف ویژه",
    accent: "rose",
    icon: "sale",
  },
];

export function getLaptopCollection(slug: string) {
  return laptopCollectionItems.find((collection) => collection.slug === slug) || null;
}

export function storeProductDiscountPercent(product: JsonStoreProduct) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

function normalizedProductText(product: JsonStoreProduct) {
  return `${product.title} ${product.brand} ${product.category} ${product.summary} ${product.description} ${product.badges.join(" ")} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();
}

function growthScore(product: JsonStoreProduct) {
  const text = normalizedProductText(product);
  let score = product.rating * 12 + product.reviewsCount / 2;
  if (text.includes("rtx")) score += 28;
  if (text.includes("گیمینگ") || text.includes("مهندسی")) score += 18;
  if (text.includes("core i7") || text.includes("ryzen 7")) score += 14;
  if (text.includes("apple") || text.includes("m1") || text.includes("macbook")) score += 12;
  if (text.includes("16gb") || text.includes("1tb")) score += 8;
  score += storeProductDiscountPercent(product) * 1.5;
  return score;
}

export function getLaptopCollectionProducts(
  products: JsonStoreProduct[],
  slug: LaptopCollectionItem["slug"] | string,
) {
  const activeProducts = products.filter(
    (product) => product.isActive !== false && product.stock > 0,
  );

  if (slug === "growing") {
    return [...activeProducts].sort((a, b) => growthScore(b) - growthScore(a));
  }

  if (slug === "best-selling") {
    return [...activeProducts].sort(
      (a, b) =>
        b.reviewsCount - a.reviewsCount ||
        b.rating - a.rating ||
        Number(b.isFeatured) - Number(a.isFeatured),
    );
  }

  if (slug === "special-offers") {
    return [...activeProducts]
      .filter((product) => storeProductDiscountPercent(product) > 0)
      .sort(
        (a, b) =>
          storeProductDiscountPercent(b) - storeProductDiscountPercent(a) ||
          b.reviewsCount - a.reviewsCount,
      );
  }

  return activeProducts;
}
