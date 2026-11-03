import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "optibid-source-links-test-"));
process.env.OPTIBID_DATA_FILE = path.join(tempDir, "optibid.json");
process.env.OPTIBID_BANK_ENCRYPTION_KEY = "optibid-test-encryption-key-not-for-production";
process.env.CRON_SECRET = "test-cron-secret";

const {
  getOptiBidData,
  writeOptiBidData,
  updateJsonPlatformFinanceSettings,
} = await import("../src/lib/json-store");
const { POST: refreshPOST } = await import("../src/app/api/admin/store-products/refresh-prices/route");
const { POST: importCsvPOST } = await import("../src/app/api/admin/store-products/import-csv/route");
const { POST: cronPOST } = await import("../src/app/api/cron/refresh-prices/route");
const {
  normalizeSourceProductLimit,
  parseComputerPartSourceEntries,
  productBelongsToImportSource,
  computerPartSourceMultiplierForProduct,
  mergeProductImportSources,
} = await import("../src/lib/source-link-parser");
const { productMatchesComputerPartFilters } = await import("../src/lib/store-product-import");

const originalFetch = globalThis.fetch;
let fetchedUrls: string[] = [];

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(rawUrl);
  fetchedUrls.push(url.href);
  const id = url.pathname.split("/").filter(Boolean).pop() || "x1";
  const title = `Test Product ${id.toUpperCase()}`;
  const html = `<!doctype html><html><head><title>${title}</title>
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    offers: { "@type": "Offer", price: "120000000", priceCurrency: "IRR", availability: "https://schema.org/InStock" },
  })}</script></head><body><h1>${title}</h1></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}) as typeof fetch;

after(async () => {
  globalThis.fetch = originalFetch;
  await rm(tempDir, { recursive: true, force: true });
});

const SOURCE_A = "https://torob.com/browse/175/laptop/";
const SOURCE_B = "https://torob.com/browse/173/desktop/";

function sourceEntries() {
  return [
    { url: SOURCE_A, parts: ["laptop"], priceMultiplier: 1.1, maxProducts: 2 },
    { url: SOURCE_B, parts: ["desktop"], priceMultiplier: 0.9, maxProducts: 3 },
  ];
}

function product(number: number, sourceUrl: string, id = `X${number}`) {
  return {
    id: `product-${number}`,
    slug: `test-product-${id.toLowerCase()}`,
    title: `Test Product ${id}`,
    brand: "Test",
    category: sourceUrl === SOURCE_A ? "لپ‌تاپ و نوت‌بوک" : "کامپیوتر آماده",
    summary: `Test Product ${id}`,
    description: `Test Product ${id}`,
    price: 10_000_000,
    marketPrice: 10_000_000,
    priceMultiplier: 1,
    stock: 5,
    rating: 0,
    reviewsCount: 0,
    badges: [],
    specs: {},
    warranty: "۱۸ ماه",
    shippingNote: "ارسال استاندارد",
    externalSourceUrl: `https://torob.com/p/${id.toLowerCase()}/`,
    importSourceUrl: sourceUrl,
    importSourceUrls: [sourceUrl],
    importSources: [{ sourceUrl, productUrl: `https://torob.com/p/${id.toLowerCase()}/` }],
    isActive: true,
    isFeatured: false,
    createdAt: new Date().toISOString(),
  };
}

async function seedStore() {
  const data = await getOptiBidData();
  data.storeProducts = [
    product(1, SOURCE_A),
    product(2, SOURCE_A),
    product(3, SOURCE_A),
    product(4, SOURCE_B),
    product(5, SOURCE_B),
    product(6, SOURCE_B),
  ];
  Object.assign(data.settings, {
    storeAutoPriceRefreshEnabled: true,
    storeAutoPriceRefreshReferences: ["source"],
    storeAutoPriceRefreshBatchSize: 20,
    storeAutoPriceRefreshOffset: 0,
    storeAutoPriceRefreshLastRunAt: "",
    storeAutoPriceRefreshLastSummary: "",
    storeAutoPriceRefreshTotalRuns: 0,
    storeAutoPriceRefreshDailyLimit: 10000,
    storeAutoPriceRefreshDailyDate: "",
    storeAutoPriceRefreshDailyChecked: 0,
    storeAutoPriceRefreshDailyCycleDone: false,
    storeSourcePriceRefreshState: {},
    storePriceMultiplier: 2,
    storeComputerPartsSourceUrl: JSON.stringify(sourceEntries()),
  });
  await writeOptiBidData(data);
  fetchedUrls = [];
}

test("source-link settings keep a separate 1..10000 limit and multiplier", () => {
  assert.equal(normalizeSourceProductLimit(0), 10000);
  assert.equal(normalizeSourceProductLimit(25), 25);
  assert.equal(normalizeSourceProductLimit(999999), 10000);
  const entries = parseComputerPartSourceEntries(JSON.stringify(sourceEntries()));
  assert.equal(entries[0].maxProducts, 2);
  assert.equal(entries[1].maxProducts, 3);
  assert.equal(entries[0].priceMultiplier, 1.1);
});

