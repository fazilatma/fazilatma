import type { ImportedStoreProductDraft } from "@/lib/store-product-import";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function normalizeHeader(value: string) {
  return toEnglishDigits(value)
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s\u200c_\-]+/g, "")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanCell(value: unknown) {
  return decodeHtml(String(value || "").replace(/\s+/g, " ").trim());
}

function parseNumberToken(token: string) {
  const normalized = toEnglishDigits(token)
    .replace(/[٬،,]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return 0;
  const dotCount = (normalized.match(/\./g) || []).length;
  const cleaned = dotCount > 1 ? normalized.replace(/\./g, "") : normalized;
  const normalizedThousandsDot = /^\d{1,3}\.\d{3}(?:\D|$)/.test(`${cleaned} `)
    ? cleaned.replace(/\./g, "")
    : cleaned;
  const number = Number(normalizedThousandsDot.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function numberFromText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = toEnglishDigits(String(value || ""));
  const candidates = normalized.match(/\d[\d\s.,٬،]*/g) || [];
  const numbers = candidates.map(parseNumberToken).filter((number) => number > 0);
  return numbers.length ? Math.max(...numbers) : 0;
}

function priceToToman(value: unknown, context = "") {
  let price = numberFromText(value);
  if (!price) return 0;
  const text = `${value || ""} ${context}`.toLowerCase();
  const explicitlyRial = /ریال|rial|\birr\b/.test(text);
  const explicitlyToman = /تومان|تومن|toman|\birt\b/.test(text);
  if (explicitlyRial && !explicitlyToman) {
    price = price / 10;
  }
  return Math.round(price);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      current = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      continue;
    }
    current += char;
  }
  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function findColumn(headers: string[], patterns: RegExp[]) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
}

function safeUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return "";
  }
}

function hostFromUrl(url: string, fallback: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return fallback;
  }
}

function brandFromTitle(title: string, fallback = "Digikala") {
  const lower = title.toLowerCase();
  if (/lenovo|لنوو/.test(lower)) return "Lenovo";
  if (/dell|دل/.test(lower)) return "Dell";
  if (/asus|ایسوس/.test(lower)) return "Asus";
  if (/apple|macbook|مک|اپل|iphone|آیفون/.test(lower)) return "Apple";
  if (/hp|اچ ?پی|اچ‌پی/.test(lower)) return "HP";
  if (/samsung|سامسونگ/.test(lower)) return "Samsung";
  if (/xiaomi|شیائومی/.test(lower)) return "Xiaomi";
  if (/acer|ایسر/.test(lower)) return "Acer";
  if (/msi/.test(lower)) return "MSI";
  return fallback;
}

function categoryFromTitle(title: string) {
  const lower = title.toLowerCase();
  if (/tablet|ipad|galaxy\s*tab|redmi\s*pad|poco\s*pad|\bpad\b|تبلت|آیپد|گلکسی\s*تب/.test(lower)) return "تبلت و آیپد";
  if (/watch|wearable|ساعت هوشمند|اسمارت واچ|مچ.?بند/.test(lower)) return "ساعت هوشمند";
  if (/headset|headphone|earbud|airpods|speaker|microphone|هندزفری|هدفون|هدست|ایرباد|اسپیکر|میکروفون/.test(lower)) return "صوتی و تصویری";
  if (/power\s*bank|powerbank|پاوربانک|پاور\s*بانک|شارژر همراه|charger|شارژر|adapter|آداپتور|کابل|cable|قاب|کاور|گلس|محافظ صفحه|هولدر|پایه نگهدارنده/.test(lower)) return "لوازم جانبی کامپیوتر";
  if (/iphone|smartphone|mobile\s*phone|cell\s*phone|گوشی|موبایل|آیفون|galaxy\s*(s|a|m|z)\d|redmi\s*note|poco\s*(x|f|m|c)\d|honor\s*\d|nova\s*\d/.test(lower)) return "موبایل و گوشی";
  if (/monitor|مانیتور/.test(lower)) return "مانیتور";
  if (/printer|پرینتر|چاپگر/.test(lower)) return "پرینتر و ماشین اداری";
  if (/console|playstation|xbox|کنسول|پلی/.test(lower)) return "کنسول بازی";
  if (/ssd|hdd|hard|هارد|حافظه/.test(lower) && !/laptop|لپ/.test(lower)) return "حافظه و ذخیره‌سازی";
  if (/cpu|gpu|motherboard|ram|power\s*supply|پردازنده|کارت گرافیک|مادربرد|پاور کامپیوتر|منبع تغذیه/.test(lower)) return "قطعات کامپیوتر";
  if (/mouse|keyboard|ماوس|کیبورد|پد ماوس/.test(lower)) return "لوازم جانبی کامپیوتر";
  if (/gaming|گیم|rtx|tuf|rog|legion/.test(lower)) return "لپ‌تاپ گیمینگ";
  return "لپ‌تاپ و کامپیوتر";
}

