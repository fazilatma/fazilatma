// تست end-to-end قیمت‌یار پرو — اجرا: node scripts/e2e-test.mjs
// BASE_URL پیش‌فرض: http://localhost:3000

const BASE = process.env.BASE_URL || "http://localhost:3000";
const results = [];
const pass = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};
const get = async (path, ms = 60000) => {
  const r = await fetch(BASE + path, { signal: AbortSignal.timeout(ms) });
  return { status: r.status, json: await r.json().catch(() => null), text: null };
};

console.log(`\n🦅 تست end-to-end قیمت‌یار پرو روی ${BASE}\n`);

// ۱. صفحه‌ی اصلی
{
  const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(20000) });
  const html = await r.text();
  pass("۱) صفحه‌ی اصلی بالا می‌آید", r.status === 200, `HTTP ${r.status}`);
  pass("۲) برند در صفحه هست", html.includes("قیمت‌یار") || html.includes("price"), "");
}

// ۲. خزش محصول کاتالوگ
{
  const { status, json } = await get(`/api/hunt?q=${encodeURIComponent("آیفون 15 پرو مکس")}`);
  pass("۳) /api/hunt پاسخ سالم", status === 200 && !!json, `HTTP ${status}`);
  pass("۴) هر ۶ منبع گزارش می‌دهند", json.sources.length === 6, json.sources.map((s) => `${s.name}:${s.mode}`).join("، "));
  pass("۵) حداقل ۱۵ پیشنهاد", json.offers.length >= 15, `${json.offers.length} پیشنهاد`);
  pass("۶) تصمیم خرید/فروش ساخته می‌شود", !!json.buy && !!json.sell && typeof json.sell.roi === "number",
    `خرید از ${json.buy.cheapest.seller} | ROI فروش: ${json.sell.roi}٪`);
  pass("۷) سیگنال تقاضا دارد", json.demand.score >= 0 && json.demand.score <= 100, `${json.demand.score}/100`);
}

// ۳. عبارت ناشناخته — تخمین هش‌محور
{
  const { json } = await get(`/api/hunt?q=${encodeURIComponent("گجت ناشناس xq12")}`);
  pass("۸) عبارت ناشناخته هم جواب می‌دهد", json.offers.length > 0, `${json.offers.length} پیشنهاد (تخمینی)`);
}

// ۴. خزش واقعی تلگرام — کانال قیمت طلا
{
  const { json } = await get(`/api/hunt?q=${encodeURIComponent("سکه")}&tg=goldpriceir`);
  const tg = json.sources.find((s) => s.id === "telegram");
  pass("۹) کانکتور تلگرام واقعی است", tg.mode === "real", tg.note || `${tg.count} آیتم واقعی`);
  const tgOffers = json.offers.filter((o) => o.source === "telegram");
  pass("۱۰) قیمت واقعی سکه استخراج شد", tgOffers.length > 0 && tgOffers.every((o) => o.price > 50_000_000),
    tgOffers.slice(0, 3).map((o) => o.price.toLocaleString("en-US")).join("، "));
  const uniq = new Set(tgOffers.map((o) => o.price + "|" + o.title.slice(0, 20)));
  pass("۱۱) تکراری‌ها حذف شده‌اند", uniq.size === tgOffers.length, `${tgOffers.length} آیتم یکتا`);
}

// ۵. جریان هشدارها
{
  await fetch(BASE + "/api/alerts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "سکه", type: "spike", thresholdPct: 2 }),
  });
  const c1 = await get("/api/alerts?check=1", 120000);
  const c2 = await get("/api/alerts?check=1", 120000);
  pass("۱۲) قاعده ذخیره و دو بار بررسی انجام شد", c1.json.alerts?.rules?.some((r) => r.query === "سکه") && c2.json.checkedAt > 0,
    `checkedAt: ${new Date(c2.json.checkedAt).toLocaleTimeString("fa-IR")} | قوانین: ${c2.json.alerts.rules.length} | رویدادها: ${c2.json.alerts.events.length}`);
}

// ۶. نیست ۴۰۴ برای ریشه
{
  const r = await fetch(BASE + "/no-such-page");
  pass("۱۳) هندلینگ مسیر اشتباه", r.status === 404, `HTTP ${r.status}`);
}

// خلاصه
const okCount = results.filter((r) => r.ok).length;
console.log(`\n═══════════════════════════════`);
console.log(`نتیجه: ${okCount}/${results.length} پاس`);
process.exit(okCount === results.length ? 0 : 1);
