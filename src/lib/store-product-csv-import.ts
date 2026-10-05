import { getWindows1256ByteForChar } from "@/lib/windows-1256";
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

function persianLetterCount(value: string) {
  let count = 0;
  for (const char of value) {
    const code = char.codePointAt(0) || 0;
    if (code >= 0x0600 && code <= 0x06ff) count += 1;
  }
  return count;
}

function mojibakeSignal(value: string) {
  const sequenceCount = value.match(/(?:ط§|ط¨|طھ|ط±|ط¯|ط³|ط¹|ط¬|ط²|ط©|طŒ|ط،|ط؛|ظ„|ظ…|ظ†|ظ‡|ظ¾|ظƒ|ظک|غŒ|ع†|ع©|آ«|آ»)/g)?.length || 0;
  const westernCount = value.match(/[ØÙÛÃÂ]/g)?.length || 0;
  const denseArabicCount = value.match(/[طظغع][؀-ۿ]/g)?.length || 0;
  return sequenceCount * 5 + westernCount * 4 + denseArabicCount;
}

function decodeUtf8Bytes(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return "";
  }
}

function repairLatin1Mojibake(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) || 0;
    if (code > 255) return "";
    bytes.push(code);
  }
  return decodeUtf8Bytes(new Uint8Array(bytes));
}

function repairWindows1256Mojibake(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const byte = getWindows1256ByteForChar(char);
    if (byte === undefined) return "";
    bytes.push(byte);
  }
  return decodeUtf8Bytes(new Uint8Array(bytes));
}

function chooseMojibakeRepair(original: string, repaired: string) {
  if (!repaired || repaired === original || repaired.includes("�")) return original;
  const originalSignal = mojibakeSignal(original);
  if (originalSignal < 2) return original;
  const repairedSignal = mojibakeSignal(repaired);
  if (repairedSignal >= originalSignal) return original;
  if (persianLetterCount(repaired) < Math.max(1, Math.floor(persianLetterCount(original) / 4))) return original;
  return repaired;
}

function repairMojibake(value: string) {
  const latin1Fixed = chooseMojibakeRepair(value, repairLatin1Mojibake(value));
  if (latin1Fixed !== value) return latin1Fixed;
  return chooseMojibakeRepair(value, repairWindows1256Mojibake(value));
}

function cleanCell(value: unknown) {
  const cleaned = decodeHtml(String(value || "").replace(/\s+/g, " ").trim());
  return repairMojibake(cleaned);
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
  if (/dell|(^|[\s،,\-])دل($|[\s،,\-])/.test(lower)) return "Dell";
  if (/asus|ایسوس/.test(lower)) return "Asus";
  if (/apple|macbook|مک|اپل|iphone|آیفون/.test(lower)) return "Apple";
  if (/hp|اچ ?پی|اچ‌پی/.test(lower)) return "HP";
  if (/samsung|سامسونگ/.test(lower)) return "Samsung";
  if (/xiaomi|شیائومی/.test(lower)) return "Xiaomi";
  if (/acer|ایسر/.test(lower)) return "Acer";
  if (/msi/.test(lower)) return "MSI";
  return fallback;
}

function textMatchesLaptop(lower: string) {
  const explicitLaptopWords = /laptop|notebook|ultrabook|chromebook|macbook|لپ\s?تاپ|لپ‌تاپ|لپتاپ|نوت\s?بوک|نوت‌بوک|اولترابوک|الترابوک|کروم\s?بوک|مک\s?بوک/.test(lower);
  const laptopSeries = /thinkpad|thinkbook|ideapad|legion|lenovo\s*loq|yoga|vivobook|zenbook|expertbook|proart|asus\s*tuf|rog\s*(strix|zephyrus|flow)?|latitude|inspiron|vostro|xps\s*\d|precision|alienware|elitebook|probook|pavilion|envy|victus|omen|zbook|spectre|aspire|nitro|predator|swift|travelmate|msi\s*(modern|cyborg|katana|thin|pulse|vector|raider|stealth|prestige|summit|bravo|creator|venturepro)|modern\s*\d|cyborg\s*\d|katana\s*\d|venturepro\s*\d|matebook|surface\s*laptop|galaxy\s*book|lg\s*gram|aorus|gigabyte\s*(g5|g6|aero)|razer\s*blade/.test(lower);
  const laptopScreenSize = /(?:11\.6|12\.5|13(?:\.3|\.4|\.5)?|14(?:\.0)?|15(?:\.6)?|16(?:\.0)?|17(?:\.3)?|18(?:\.0)?)\s*(?:inch|اینچ|اینچی)/.test(lower);
  const laptopSpecs = /core\s*(?:i[3579]|ultra|3|5|7|9)|ryzen\s*[3579]|celeron|pentium|intel|amd|rtx\s*\d{3,4}|gtx\s*\d{3,4}|mx\s*\d{3}|iris\s*xe|radeon|رم\s*\d|\d+\s*gb\s*(?:ram|ddr)|ssd|nvme|پردازنده|گرافیک/.test(lower);
  return explicitLaptopWords || laptopSeries || (laptopScreenSize && laptopSpecs);
}

