// کانکتور گوگل — پایه برای باگذار google shopping / scraping؛ در سندباکس نمایشی
import { demoOffers } from "../pricing";
export const META = { id: "google", name: "Google Shopping", color: "#4285f4", kind: "search" };

export async function search(query, ctx = {}) {
  // نکته: اسکرپ سرچ گوگل در ToS آن مخالف است و به‌سرعت کپچا می‌خورد.
  // برای استفاده‌ی واقعی Google Shopping API (SerpApi/google-shopping-scraper) را اینجا وصل کنید و
  // متغیر SERPAPI_KEY را تنظیم کنید؛ در غیر این صورت داده‌ی نمایشی برگردانده می‌شود.
  if (process.env.SERPAPI_KEY) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&gl=ir&hl=fa`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const items = j?.shopping_results || [];
      if (items.length) {
        return {
          source: META, mode: "real",
          offers: items.slice(0, 8).map((p) => ({
            source: META.id,
            title: p.title,
            url: p.link || "#",
            price: p.extracted_price || null,
            seller: p.source || "Google Shopping",
            rating: p.rating || null,
            inStock: true,
          })).filter((o) => o.price),
        };
      }
    } catch {}
  }
  return { source: META, mode: "demo", note: "بدون SERPAPI_KEY داده‌ی نمایشی", offers: demoOffers(query, META, ctx) };
}
