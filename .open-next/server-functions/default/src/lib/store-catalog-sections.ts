import type { JsonStoreProduct } from "@/lib/json-store";
import { isStorefrontEligibleComputerPart } from "@/lib/store-computer-part-kind";
import { productImportCategoryKey } from "@/lib/store-product-import";

function productText(product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">) {
  return `${product.title} ${product.brand} ${product.category} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();
}

export function isLaptopCatalogProduct(
  product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">,
) {
  const text = productText(product);
  // نگهبان نمایش: کالایی که نام قطعه در عنوان/دستهٔ آن آمده و واژهٔ لپ‌تاپ ندارد،
  // هرگز در دستهٔ لپ‌تاپ نمایش داده نمی‌شود (مثل «مادربرد گیگابایت AORUS B760»).
  const explicitLaptop = /لپ ?تاپ|لپ‌تاپ|lپتاپ|laptop|notebook|macbook|ultrabook|نوت ?بوک/.test(
    `${product.title} ${product.category}`.toLowerCase(),
  );
  const partNamed = /مادربرد|motherboard|کارت گرافیک|هارد|\bssd\b|\bhdd\b|\bnvme\b|رم کامپیوتر|حافظه رم|منبع تغذیه|پاور کامپیوتر|کیس کامپیوتر/.test(
    `${product.title} ${product.category}`.toLowerCase(),
  );
  if (partNamed && !explicitLaptop) return false;
  const key = productImportCategoryKey(product);
  return key === "laptop" || (key === "gaming" && /لپ|laptop|notebook|macbook|thinkpad|ideapad|victus|tuf|rog|legion/.test(text));
}

export function isComputerPartsCatalogProduct(
  product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">,
) {
  const text = productText(product);
  const key = productImportCategoryKey(product);
  // اگر کالا واقعاً یک لپ‌تاپ است، نباید در دستهٔ قطعات بیاید (حتی اگر در عنوانش
  // از هارد/SSD/پردازنده حرف زده باشد). رم و هاردی که با «رم لپ‌تاپ» یا
  // «مخصوص لپ‌تاپ» شروع می‌شوند در isLaptopCatalogProduct رد می‌شوند.
  if (isLaptopCatalogProduct(product)) return false;
  const explicitComputerPart = /قطعات کامپیوتر|پردازنده|\bcpu\b|کارت گرافیک|\bgpu\b|مادربرد|\bram\b|حافظه رم|رم کامپیوتر|رم دسکتاپ|ماژول رم|\bssd\b|اس\s*اس\s*دی|\bnvme\b|هارد(?:دیسک)?\s*(?:اینترنال|اکسترنال)|پاور کامپیوتر|منبع تغذیه|کیس کامپیوتر|خنک.?کننده پردازنده|فن کیس|خمیر سیلیکون/.test(text);
  if (explicitComputerPart) return true;
  return key === "components" || key === "storage";
}

/**
 * آیا عنوان/دستهٔ کالا شبیه لپ‌تاپ است؟ (فقط برای عیب‌یابی و شمارش)
 * این تابع تصمیم نمایش نمی‌گیرد؛ فقط نشان می‌دهد چه کالاهایی از نظر کاربر
 * «لپ‌تاپ» به حساب می‌آیند تا بتوانیم موارد جاافتاده را پیدا کنیم.
 */
const laptopLookingPattern =
  /لپ ?تاپ|لپ‌تاپ|lپتاپ|laptop|notebook|نوت ?بوک|ultrabook|macbook|مک ?بوک|thinkpad|thinkbook|ideapad|elitebook|probook|vivobook|zenbook|expertbook|victus|legion|nitro|aspire|latitude|inspiron|pavilion|omen|spectre|envy|surface|galaxy ?book|lg ?gram|aorus|razer ?blade|strix|zephyrus|ideapad|swift|travelmate|matebook/i;

export function looksLikeLaptopProduct(
  product: Pick<JsonStoreProduct, "title" | "category">,
) {
  return laptopLookingPattern.test(`${product.title} ${product.category}`);
}

/**
 * دسته‌های دیگر منوی سایت (لوازم جانبی، کنسول، شبکه، ماشین‌های اداری، کامپیوتر
 * آماده). قبلاً این پارامترها نادیده گرفته می‌شدند و لینک‌هایی مثل
 * `/shop?category=console` کل کاتالوگ را نشان می‌دادند.
 */
const catalogCategoryMatchers: Record<string, { keys: string[]; pattern?: RegExp }> = {
  accessories: { keys: ["accessories"] },
  console: { keys: ["console"], pattern: /کنسول|playstation|xbox|nintendo|دسته بازی/ },
  network: { keys: ["network"] },
  "office-machines": { keys: ["printer"], pattern: /پرینتر|پرینت|اسکنر|کارتریج|تونر|بارکد|پروژکتور/ },
  "ready-pc": {
    keys: ["desktop"],
    pattern: /کیس آماده|کامپیوتر آماده|all\s?in\s?one|آل\s?این\s?وان|mini\s?pc|مینی\s?پی\s?سی|ورک\s?استیشن|workstation/,
  },
  mobile: { keys: ["mobile"] },
  tablet: { keys: ["tablet"] },
  storage: { keys: ["storage"] },
  monitor: { keys: ["monitor"] },
};

/** آیا کالا با دستهٔ درخواستی (به‌جز لپ‌تاپ و قطعات که منطق جدا دارند) می‌خواند؟ */
export function matchesStoreCatalogCategory(
  product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">,
  slug: string,
) {
  const matcher = catalogCategoryMatchers[slug.trim().toLowerCase()];
  // دستهٔ ناشناس: رفتار قبلی حفظ می‌شود و فیلتری اعمال نمی‌شود.
  if (!matcher) return true;
  if (matcher.keys.includes(productImportCategoryKey(product))) return true;
  return Boolean(matcher.pattern && matcher.pattern.test(productText(product)));
}

function storefrontTitleKey(product: JsonStoreProduct) {
  return product.title
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .toLowerCase()
    .replace(/[‌\s]+/g, " ")
    .replace(/[^a-z0-9آ-ی]+/g, " ")
    .trim();
}

export function dedupeStorefrontCatalogProducts(products: JsonStoreProduct[]) {
  const output: JsonStoreProduct[] = [];
  const indexByTitle = new Map<string, number>();
  for (const product of products) {
    const key = storefrontTitleKey(product);
    const existingIndex = indexByTitle.get(key);
    if (existingIndex === undefined) {
      indexByTitle.set(key, output.length);
      output.push(product);
      continue;
    }
    const existing = output[existingIndex];
    const cheaper = product.price > 0 && product.price < existing.price ? product : existing;
    const richer = Object.keys(product.specs || {}).length > Object.keys(existing.specs || {}).length
      ? product
      : existing;
    output[existingIndex] = {
      ...richer,
      price: cheaper.price,
      marketPrice: cheaper.marketPrice,
      priceMultiplier: cheaper.priceMultiplier,
      originalPrice: cheaper.originalPrice,
      priceUpdatedAt: cheaper.priceUpdatedAt,
      shippingNote: cheaper.shippingNote,
      externalSourceUrl: cheaper.externalSourceUrl || richer.externalSourceUrl,
      imageUrl: richer.imageUrl || cheaper.imageUrl,
      stock: Math.max(existing.stock || 0, product.stock || 0),
    };
  }
  return output;
}

export function filterProductsByCatalogSections(
  products: JsonStoreProduct[],
  settings: { laptopEnabled: boolean; computerPartsEnabled: boolean },
) {
  const visibleComputerPart = (product: JsonStoreProduct) =>
    isComputerPartsCatalogProduct(product) && isStorefrontEligibleComputerPart(product);
  let filtered: JsonStoreProduct[] = [];
  if (settings.laptopEnabled && settings.computerPartsEnabled) {
    filtered = products.filter((product) => isLaptopCatalogProduct(product) || visibleComputerPart(product));
  } else if (settings.laptopEnabled) {
    filtered = products.filter(isLaptopCatalogProduct);
  } else if (settings.computerPartsEnabled) {
    filtered = products.filter(visibleComputerPart);
  }
  return dedupeStorefrontCatalogProducts(filtered);
}
