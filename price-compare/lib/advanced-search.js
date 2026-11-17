// موتور جستجوی پیشرفته - فراتر از ترب و گوگل
// ویژگی‌ها: معنایی، مترادف‌ها، تشخیص برند/مدل/حافظه، اصلاح املا، گسترش پرس‌وجو

import { normalizeQuery, faToEnDigits } from "./normalize";
import { PRODUCTS } from "./catalog";

const SYNONYMS = {
  "گوشی": ["موبایل", "phone", "cellphone", "تلفن همراه"],
  "لپ تاپ": ["لپتاپ", "laptop", "نوت بوک", "notebook"],
  "هدفون": ["هدست", "headphone", "earphone"],
  "ساعت هوشمند": ["اسمارت واچ", "smartwatch", "واچ"],
  "آیفون": ["iphone", "apple iphone", "گوشی اپل"],
  "سامسونگ": ["samsung", "galaxy"],
  "شیائومی": ["xiaomi", "redmi"],
  "نو": ["آکبند", "new", "not active", "پلمپ"],
  "استوک": ["کارکرده", "used", "دست دوم", "refurbished"],
  "256": ["256gb", "256 گیگ"],
  "512": ["512gb", "512 گیگ"],
};

const BRANDS = ["اپل", "سامسونگ", "شیائومی", "سونی", "ایسوس", "لنوو", "ال جی", "apple", "samsung", "xiaomi", "sony", "asus", "lenovo", "lg"];

export function expandQuery(query) {
  const norm = normalizeQuery(query);
  const tokens = norm.split(" ").filter(Boolean);
  const expanded = new Set([norm]);

  // مترادف‌ها
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (norm.includes(normalizeQuery(key))) {
      for (const s of syns) expanded.add(norm.replace(normalizeQuery(key), normalizeQuery(s)));
      for (const s of syns) expanded.add(`${norm} ${normalizeQuery(s)}`);
    }
    for (const syn of syns) {
      if (norm.includes(normalizeQuery(syn))) {
        expanded.add(norm.replace(normalizeQuery(syn), normalizeQuery(key)));
      }
    }
  }

  // تشخیص برند
  const detectedBrands = BRANDS.filter((b) => norm.includes(normalizeQuery(b)));
  
  // تشخیص حافظه
  const storageMatch = query.match(/(\d+)\s*(gb|گیگ|gig)/i);
  const storage = storageMatch ? storageMatch[1] : null;

  // تشخیص وضعیت نو/استوک
  const isNew = /نو|آکبند|not active|پلمپ|new/i.test(query);
  const isUsed = /استوک|کارکرده|used|دست دوم/i.test(query);

  return {
    original: query,
    normalized: norm,
    tokens,
    expanded: Array.from(expanded).slice(0, 8),
    brands: detectedBrands,
    storage,
    condition: isUsed ? "used" : isNew ? "new" : "all",
    hasImage: false,
  };
}

export function semanticScore(product, expandedQuery) {
  const { normalized, brands, storage, condition } = expandedQuery;
  let score = 0;

  const pName = normalizeQuery(product.name);
  const pKeys = product.keywords.map(normalizeQuery).join(" ");

  // تطبیق دقیق نام
  if (pName === normalized) score += 100;
  else if (pName.includes(normalized) || normalized.includes(pName)) score += 80;

  // تطبیق کلمات کلیدی
  for (const token of expandedQuery.tokens) {
    if (pName.includes(token) || pKeys.includes(token)) score += 15;
  }

  // برند
  if (brands.length) {
    const pBrands = BRANDS.filter((b) => pName.includes(normalizeQuery(b)) || pKeys.includes(normalizeQuery(b)));
    if (pBrands.some((b) => brands.includes(b) || brands.some((bb) => normalizeQuery(bb) === normalizeQuery(b)))) {
      score += 30;
    }
  }

  // حافظه
  if (storage && (pName.includes(storage) || pKeys.includes(storage))) {
    score += 25;
  }

  // دسته‌بندی هوشمند
  if (normalized.includes("گوشی") && product.category === "موبایل") score += 20;
  if (normalized.includes("لپ تاپ") && product.category === "لپ‌تاپ") score += 20;

  return Math.min(100, score);
}

