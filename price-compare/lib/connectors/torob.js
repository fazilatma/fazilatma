// کانکتور ترب — API عمومی جستجو، fallback نمایشی + تصویر واقعی
import { demoOffers } from "../pricing";
import { fetchJson } from "../net";
export const META = { id: "torob", name: "ترب", color: "#d73909", kind: "aggregator" };

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
  // برای هر کالای جدید - picsum مطمئن، نه loremflickr که فیلتره
  return `/api/auto-image?q=${encodeURIComponent(query)}`;
}

export async function search(query, ctx = {}) {
  try {
    const url = `https://api.torob.com/v4/base-product/search/?q=${encodeURIComponent(query)}&size=12`;
    const j = await fetchJson(url);
    const items = j?.results || [];
    if (!items.length) throw new Error("empty");
    return {
      source: META, mode: "real",
      offers: items.slice(0, 8).map((p) => ({
        source: META.id,
        title: p.name1 || p.name2,
        url: p.web_client_absolute_url || p.url || `https://torob.com/search/?q=${encodeURIComponent(query)}`,
        price: p.min_price || p.price || null,
        seller: `${p.shops_count || 0} فروشگاه`,
        rating: null,
        inStock: (p.min_price || 0) > 0,
        image: p.image_url || p.image || p.thumbnail || localImageForQuery(query),
      })).filter((o) => o.price),
    };
  } catch (e) {
    return { source: META, mode: "demo", note: "API از این منطقه‌ی جغرافیایی در دسترس نیست", offers: demoOffers(query, META, ctx) };
  }
}
