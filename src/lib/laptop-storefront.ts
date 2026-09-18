export type LaptopCategoryItem = {
  title: string;
  href: string;
  badge?: string;
};

export type LaptopGuideItem = {
  slug: "business" | "student" | "engineering" | "gaming";
  title: string;
  shortTitle: string;
  text: string;
  href: string;
  accent: "blue" | "emerald" | "amber" | "rose";
  icon: "briefcase" | "student" | "engineering" | "gaming";
  keywords: string[];
  checklist: string[];
};

export const laptopCategoryItems: LaptopCategoryItem[] = [
  { title: "لپ‌تاپ لنوو", href: "/shop?brand=Lenovo", badge: "Lenovo" },
  { title: "لپ‌تاپ اچ‌پی", href: "/shop?brand=HP", badge: "HP" },
  { title: "لپ‌تاپ دل", href: "/shop?brand=Dell", badge: "Dell" },
  { title: "لپ‌تاپ ایسوس", href: "/shop?brand=Asus", badge: "Asus" },
  { title: "مک‌بوک اپل", href: "/shop?brand=Apple", badge: "Apple" },
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
];

export function getLaptopGuide(slug: string) {
  return laptopGuideItems.find((guide) => guide.slug === slug) || null;
}