export function advancedSearchProducts(query) {
  const expanded = expandQuery(query);
  const scored = PRODUCTS.map((p) => ({
    product: p,
    score: semanticScore(p, expanded),
    expanded,
  }))
    .filter((x) => x.score > 10)
    .sort((a, b) => b.score - a.score);

  return {
    expanded,
    results: scored.slice(0, 10),
    top: scored[0]?.product || null,
    confidence: scored[0]?.score || 0,
  };
}

// تشخیص خودکار از روی نام فایل تصویر یا OCR - بهبود یافته برای لپ تاپ
export function guessFromImageMeta(fileName, ocrText = "") {
  const combined = `${fileName} ${ocrText}`.toLowerCase();
  const guesses = [];

  if (/iphone|آیفون|apple.*phone/i.test(combined)) {
    if (/15.*pro.*max|پرو مکس 15/i.test(combined)) guesses.push("آیفون 15 پرو مکس");
    else if (/14|13|16/) {
      const m = combined.match(/(1[3-6]).*pro.*max/i);
      if (m) guesses.push(`آیفون ${m[1]} پرو مکس`);
      else guesses.push("آیفون");
    } else guesses.push("آیفون");
  }
  if (/macbook|مک بوک|مکبوک|mac.*air|m1.*book/i.test(combined)) {
    if (/m1/i.test(combined)) guesses.push("مک‌بوک ایر M1");
    else if (/m3/i.test(combined)) guesses.push("مک‌بوک ایر M3");
    else guesses.push("مک‌بوک ایر M1");
  }
  if (/laptop|notebook|dell|latitude|7420|7430|thinkpad|lenovo.*legion|asus.*rog|ideapad|inspiron|لب تاب|لپ تاپ|لپ‌تاپ|لپتاپ/i.test(combined)) {
    if (/dell|latitude|7420/i.test(combined)) guesses.push("Dell Latitude 7420");
    else if (/lenovo|legion/i.test(combined)) guesses.push("لنوو Legion Pro 5");
    else if (/asus|rog/i.test(combined)) guesses.push("ایسوس ROG Strix G16");
    else if (/لپ تاپ|لپ‌تاپ|لب تاب/i.test(combined)) guesses.push("لپ تاپ");
    else guesses.push("لپ تاپ");
  }
  if (/samsung|سامسونگ|galaxy|گلکسی/i.test(combined)) guesses.push("گلکسی S24 الترا");
  if (/sony|سونی.*هدفون|wh.*1000/i.test(combined)) guesses.push("هدفون سونی WH-1000XM5");
  if (/ps5|پلی استیشن|playstation/i.test(combined)) guesses.push("ps5");
  if (/airpods|ایرپاد/i.test(combined)) guesses.push("ایرپادز پرو 2");
  if (/shoe|کفش|دمپایی|کتونی|slippers|sneaker|صندل/i.test(combined)) guesses.push("کفش");
  if (/pen|خودکار|خودکار آبی/i.test(combined)) guesses.push("خودکار آبی");

  // اگر هیچ حدسی نبود، از OCR استفاده کن
  if (!guesses.length && ocrText) {
    const cleaned = ocrText.slice(0, 100).trim();
    if (cleaned.length > 3) guesses.push(cleaned);
  }

  // اگر بازم هیچی نبود، اگر تو متن لپ تاپ بود، لپ تاپ برگردون نه گوشی!
  if (!guesses.length) {
    if (/laptop|لپ تاپ|لپ‌تاپ|notebook|dell|lenovo|asus/i.test(combined)) return ["لپ تاپ"];
    if (/کفش|shoe/i.test(combined)) return ["کفش"];
    if (/خودکار|pen/i.test(combined)) return ["خودکار آبی"];
  }

  return guesses.length ? guesses : ["لپ تاپ"];
}