function categoryFromTitle(title: string) {
  const lower = title.toLowerCase();
  if (/tablet|ipad|galaxy\s*tab|redmi\s*pad|poco\s*pad|(^|\s)pad(\s|$)|تبلت|آیپد|گلکسی\s*تب/.test(lower)) return "تبلت و آیپد";
  if (/watch|wearable|ساعت هوشمند|اسمارت واچ|مچ.?بند/.test(lower)) return "ساعت هوشمند";
  if (/headset|headphone|earbud|earphone|airpods|speaker|microphone|هندزفری|هدفون|هدست|ایرباد|ایرپاد|اسپیکر|میکروفون/.test(lower)) return "صوتی و تصویری";
  if (/power\s*bank|powerbank|پاوربانک|پاور\s*بانک|شارژر همراه|charger|شارژر|adapter|آداپتور|کابل|cable|قاب(?!ل)|کاور|گلس|محافظ صفحه|هولدر|پایه نگهدارنده|کیف|کوله|bag|sleeve|stand|استند|پایه خنک|cooling\s*pad|کول\s*پد|فن خنک|لوازم جانبی/.test(lower)) return "لوازم جانبی کامپیوتر";

  const explicitPhoneWords = /iphone|آیفون|smartphone|mobile\s*phone|cell\s*phone|گوشی|موبایل/.test(lower);
  const samsungGalaxyPhone = /galaxy\s*(s|a|m|z)\s*\d|گلکسی\s*(s|a|m|z)?\s*\d|سامسونگ.*(s|a|m|z)\s*\d{2}/.test(lower);
  const xiaomiPhone = /redmi\s*(note\s*)?\d|ردمی\s*(نوت\s*)?\d|redmi\s*a\s*\d|poco\s*(x|f|m|c)\s*\d|پوکو\s*(x|f|m|c)?\s*\d|xiaomi\s*(mi\s*)?\d{2}|شیائومی.*(redmi|ردمی|poco|پوکو|\d{2})/.test(lower);
  const honorHuaweiPhone = /honor\s*(x|magic|play)?\s*\d|آنر\s*(x|ایکس|magic|مجیک|play|پلی)?\s*\d|huawei\s*(nova|y|p|mate)\s*\d|هواوی\s*(نوا|y|p|mate|میت)\s*\d/.test(lower);
  const otherPhoneSeries = /nokia\s*\d|نوکیا\s*\d|moto\s*g\s*\d|motorola\s*(edge|g)\s*\d|موتورولا|realme\s*(c|gt|note|narzo)?\s*\d|ریلمی|oneplus|وان\s*پلاس|nothing\s*phone|infinix|اینفینیکس|tecno|تکنو/.test(lower);
  if (explicitPhoneWords || samsungGalaxyPhone || xiaomiPhone || honorHuaweiPhone || otherPhoneSeries) return "موبایل و گوشی";
  if (textMatchesLaptop(lower) && /gaming|گیم|rtx|tuf|rog|legion|katana|cyborg|victus|omen|nitro|predator/.test(lower)) return "لپ‌تاپ گیمینگ";
  if (textMatchesLaptop(lower)) return "لپ‌تاپ و کامپیوتر";

  if (/monitor|مانیتور/.test(lower)) return "مانیتور";
  if (/printer|پرینتر|چاپگر/.test(lower)) return "پرینتر و ماشین اداری";
  if (/console|playstation|xbox|کنسول|پلی/.test(lower)) return "کنسول بازی";
  if (/ssd|hdd|hard|هارد|حافظه/.test(lower) && !/laptop|لپ/.test(lower)) return "حافظه و ذخیره‌سازی";
  if (/cpu|gpu|motherboard|ram|power\s*supply|پردازنده|کارت گرافیک|مادربرد|پاور کامپیوتر|منبع تغذیه/.test(lower)) return "قطعات کامپیوتر";
  if (/mouse|keyboard|ماوس|کیبورد|پد ماوس/.test(lower)) return "لوازم جانبی کامپیوتر";
  return "نامشخص";
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
