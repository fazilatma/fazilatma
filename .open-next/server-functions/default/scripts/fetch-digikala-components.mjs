import fs from "node:fs/promises";
import path from "node:path";

const sources = [
  { slug: "processor", part: "cpu", category: "قطعات کامپیوتر" },
  { slug: "graphics-card", part: "gpu", category: "قطعات کامپیوتر" },
  { slug: "ram", part: "ram", category: "قطعات کامپیوتر" },
  { slug: "motherboard", part: "motherboard", category: "قطعات کامپیوتر" },
  { slug: "internal-ssd", part: "ssd", category: "حافظه و ذخیره‌سازی" },
  { slug: "internal-hard-drive", part: "ssd", category: "حافظه و ذخیره‌سازی" },
  { slug: "psu", part: "power", category: "قطعات کامپیوتر" },
  { slug: "computer-chassis", part: "case", category: "قطعات کامپیوتر" },
  { slug: "cooling-system", part: "cooler", category: "قطعات کامپیوتر" },
];

const maxPagesPerCategory = 60;
const maxProducts = 7_000;
const outputPath = path.resolve("data/digikala-components-cache.json");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function firstText(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    if (value && typeof value === "object") {
      const nested = firstText(value.title_fa, value.title_en, value.name, value.title, value.url, value.uri);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

const brandRules = [
  [/asus|ایسوس/i, "Asus"], [/gigabyte|گیگابایت|aorus/i, "Gigabyte"],
  [/\bmsi\b|ام اس آی|ام‌اس‌آی/i, "MSI"], [/corsair|کورسیر/i, "Corsair"],
  [/kingston|کینگستون/i, "Kingston"], [/crucial|کروشیال/i, "Crucial"],
  [/samsung|سامسونگ/i, "Samsung"], [/western\s*digital|وسترن\s*دیجیتال|\bwd\b/i, "Western Digital"],
  [/seagate|سیگیت/i, "Seagate"], [/cooler\s*master|کولر\s*مستر/i, "Cooler Master"],
  [/green|گرین/i, "Green"], [/xfx|ایکس اف ایکس/i, "XFX"], [/zotac|زوتک/i, "Zotac"],
  [/palit|پالیت/i, "Palit"], [/intel|اینتل/i, "Intel"], [/\bamd\b|ای ام دی|ای‌ام‌دی/i, "AMD"],
  [/nvidia|انویدیا/i, "NVIDIA"],
];

function brandFromRecord(record, title) {
  const explicit = firstText(record.brand?.title_en, record.brand?.title_fa, record.data_layer?.brand);
  const text = `${title} ${explicit}`;
  for (const [pattern, brand] of brandRules) if (pattern.test(text)) return brand;
  return explicit || "Digikala";
}

function productUrl(record) {
  const id = String(record.id || record.product_id || "").replace(/\D/g, "");
  const uri = firstText(record.url?.uri, record.url, record.web_url);
  try {
    const url = new URL(uri || `/product/dkp-${id}/`, "https://www.digikala.com/");
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return id ? `https://www.digikala.com/product/dkp-${id}/` : "";
  }
}

function imageUrl(record, baseUrl) {
  const raw = firstText(
    record.images?.main?.url,
    record.images?.main?.webp_url,
    record.images?.list?.[0]?.url,
    record.images?.list?.[0]?.webp_url,
  );
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function draftFromRecord(record, source) {
  const title = firstText(record.title_fa, record.title_en, record.title, record.name).slice(0, 180);
  const price = Math.round(Number(
    record.default_variant?.price?.selling_price || record.price?.selling_price || record.selling_price || 0,
  ) / 10);
  if (!title || !Number.isFinite(price) || price < 100_000 || price > 1_500_000_000) return null;
  const url = productUrl(record);
  if (!url) return null;
  const rrp = Math.round(Number(record.default_variant?.price?.rrp_price || record.price?.rrp_price || 0) / 10);
  const status = firstText(record.default_variant?.status, record.status).toLowerCase();
  return {
    title,
    brand: brandFromRecord(record, title),
    category: firstText(record.data_layer?.item_category5, record.data_layer?.item_category4, source.category),
    summary: title,
    description: title,
    price,
    ...(rrp > price && rrp <= price * 1.8 ? { originalPrice: rrp } : {}),
    ...(imageUrl(record, url) ? { imageUrl: imageUrl(record, url) } : {}),
    stock: status.includes("out") || status.includes("inactive") ? 0 : 5,
    specs: { "نوع قطعه": source.part, "گروه کالا": source.category },
    externalSourceUrl: url,
    sourceHost: "digikala.com",
    currency: "IRT",
  };
}

async function fetchPage(source, page) {
  const url = `https://api.digikala.com/v1/categories/${source.slug}/search/?page=${page}&sort=7`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          accept: "application/json, text/plain, */*",
          "accept-language": "fa-IR,fa;q=0.9,en;q=0.6",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const records = Array.isArray(payload?.data?.products) ? payload.data.products : [];
      const pager = payload?.data?.pager || {};
      const totalPages = Math.max(1, Math.floor(Number(pager.total_pages || pager.last_page || 1)));
      return { records, totalPages };
    } catch (error) {
      lastError = error;
      await sleep(attempt * 1000);
    }
  }
  throw lastError;
}

async function main() {
  const products = new Map();
  const categoryStats = [];
  for (const source of sources) {
    console.log(`Scanning ${source.slug}...`);
    const first = await fetchPage(source, 1);
    const totalPages = Math.min(maxPagesPerCategory, first.totalPages || maxPagesPerCategory);
    let accepted = 0;
    const addRecords = (records) => {
      for (const record of records) {
        const draft = draftFromRecord(record, source);
        if (!draft) continue;
        products.set(draft.externalSourceUrl, draft);
        accepted += 1;
        if (products.size >= maxProducts) break;
      }
    };
    addRecords(first.records);
    for (let page = 2; page <= totalPages && products.size < maxProducts; page += 1) {
      const result = await fetchPage(source, page);
      if (!result.records.length) break;
      addRecords(result.records);
      if (page % 5 === 0) console.log(`${source.slug}: page ${page}/${totalPages}, total ${products.size}`);
      await sleep(150);
    }
    categoryStats.push({ slug: source.slug, part: source.part, pages: totalPages, accepted });
    if (products.size >= maxProducts) break;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    productCount: products.size,
    categoryStats,
    products: [...products.values()],
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(`Wrote ${products.size} products to ${outputPath}`);
  if (products.size < 100) throw new Error(`Only ${products.size} products were fetched; refusing to publish cache.`);
}

await main();