test("laptop and desktop filters do not confuse desktop graphics cards with laptops", () => {
  const laptop = { title: "لپ‌تاپ ایسوس TUF Gaming", brand: "Asus", category: "لپ‌تاپ", summary: "", description: "", specs: {} };
  const desktop = { title: "کامپیوتر آماده اسمبل شده Core i5", brand: "OptiBid", category: "کامپیوتر آماده", summary: "", description: "", specs: {} };
  const gpu = { title: "کارت گرافیک ROG Strix RTX 4070", brand: "Asus", category: "قطعات کامپیوتر", summary: "", description: "", specs: {} };
  assert.equal(productMatchesComputerPartFilters(laptop, ["laptop"]), true);
  assert.equal(productMatchesComputerPartFilters(desktop, ["desktop"]), true);
  assert.equal(productMatchesComputerPartFilters(gpu, ["laptop"]), false);
  assert.equal(productMatchesComputerPartFilters(gpu, ["gpu"]), true);
});

test("source membership and multiplier are exact-link, not whole-host", () => {
  const item = product(1, SOURCE_A);
  assert.equal(productBelongsToImportSource(item, SOURCE_A), true);
  assert.equal(productBelongsToImportSource(item, SOURCE_B), false);
  assert.equal(productBelongsToImportSource({ externalSourceUrl: "https://torob.com/p/other/" }, SOURCE_A), false);
  assert.equal(computerPartSourceMultiplierForProduct(item, parseComputerPartSourceEntries(JSON.stringify(sourceEntries()))), 1.1);
  const merged = mergeProductImportSources(item, product(9, SOURCE_B, "X1"));
  assert.equal(merged.importSources?.length, 2);
});

test("per-link refresh only changes products imported from that link and uses its multiplier", async () => {
  await seedStore();
  const response = await refreshPOST(new Request("https://optibid.test/api/admin/store-products/refresh-prices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceUrl: SOURCE_A, references: ["torob", "digikala"], maxProducts: 10 }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.totalChecked, 2); // capped by SOURCE_A maxProducts
  assert.deepEqual(fetchedUrls.sort(), ["https://torob.com/p/x1/", "https://torob.com/p/x2/"]);
  const data = await getOptiBidData();
  assert.equal(data.storeProducts[0].price, 13_200_000);
  assert.equal(data.storeProducts[1].price, 13_200_000);
  assert.equal(data.storeProducts[2].price, 10_000_000);
  assert.equal(data.storeProducts[3].price, 10_000_000);
  assert.equal(data.settings.storePriceMultiplier, 2);
});

test("prepared import tags products to the source link and does not overwrite the global multiplier", async () => {
  await seedStore();
  const response = await importCsvPOST(new Request("https://optibid.test/api/admin/store-products/import-csv", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      importSourceUrl: SOURCE_B,
      sourcePriceMultiplier: 0.9,
      priceMultiplier: 9,
      strategy: "merge",
      categoryFilters: ["desktop"],
      products: [{
        title: "Test Desktop D1",
        brand: "Test",
        category: "کامپیوتر آماده",
        summary: "Test Desktop D1",
        description: "Test Desktop D1",
        price: 10_000_000,
        stock: 5,
        specs: {},
        externalSourceUrl: "https://torob.com/p/d1/",
        sourceHost: "torob.com",
      }],
    }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.created, 1);
  const data = await getOptiBidData();
  const imported = data.storeProducts.find((item) => item.title === "Test Desktop D1");
  assert.ok(imported);
  assert.equal(imported.price, 9_000_000);
  assert.equal(imported.importSourceUrl, "https://torob.com/browse/173/desktop");
  assert.equal(productBelongsToImportSource(imported, SOURCE_B), true);
  assert.equal(productBelongsToImportSource(imported, SOURCE_A), false);
  assert.equal(data.settings.storePriceMultiplier, 2);
});

test("cron is disabled without a secret and rejects a wrong secret", async () => {
  const savedSecret = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "";
    const disabled = await cronPOST(new Request("https://optibid.test/api/cron/refresh-prices", { method: "POST" }));
    assert.equal(disabled.status, 503);
    process.env.CRON_SECRET = savedSecret;
    const unauthorized = await cronPOST(new Request("https://optibid.test/api/cron/refresh-prices", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    }));
    assert.equal(unauthorized.status, 401);
  } finally {
    process.env.CRON_SECRET = savedSecret;
  }
});

test("daily cron respects each link's own cap and keeps per-link cursors", async () => {
  await seedStore();
  const first = await cronPOST(new Request("https://optibid.test/api/cron/refresh-prices?batches=10", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  }));
  const body = await first.json();
  assert.equal(first.status, 200);
  assert.equal(body.dailyChecked, 5); // 2 from A + 3 from B, not all 5 products from each link
  assert.equal(body.dailyLimit, 5);
  assert.equal(body.dailyDone, true);
  assert.equal(fetchedUrls.length, 5);
  const data = await getOptiBidData();
  const state = data.settings.storeSourcePriceRefreshState;
  assert.equal(state["https://torob.com/browse/175/laptop"].checked, 2);
  assert.equal(state["https://torob.com/browse/173/desktop"].checked, 3);

  const skipped = await cronPOST(new Request("https://optibid.test/api/cron/refresh-prices?batches=10", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  }));
  // All sources are done for today; the route still returns success with no new work.
  const skippedBody = await skipped.json();
  assert.equal(skippedBody.totalChecked, 0);
  assert.equal(fetchedUrls.length, 5);

  await updateJsonPlatformFinanceSettings({
    storeSourcePriceRefreshState: { hacked: { date: "1999", checked: 999, offset: 999, done: true } },
  } as never);
  const guarded = await getOptiBidData();
  assert.equal(guarded.settings.storeSourcePriceRefreshState.hacked, undefined);
});
