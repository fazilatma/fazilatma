import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

// مسیر ذخیره‌سازی باید پیش از بارگذاری ماژول تنظیم شود تا تست‌ها هرگز به دادهٔ واقعی دست نزنند.
const tempDir = await mkdtemp(path.join(os.tmpdir(), "optibid-cron-test-"));
process.env.OPTIBID_DATA_FILE = path.join(tempDir, "optibid.json");
process.env.OPTIBID_BANK_ENCRYPTION_KEY = "optibid-test-encryption-key-not-for-production";
process.env.CRON_SECRET = "test-cron-secret";

const {
  getOptiBidData,
  writeOptiBidData,
  updateJsonPlatformFinanceSettings,
} = await import("../src/lib/json-store");
const { POST } = await import("../src/app/api/cron/refresh-prices/route");

const originalFetch = globalThis.fetch;
let fetchedUrls: string[] = [];

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(rawUrl);
  fetchedUrls.push(url.href);
  const id = url.pathname.split("/").filter(Boolean).pop() || "x1";
  const title = `Test Laptop ${id.toUpperCase()}`;
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

async function seedStore(productCount = 5) {
  const data = await getOptiBidData();
  data.storeProducts = Array.from({ length: productCount }, (_, index) => {
    const number = index + 1;
    const id = `X${number}`;
    return {
      id: `product-${number}`,
      slug: `test-laptop-${id.toLowerCase()}`,
      title: `Test Laptop ${id}`,
      brand: "Test",
      category: "لپ‌تاپ و نوت‌بوک",
      summary: `Test Laptop ${id}`,
      description: `Test Laptop ${id}`,
      price: 10_000_000,
      stock: 5,
      rating: 0,
      reviewsCount: 0,
      badges: [],
      specs: {},
      warranty: "۱۸ ماه",
      shippingNote: "ارسال استاندارد",
      externalSourceUrl: `https://shop.example/product/${id.toLowerCase()}`,
      isActive: true,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };
  });
  Object.assign(data.settings, {
    storeAutoPriceRefreshEnabled: true,
    storeAutoPriceRefreshReferences: ["source"],
    storeAutoPriceRefreshBatchSize: 2,
    storeAutoPriceRefreshOffset: 0,
    storeAutoPriceRefreshLastRunAt: "",
    storeAutoPriceRefreshLastSummary: "",
    storeAutoPriceRefreshTotalRuns: 0,
    storeAutoPriceRefreshDailyLimit: 3,
    storeAutoPriceRefreshDailyDate: "",
    storeAutoPriceRefreshDailyChecked: 0,
    storeAutoPriceRefreshDailyCycleDone: false,
    storePriceMultiplier: 1,
    storeComputerPartsSourceUrl: "",
  });
  await writeOptiBidData(data);
  fetchedUrls = [];
}

async function runCron(query = "") {
  const response = await POST(
    new Request(`https://optibid.test/api/cron/refresh-prices${query}`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }),
  );
  return { response, body: await response.json() };
}

test("cron is disabled without a secret and rejects a wrong secret", async () => {
  const savedSecret = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "";
    const disabled = await POST(new Request("https://optibid.test/api/cron/refresh-prices", { method: "POST" }));
    assert.equal(disabled.status, 503);

    process.env.CRON_SECRET = savedSecret;
    const unauthorized = await POST(
      new Request("https://optibid.test/api/cron/refresh-prices", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );
    assert.equal(unauthorized.status, 401);
  } finally {
    process.env.CRON_SECRET = savedSecret;
  }
});

