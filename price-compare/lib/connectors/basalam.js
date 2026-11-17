// کانکتور باسلام — جستجوی عمومی، fallback نمایشی + تصویر واقعی
import { demoOffers } from "../pricing";
import { fetchJson } from "../net";
export const META = { id: "basalam", name: "باسلام", color: "#a259e4", kind: "marketplace" };

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
    const url = `https://search.basalam.com/api/api_v1.0/search/product?q=${encodeURIComponent(query)}&size=12`;
    const j = await fetchJson(url);
    const items = j?.products || j?.data || [];
    if (!items.length) throw new Error("empty");
    return {
      source: META, mode: "real",
      offers: items.slice(0, 8).map((p) => ({
        source: META.id,
        title: p.name || p.title,
        url: p.id ? `https://basalam.com/p/${p.id}` : "#",
        price: p.price?.to ? Math.round(p.price.to / 10) : p.price || null,
        seller: p.vendor?.name || "فروشنده باسلام",
        rating: p.rating?.average || null,
        inStock: true,
        image: p.photo?.original || p.photo?.large || p.image || p.images?.[0] || localImageForQuery(query),
      })).filter((o) => o.price),
    };
  } catch (e) {
    return { source: META, mode: "demo", note: "API از این منطقه‌ی جغرافیایی در دسترس نیست", offers: demoOffers(query, META, ctx) };
  }
}
