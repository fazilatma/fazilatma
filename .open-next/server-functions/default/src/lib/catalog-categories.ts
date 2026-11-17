export type CatalogSubcategoryGroup = {
  id: string;
  title: string;
  items: string[];
};

export type CatalogCategory = {
  id: string;
  legacyId: number;
  name: string;
  icon: string;
  isActive: boolean;
  subcategories: CatalogSubcategoryGroup[];
};

export const defaultCatalogCategories: CatalogCategory[] = [
  {
    id: "digital",
    legacyId: 1,
    name: "کالای دیجیتال",
    icon: "📱",
    isActive: true,
    subcategories: [
      { id: "digital-mobile", title: "موبایل", items: ["گوشی اپل", "گوشی سامسونگ", "گوشی شیائومی", "تبلت"] },
      { id: "digital-laptop", title: "لپ‌تاپ", items: ["لپ‌تاپ استوک", "لپ‌تاپ گیمینگ", "لپ‌تاپ اداری", "مک‌بوک"] },
      { id: "digital-parts", title: "قطعات و جانبی", items: ["RAM", "SSD", "مانیتور", "کیبورد و موس"] },
    ],
  },
  {
    id: "fashion",
    legacyId: 2,
    name: "مد و پوشاک",
    icon: "👕",
    isActive: true,
    subcategories: [
      { id: "fashion-men", title: "پوشاک مردانه", items: ["پیراهن", "شلوار", "کت", "لباس ورزشی"] },
      { id: "fashion-women", title: "پوشاک زنانه", items: ["مانتو", "شال و روسری", "کیف", "اکسسوری"] },
      { id: "fashion-shoes", title: "کفش", items: ["کفش رسمی", "کفش ورزشی", "صندل", "بوت"] },
    ],
  },
  {
    id: "home-kitchen",
    legacyId: 3,
    name: "خانه و آشپزخانه",
    icon: "🏠",
    isActive: true,
    subcategories: [
      { id: "home-appliances", title: "لوازم خانگی", items: ["یخچال", "ماشین لباسشویی", "جاروبرقی", "لوازم برقی کوچک"] },
      { id: "home-kitchenware", title: "آشپزخانه", items: ["ظروف", "قابلمه", "سرویس غذاخوری", "ابزار آشپزی"] },
      { id: "home-decor", title: "دکوراسیون", items: ["فرش", "روشنایی", "مبلمان", "پرده"] },
    ],
  },
  {
    id: "beauty-health",
    legacyId: 4,
    name: "زیبایی و سلامت",
    icon: "💄",
    isActive: true,
    subcategories: [
      { id: "beauty-cosmetics", title: "آرایشی", items: ["آرایش صورت", "آرایش چشم", "آرایش لب", "اکسسوری آرایشی"] },
      { id: "beauty-care", title: "مراقبت و سلامت", items: ["مراقبت پوست", "مراقبت مو", "مکمل", "تجهیزات پزشکی"] },
      { id: "beauty-perfume", title: "عطر و بهداشت", items: ["عطر", "دئودورانت", "بهداشت شخصی", "اصلاح"] },
    ],
  },
  {
    id: "books-stationery",
    legacyId: 5,
    name: "کتاب و لوازم تحریر",
    icon: "📚",
    isActive: true,
    subcategories: [
      { id: "books", title: "کتاب", items: ["کتاب درسی", "کتاب عمومی", "کمک‌آموزشی", "زبان"] },
      { id: "stationery", title: "نوشت‌افزار", items: ["مداد و خودکار", "دفتر", "کیف و کوله", "لوازم مهندسی"] },
      { id: "office", title: "اداری", items: ["کاغذ", "زونکن", "پرینتر", "ملزومات اداری"] },
    ],
  },
  {
    id: "sport-travel",
    legacyId: 6,
    name: "ورزش و سفر",
    icon: "⚽",
    isActive: true,
    subcategories: [
      { id: "sport", title: "ورزش", items: ["لوازم بدنسازی", "توپ", "پوشاک ورزشی", "دوچرخه"] },
      { id: "travel", title: "سفر", items: ["چمدان", "کوله", "کمپینگ", "قمقمه و فلاسک"] },
      { id: "outdoor", title: "فضای باز", items: ["کوهنوردی", "ماهیگیری", "چادر", "کیسه خواب"] },
    ],
  },
  {
    id: "toys-kids",
    legacyId: 7,
    name: "اسباب‌بازی و کودک",
    icon: "🧸",
    isActive: true,
    subcategories: [
      { id: "toys", title: "اسباب‌بازی", items: ["بازی فکری", "عروسک", "ماشین بازی", "لگو"] },
      { id: "baby", title: "کودک و نوزاد", items: ["سیسمونی", "کالسکه", "صندلی کودک", "پوشاک کودک"] },
      { id: "kids-learning", title: "آموزشی", items: ["کتاب کودک", "لوازم مدرسه", "بازی آموزشی", "وسایل نقاشی"] },
    ],
  },
  {
    id: "auto-moto",
    legacyId: 8,
    name: "خودرو و موتور",
    icon: "🚗",
    isActive: true,
    subcategories: [
      { id: "auto-parts", title: "قطعات", items: ["لوازم یدکی", "لاستیک", "روغن و مصرفی", "باتری"] },
      { id: "auto-accessories", title: "لوازم جانبی", items: ["ابزار خودرو", "سیستم صوتی", "روکش", "تجهیزات ایمنی"] },
      { id: "moto", title: "موتور", items: ["قطعات موتور", "کلاه ایمنی", "لوازم مصرفی", "اکسسوری"] },
    ],
  },
];

const slug = (value: string, fallback: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff_-]/g, "")
    .slice(0, 48);
  return normalized || fallback;
};

export function normalizeCatalogCategories(value: unknown): CatalogCategory[] {
  if (!Array.isArray(value) || value.length === 0) return defaultCatalogCategories;
  const result: CatalogCategory[] = [];
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const source = item as Partial<CatalogCategory>;
    const name = String(source.name || "").trim().slice(0, 80);
    if (!name) return;
    const id = slug(String(source.id || name), `category-${index + 1}`);
    const subcategories = Array.isArray(source.subcategories)
      ? source.subcategories
          .map((group, groupIndex) => {
            if (!group || typeof group !== "object") return null;
            const groupSource = group as Partial<CatalogSubcategoryGroup>;
            const title = String(groupSource.title || "").trim().slice(0, 80);
            if (!title) return null;
            const items = Array.isArray(groupSource.items)
              ? groupSource.items
                  .map((subItem) => String(subItem || "").trim().slice(0, 80))
                  .filter(Boolean)
                  .slice(0, 24)
              : [];
            return {
              id: slug(String(groupSource.id || title), `${id}-sub-${groupIndex + 1}`),
              title,
              items,
            };
          })
          .filter((group): group is CatalogSubcategoryGroup => Boolean(group))
          .slice(0, 12)
      : [];

    result.push({
      id,
      legacyId: Number(source.legacyId || index + 1),
      name,
      icon: String(source.icon || "📦").trim().slice(0, 8) || "📦",
      isActive: source.isActive !== false,
      subcategories,
    });
  });
  return result.length ? result : defaultCatalogCategories;
}

export function categoryHref(category: Pick<CatalogCategory, "legacyId" | "id">) {
  return `/categories/${category.legacyId || category.id}`;
}