function looksLikeStandalonePrice(value: string) {
  const text = cleanCell(value);
  const price = priceToToman(text);
  if (!price) return false;
  if (/تومان|تومن|ریال|rial|irr|irt|price|amount|cost/i.test(text)) return true;
  return price >= 1_000 && /^[0-9۰-۹٠-٩\s.,٬،]+$/.test(text);
}

function pickTitle(row: string[], columns: { title: number; price: number; url: number }) {
  if (columns.title >= 0) return cleanCell(row[columns.title]).slice(0, 180);
  const candidates = row
    .map(cleanCell)
    .filter((cell, index) => index !== columns.price && index !== columns.url)
    .filter((cell) => cell.length >= 5 && !looksLikeStandalonePrice(cell) && !safeUrl(cell));
  return (candidates.sort((a, b) => b.length - a.length)[0] || "").slice(0, 180);
}

function pickPrice(row: string[], priceIndex: number, priceHeader = "") {
  if (priceIndex >= 0) return priceToToman(row[priceIndex], priceHeader);
  return row
    .map((cell) => priceToToman(cell))
    .filter((candidate) => candidate >= 1_000)
    .sort((a, b) => b - a)[0] || 0;
}

export function parseEasyScraperCsv(
  csvText: string,
  options: { sourceLabel?: string } = {},
) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return { products: [] as ImportedStoreProductDraft[], warnings: ["فایل CSV خالی است یا فقط یک ردیف دارد."] };

  const rawHeaders = rows[0].map(cleanCell);
  const headers = rawHeaders.map((header) => normalizeHeader(header));
  const title = findColumn(headers, [/title/, /name/, /product/, /item/, /عنوان/, /نام/, /کالا/, /محصول/]);
  const price = findColumn(headers, [/price/, /amount/, /cost/, /قیمت/, /مبلغ/, /تومان/, /ریال/]);
  const originalPrice = findColumn(headers, [/oldprice/, /original/, /before/, /rrp/, /listprice/, /قیمتاصلی/, /قبل/, /خطخورده/]);
  const url = findColumn(headers, [/url/, /link/, /href/, /آدرس/, /لینک/]);
  const brand = findColumn(headers, [/brand/, /برند/, /سازنده/]);
  const category = findColumn(headers, [/category/, /cat/, /breadcrumb/, /دسته/, /گروه/]);
  const description = findColumn(headers, [/description/, /desc/, /summary/, /توضیح/, /شرح/]);
  const stock = findColumn(headers, [/stock/, /inventory/, /availability/, /موجودی/, /وضعیت/]);

  const warnings: string[] = [];
  const products: ImportedStoreProductDraft[] = [];
  const sourceLabel = options.sourceLabel || "easy-scraper";
  const priceHeader = price >= 0 ? rawHeaders[price] : "";
  const originalPriceHeader = originalPrice >= 0 ? rawHeaders[originalPrice] : "";
  if (price < 0) {
    warnings.push("ستون قیمت در CSV پیدا نشد؛ سیستم برای هر ردیف بزرگ‌ترین عدد معتبر را به‌عنوان قیمت در نظر گرفت. برای دقت کامل، نام ستون قیمت را Price، قیمت، تومان یا Rial بگذارید.");
  }

  rows.slice(1).forEach((row, index) => {
    const productUrl = url >= 0 ? safeUrl(cleanCell(row[url])) : "";
    const productTitle = pickTitle(row, { title, price, url });
    const productPrice = pickPrice(row, price, priceHeader);
    if (!productTitle || !productPrice) {
      warnings.push(`ردیف ${index + 2} به دلیل نداشتن عنوان یا قیمت معتبر نادیده گرفته شد.`);
      return;
    }
    const productOriginalPrice = originalPrice >= 0 ? priceToToman(row[originalPrice], originalPriceHeader) : 0;
    const sourceHost = hostFromUrl(productUrl, sourceLabel);
    const stockText = stock >= 0 ? cleanCell(row[stock]).toLowerCase() : "";
    const isOut = /ناموجود|out|unavailable|اتمام/.test(stockText);
    const specs: Record<string, string> = { منبع: sourceHost };
    if (price >= 0) specs["قیمت خام CSV"] = cleanCell(row[price]).slice(0, 80);
    if (productUrl) specs["لینک منبع"] = productUrl;

    products.push({
      title: productTitle,
      brand: brand >= 0 ? cleanCell(row[brand]) || brandFromTitle(productTitle) : brandFromTitle(productTitle),
      category: category >= 0 ? cleanCell(row[category]) || categoryFromTitle(productTitle) : categoryFromTitle(productTitle),
      summary: description >= 0 ? cleanCell(row[description]).slice(0, 180) || productTitle : productTitle,
      description: description >= 0 ? cleanCell(row[description]).slice(0, 900) || productTitle : productTitle,
      price: productPrice,
      originalPrice: productOriginalPrice > productPrice ? productOriginalPrice : undefined,
      stock: isOut ? 0 : 5,
      specs,
      externalSourceUrl: productUrl || `easy-scraper://${sourceLabel}/${index + 2}`,
      sourceHost,
      currency: "IRT",
    });
  });

  return { products, warnings };
}
