// کانکتور دیجی‌کالا — تلاش برای API واقعی، در صورت مسدودی IP: داده‌ی نمایشی برچسب‌خورده + تصویر واقعی
import { demoOffers } from "../pricing";
import { fetchJson } from "../net";
export const META = { id: "digikala", name: "دیجی‌کالا", color: "#ef4056", kind: "marketplace" };

function localImageForQuery(query) {
  const ql = query.toLowerCase();
  if (ql.includes("خودکار آبی")) return "/images/pen-blue.jpg";
  if (ql.includes("خودکار مشکی")||ql.includes("pen black")) return "/images/pen-black.jpg";
  if (ql.includes("خودکار قرمز")||ql.includes("pen red")) return "/images/pen-red.jpg";
  if (ql.includes("خودکار")||ql.includes("pen")) return "/images/pen-blue.jpg";
  if (ql.includes("مداد")||ql.includes("pencil")) return "/images/pencil-hb.jpg";
  if (ql.includes("دفتر")||ql.includes("notebook")) return "/images/notebook-100.jpg";
  if (ql.includes("لیوان کاغذی")||ql.includes("لیوان یکبار")||ql.includes("paper cup")||ql.includes("لیوان")) return "/images/paper-cup.jpg";
  if (ql.includes("سوزن خیاطی")||ql.includes("سوزن")||ql.includes("خیاطی")||ql.includes("sewing")||ql.includes("needle")) return "/images/sewing-needle.jpg";
  if (ql.includes("اسکوتر")||ql.includes("scooter")) return "/images/scooter-electric.jpg";
  if (ql.includes("دمپایی")||ql.includes("دمپا")||ql.includes("slippers")||ql.includes("کفش")) return "/images/slippers.jpg";
  if (ql.includes("پیاز")||ql.includes("onion")) return "/images/onion-white.jpg";
  if (ql.includes("سیب زمینی")||ql.includes("potato")) return "/images/potato.jpg";
  return `/api/auto-image?q=${encodeURIComponent(query)}`;
}

export async function search(query, ctx = {}) {
  try {
    const url = `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1`;
    const j = await fetchJson(url, { headers: { "x-web-client": "desktop" } });
    const hits = j?.data?.products || [];
    if (!hits.length) throw new Error("empty");
    return {
      source: META, mode: "real",
      offers: hits.slice(0, 8).map((p) => ({
        source: META.id,
        title: p.title_fa || p.title_en,
        url: "https://www.digikala.com/product/dkp-" + p.id,
        price: p?.default_variant?.price?.selling_price ? Math.round(p.default_variant.price.selling_price / 10) : null,
        seller: p?.default_variant?.seller?.title || "دیجی‌کالا",
        rating: p?.rating || null,
        inStock: p?.default_variant?.price?.is_inactive !== true,
        image: p?.images?.main?.url || p?.images?.main || p?.image || localImageForQuery(query),
      })).filter((o) => o.price),
    };
  } catch (e) {
    // IP مسدود/ناسازگار → نمایشی
    return { source: META, mode: "demo", note: "API بدون VPN/سرور ایرانی در دسترس نیست", offers: demoOffers(query, META, ctx) };
  }
}
