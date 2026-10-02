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

function numberFromText(value: unknown) {
  const normalized = toEnglishDigits(String(value || ""));
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function priceToToman(value: unknown) {
  let price = numberFromText(value);
  if (!price) return 0;
  const text = String(value || "").toLowerCase();
  if (text.includes("ریال") || text.includes("irr") || price >= 250_000_000) {
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
  if (/iphone|mobile|phone|smartphone|گوشی|موبایل|آیفون|سامسونگ|شیائومی/.test(lower)) return "موبایل و گوشی";
  if (/tablet|ipad|تبلت|آیپد/.test(lower)) return "تبلت و آیپد";
  if (/watch|ساعت/.test(lower)) return "ساعت هوشمند";
  if (/monitor|مانیتور/.test(lower)) return "مانیتور";
  if (/printer|پرینتر|چاپگر/.test(lower)) return "پرینتر و ماشین اداری";
  if (/console|playstation|xbox|کنسول|پلی/.test(lower)) return "کنسول بازی";
  if (/ssd|hdd|hard|هارد|حافظه/.test(lower) && !/laptop|لپ/.test(lower)) return "حافظه و ذخیره‌سازی";
  if (/cpu|gpu|motherboard|ram|پردازنده|کارت گرافیک|مادربرد/.test(lower)) return "قطعات کامپیوتر";
  if (/mouse|keyboard|headset|ماوس|کیبورد|هدست|هدفون/.test(lower)) return "لوازم جانبی کامپیوتر";
  if (/gaming|گیم|rtx|tuf|rog|legion/.test(lower)) return "لپ‌تاپ گیمینگ";
  return "لپ‌تاپ و کامپیوتر";
}

function pickTitle(row: string[], columns: { title: number; price: number; url: number }) {
  if (columns.title >= 0) return cleanCell(row[columns.title]).slice(0, 180);
  const candidates = row
    .map(cleanCell)
    .filter((cell, index) => index !== columns.price && index !== columns.url)
    .filter((cell) => cell.length >= 5 && !priceToToman(cell) && !safeUrl(cell));
  return (candidates.sort((a, b) => b.length - a.length)[0] || "").slice(0, 180);
}

function pickPrice(row: string[], priceIndex: number) {
  if (priceIndex >= 0) return priceToToman(row[priceIndex]);
  return row.map(priceToToman).filter(Boolean).sort((a, b) => a - b)[0] || 0;
}

export function parseEasyScraperCsv(
  csvText: string,
  options: { sourceLabel?: string } = {},
) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return { products: [] as ImportedStoreProductDraft[], warnings: ["فایل CSV خالی است یا فقط یک ردیف دارد."] };

  const headers = rows[0].map((header) => normalizeHeader(header));
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

  rows.slice(1).forEach((row, index) => {
    const productUrl = url >= 0 ? safeUrl(cleanCell(row[url])) : "";
    const productTitle = pickTitle(row, { title, price, url });
    const productPrice = pickPrice(row, price);
    if (!productTitle || !productPrice) {
      warnings.push(`ردیف ${index + 2} به دلیل نداشتن عنوان یا قیمت معتبر نادیده گرفته شد.`);
      return;
    }
    const productOriginalPrice = originalPrice >= 0 ? priceToToman(row[originalPrice]) : 0;
    const sourceHost = hostFromUrl(productUrl, sourceLabel);
    const stockText = stock >= 0 ? cleanCell(row[stock]).toLowerCase() : "";
    const isOut = /ناموجود|out|unavailable|اتمام/.test(stockText);
    const specs: Record<string, string> = { منبع: sourceHost };
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