test("daily quota stops the cron, and saving unchanged references preserves the cursor when the limit is raised", async () => {
  await seedStore(5);

  const first = await runCron("?batches=5");
  assert.equal(first.response.status, 200);
  assert.equal(first.body.totalChecked, 3);
  assert.equal(first.body.dailyChecked, 3);
  assert.equal(first.body.dailyLimit, 3);
  assert.equal(first.body.dailyDone, true);
  assert.equal(first.body.hasMore, true);
  assert.equal(first.body.nextOffset, 3);
  assert.equal(fetchedUrls.length, 3);

  const skipped = await runCron("?batches=5");
  assert.equal(skipped.body.skipped, true);
  assert.equal(skipped.body.reason, "daily-limit-reached");
  assert.equal(fetchedUrls.length, 3);

  // فرم ادمین همیشه آرایهٔ منابع را می‌فرستد؛ تکرار/ترتیب نباید چرخه را از ابتدا شروع کند.
  await updateJsonPlatformFinanceSettings({
    storeAutoPriceRefreshReferences: ["source", "source"],
    storeAutoPriceRefreshDailyLimit: 10,
  });
  const afterSave = await getOptiBidData();
  assert.equal(afterSave.settings.storeAutoPriceRefreshOffset, 3);
  assert.equal(afterSave.settings.storeAutoPriceRefreshDailyChecked, 3);
  assert.equal(afterSave.settings.storeAutoPriceRefreshDailyLimit, 10);

  const continued = await runCron("?batches=5");
  assert.equal(continued.body.totalChecked, 2);
  assert.equal(continued.body.dailyChecked, 5);
  assert.equal(continued.body.dailyDone, true);
  assert.equal(continued.body.hasMore, false);
  assert.equal(continued.body.nextOffset, 0);
  assert.deepEqual(
    fetchedUrls.slice(3),
    ["https://shop.example/product/x4", "https://shop.example/product/x5"],
  );

  const complete = await runCron("?batches=5");
  assert.equal(complete.body.skipped, true);
  assert.equal(complete.body.reason, "daily-cycle-complete");
});

test("a new Tehran day restarts the cycle, while admin PATCH cannot overwrite runtime counters", async () => {
  await seedStore(5);
  const staleDay = await getOptiBidData();
  staleDay.settings.storeAutoPriceRefreshDailyDate = "2000-01-01";
  staleDay.settings.storeAutoPriceRefreshDailyChecked = 9;
  staleDay.settings.storeAutoPriceRefreshDailyCycleDone = true;
  staleDay.settings.storeAutoPriceRefreshOffset = 4;
  staleDay.settings.storeAutoPriceRefreshDailyLimit = 10;
  await writeOptiBidData(staleDay);

  const freshDay = await runCron("?batches=5");
  assert.equal(freshDay.body.totalChecked, 5);
  assert.equal(freshDay.body.dailyChecked, 5);
  assert.notEqual(freshDay.body.dailyDate, "2000-01-01");
  assert.equal(freshDay.body.dailyDone, true);
  assert.equal(fetchedUrls[0], "https://shop.example/product/x1");

  // یک روز ناتمام: سقف پر شده ولی چرخه هنوز ادامه دارد.
  await seedStore(5);
  const partialData = await getOptiBidData();
  partialData.settings.storeAutoPriceRefreshDailyLimit = 2;
  await writeOptiBidData(partialData);
  const partial = await runCron("?batches=5");
  assert.equal(partial.body.nextOffset, 2);
  assert.equal(partial.body.dailyChecked, 2);

  // تغییر واقعی منابع باید از ابتدا شروع کند، اما فیلدهای-runtime قابل نوشتن توسط ادمین نیستند.
  await updateJsonPlatformFinanceSettings({
    storeAutoPriceRefreshReferences: ["source", "torob"],
    storeAutoPriceRefreshOffset: 999,
    storeAutoPriceRefreshDailyChecked: 999,
    storeAutoPriceRefreshDailyCycleDone: true,
    storeAutoPriceRefreshDailyDate: "1999-01-01",
    storeAutoPriceRefreshLastSummary: "should-not-be-writable",
    storeAutoPriceRefreshTotalRuns: 999,
  });
  const guarded = await getOptiBidData();
  assert.equal(guarded.settings.storeAutoPriceRefreshOffset, 0);
  assert.equal(guarded.settings.storeAutoPriceRefreshDailyChecked, 2);
  assert.equal(guarded.settings.storeAutoPriceRefreshDailyCycleDone, false);
  assert.notEqual(guarded.settings.storeAutoPriceRefreshDailyDate, "1999-01-01");
  assert.notEqual(guarded.settings.storeAutoPriceRefreshLastSummary, "should-not-be-writable");
  assert.notEqual(guarded.settings.storeAutoPriceRefreshTotalRuns, 999);
});
