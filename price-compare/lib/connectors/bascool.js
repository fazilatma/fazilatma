// کانکتور باسکول — بازار B2B ایران برای محصولات کشاورزی و صنعتی + تصویر واقعی
import { demoOffers } from "../pricing";
import { fetchJson } from "../net";
export const META = { id: "bascool", name: "باسکول", color: "#ff6f00", kind: "marketplace" };

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
    // باسکول API عمومی ندارد — تلاش برای جستجوی وب
    const url = `https://bascool.com/api/search?q=${encodeURIComponent(query)}`;
    const j = await fetchJson(url);
    const items = j?.products || j?.data || j?.results || [];
    if (!items.length) throw new Error("empty");
    return {
      source: META, mode: "real",
      offers: items.slice(0, 8).map((p) => ({
        source: META.id,
        title: p.name || p.title,
        url: p.url || p.link || `https://bascool.com/search?q=${encodeURIComponent(query)}`,
        price: p.price || p.min_price || null,
        seller: p.seller || p.vendor || "فروشنده باسکول",
        rating: p.rating || null,
        inStock: true,
        image: p.image || p.photo || p.thumbnail || localImageForQuery(query),
      })).filter((o) => o.price),
    };
  } catch (e) {
    return { source: META, mode: "demo", note: "باسکول — بازار عمده کشاورزی و صنعتی — API عمومی ندارد، داده نمایشی", offers: demoOffers(query, META, ctx, { channel: "bascool" }) };
  }
}
