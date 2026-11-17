// فروشگاه‌ها + تولید قیمت قطعی (deterministic) برای هر محصول
export const STORES = [
  { id: "dk", name: "دیجی‌کالا", color: "#ef4056", trust: 4.6, deliveryDays: 1, spread: 0.03 }, // ضد قیمت‌پایدار
  { id: "to", name: "ترب مارکت", color: "#2e7d32", trust: 4.3, deliveryDays: 2, spread: -0.02 }, // اغلب ارزان‌تر
  { id: "te", name: "تکنولایف", color: "#1565c0", trust: 4.4, deliveryDays: 1, spread: 0.015 },
  { id: "mo", name: "موبایل ۱۹", color: "#f9a825", trust: 4.0, deliveryDays: 3, spread: -0.035 }, // کمترین قیمت، اعتماد پایین‌تر
  { id: "sn", name: "اسنپ مارکت", color: "#00bfa5", trust: 4.2, deliveryDays: 0, spread: 0.055 }, // سریع‌ترین، گران‌تر
];

// PRNG قطعی وابسته به (productId + storeId)‌ — نتیجه‌ی تکرارپذیر در هر ریکوئست
export function seededRand(seed) {
  let t = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    t = Math.imul(t ^ seed.charCodeAt(i), 3432918353);
    t = (t << 13) | (t >>> 19);
  }
  return function () {
    t = Math.imul(t ^ (t >>> 16), 2246822507);
    t = Math.imul(t ^ (t >>> 13), 3266489909);
    return ((t ^= t >>> 16) >>> 0) / 4294967296;
  };
}

export function generateOffers(product) {
  return STORES.map((s) => {
    const rnd = seededRand(product.id + ":" + s.id);
    const jitter = (rnd() - 0.5) * 0.06; // ±3%
    const price = Math.round((product.basePrice * (1 + s.spread + jitter)) / 100000) * 100000;
    const rating = Math.min(5, Math.round((s.trust - (rnd() - 0.5) * 0.4) * 10) / 10);
    const reviews = 30 + Math.floor(rnd() * 1400);
    const inStock = rnd() > 0.08;
    return {
      storeId: s.id,
      store: s.name,
      color: s.color,
      price,
      rating,
      reviews,
      deliveryDays: s.deliveryDays + (rnd() > 0.7 ? 1 : 0),
      inStock,
      url: "#",
    };
  }).sort((a, b) => a.price - b.price);
}

// تاریخچه‌ی ۳۰ روزه‌ی قیمت (قطعی) برای نمایش روند
export function priceHistory(product, days = 30) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${product.id}:${d.toISOString().slice(0, 10)}`;
    const rnd = seededRand(key);
    const wave = Math.sin(i / 5) * 0.02;
    const price = Math.round((product.basePrice * (1 + wave + (rnd() - 0.5) * 0.05)) / 100000) * 100000;
    out.push({ date: d.toISOString().slice(0, 10), price });
  }
  return out;
}
