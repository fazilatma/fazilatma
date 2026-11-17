// کانکتور تلگرام — واقعی: خواندن پست‌های کانال‌های عمومی از پیش‌نمایش وب t.me/s/{channel}
// کانال‌ها را با ?tg=ch1,ch2 یا متغیر TG_CHANNELS تنظیم کنید.
import { extractPrices, faToEnDigits } from "../normalize";
import { demoOffers } from "../pricing";

export const META = { id: "telegram", name: "تلگرام", color: "#229ed9", kind: "social" };

export async function search(query, ctx = {}) {
  const channels = (ctx.tgChannels && ctx.tgChannels.length ? ctx.tgChannels : (process.env.TG_CHANNELS || "").split(",")).filter(Boolean);
  if (!channels.length) {
    return {
      source: META, mode: "demo",
      note: "کانال تنظیم نشده — TG_CHANNELS=channel1,channel2 یا ?tg= برای داده‌ی واقعی",
      offers: demoOffers(query, META, ctx, { note: "پست نمایشی کانال" }),
    };
  }
  const norm = (s = "") =>
    faToEnDigits(s).toLowerCase().replace(/[أإآ]/g, "ا").replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").replace(/ـ/g, "").replace(/‌/g, " ");
  const q = norm(query);
  const qParts = q.split(" ").filter(Boolean);
  const found = [];

  for (const ch of channels.slice(0, 4)) {
    try {
      const url = `https://t.me/s/${encodeURIComponent(ch)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0" } });
      if (!r.ok) continue;
      const html = await r.text();
      // استخراج متن پست‌ها
      const msgs = [...html.matchAll(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g)].map((m) =>
        m[1].replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
      );
      for (const text of msgs) {
        const nt = norm(text);
        if (!qParts.length || !qParts.some((p) => nt.includes(p))) continue;
        const allPrices = extractPrices(text).filter((x) => x.unit === "IRT");
        if (!allPrices.length) continue;
        // برای قیمت‌نامه‌های چندخطی: اگر خطی جداگانه با همان زیرعبارت + قیمت داشت، همان را به‌عنوان قیمت بگیر
        const matchedLine = text.split("\n").find((l) => {
          const lp = extractPrices(l).some((x) => x.unit === "IRT");
          return lp && qParts.some((p) => norm(l).includes(p));
        });
        const linePrices = matchedLine ? extractPrices(matchedLine).filter((x) => x.unit === "IRT") : null;
        const pool = linePrices && linePrices.length ? linePrices : allPrices;
        found.push({
          source: META.id,
          title: (matchedLine || text.split("\n")[0]).slice(0, 90) || `پست @${ch}`,
          snippet: text.slice(0, 220),
          url: `https://t.me/s/${ch}`,
          price: Math.min(...pool.map((x) => x.price)),
          seller: "@" + ch,
          rating: null,
          inStock: true,
        });
      }
    } catch {}
  }

  if (!found.length) {
    return {
      source: META, mode: "demo",
      note: `در کانال‌های تعریف‌شده پستی مطابق «${query}» یافت نشد`,
      offers: demoOffers(query, META, ctx, { note: "پست نمایشی کانال" }),
    };
  }
  return { source: META, mode: "real", offers: found.slice(0, 8) };
}
