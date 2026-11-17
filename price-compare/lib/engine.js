// مغز شکارچی قیمت — تجمیع منابع + تحلیل خرید/فروش + TGJU-like تحلیل کامل
import { huntAll } from "./connectors";
import { pushSnapshot, getSnapshots } from "./store";
import { analyzeHistory, generateMarketNews } from "./tgju-analysis";

export async function hunt(query, opts = {}) {
  const started = Date.now();
  const sourceResults = await huntAll(query, opts);

  const offers = [];
  for (const sr of sourceResults) for (const o of sr.offers || []) offers.push(o);
  const seen = new Set();
  const unique = offers.filter((o) => {
    const key = `${o.source}|${o.seller}|${o.price}|${(o.title || "").slice(0, 30)}|${o.condition||"new"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  let valid = unique.filter((o) => o.price > 0 && o.inStock !== false);
  // اگر همه آفرها ناموجودن (مثل 27GP850 در ترب/دیجی‌کالا)، خالی برنگردون - با برچسب ناموجود و آخرین قیمت نشون بده
  if (valid.length === 0) {
    const pricedOutOfStock = unique.filter((o) => o.price > 0);
    if (pricedOutOfStock.length > 0) valid = pricedOutOfStock;
  }

  // فیلتر برندمحور برای مقایسه دقیق - مثل با مثل
  // اگر کاربر برند مشخص کرده (مثل خودکار بیک آبی)، فقط همان برند را بیار
  // اگر برند مشخص نکرده (مثل خودکار آبی)، همه برندها را بیار
  const brandKeywords = [
    { id: "bic", label: "بیک", keywords: ["بیک", "bic"] },
    { id: "parker", label: "پارکر", keywords: ["پارکر", "parker"] },
    { id: "cenco", label: "کنکو", keywords: ["کنکو"] },
    { id: "staedtler", label: "استدلر", keywords: ["استدلر", "staedtler"] },
    { id: "dell", label: "Dell", keywords: ["dell"] },
    { id: "apple", label: "Apple", keywords: ["apple", "اپل"] },
    { id: "samsung", label: "Samsung", keywords: ["samsung", "سامسونگ"] },
  ];
  const qLower = query.toLowerCase();
  const detectedBrand = brandKeywords.find(b => b.keywords.some(k => qLower.includes(k.toLowerCase())));
  if (detectedBrand) {
    // برند مشخص شده - فقط آفرهای همان برند
    const beforeCount = valid.length;
    const filtered = valid.filter(o => {
      const text = `${o.title || ""} ${o.seller || ""} ${o.productName || ""} ${o.brand || ""}`.toLowerCase();
      return detectedBrand.keywords.some(k => text.includes(k.toLowerCase())) || 
             (o.brand && o.brand.toLowerCase().includes(detectedBrand.label.toLowerCase())) ||
             (o.brandId && o.brandId === detectedBrand.id);
    });
    // اگر فیلتر نتیجه داد، از فیلتر استفاده کن، وگرنه همه را نگه دار (برای جلوگیری از خالی شدن)
    if (filtered.length > 0) {
      valid = filtered;
    }
    console.log(`Brand filter: ${detectedBrand.label} - ${beforeCount} -> ${valid.length} offers`);
  }

  // تفکیک نو و استوک
  const newOffers = valid.filter((o) => o.condition !== "used");
  const usedOffers = valid.filter((o) => o.condition === "used");

  const stats = computeStats(valid);
  const statsNew = computeStats(newOffers);
  const statsUsed = computeStats(usedOffers);

  const buy = pickBestBuy(valid, newOffers, usedOffers);
  const sell = pickBestSell(valid, newOffers, usedOffers, buy, opts);

  let trend = null, prev = null, history = [];
  const snap = { min: stats.min, avg: stats.avg, max: stats.max, offerCount: valid.length, sources: sourceResults.filter((s) => s.mode === "real").length, minNew: statsNew.min, avgNew: statsNew.avg, minUsed: statsUsed.min, avgUsed: statsUsed.avg };
  try {
    const r = await pushSnapshot(query, snap);
    prev = r.prev;
    history = r.history || [];
    if (prev) trend = Math.round(((snap.avg - prev.avg) / prev.avg) * 1000) / 10;
  } catch {}
  
  // اگر تاریخچه خالی بود، سعی کن بخوانی
  if (!history.length) {
    try { history = await getSnapshots(query); } catch {}
  }

  const demand = demandSignal(prev, snap, valid);
  const alerts = passiveAlerts(prev, snap, query, opts);

  // تحلیل TGJU-like
  const tgju = analyzeHistory(history, stats);
  const marketNews = generateMarketNews(query, tgju);
  
  // تحلیل کامل برای هر محصول
  const fullAnalysis = {
    live: {
      price: stats.avg,
      min: stats.min,
      max: stats.max,
      change: trend,
      changePercent: trend,
      lastUpdate: Date.now(),
      offerCount: valid.length,
      spread: stats.spreadPct,
    },
    technical: {
      trend: tgju.trend,
      trendColor: tgju.trendColor,
      recommendation: tgju.recommendation,
      ma7: tgju.ma7,
      ma30: tgju.ma30,
      support: tgju.support,
      resistance: tgju.resistance,
      rsi: tgju.rsi,
      volatility: tgju.volatility,
      forecast: tgju.forecast,
    },
    changes: tgju.changes,
    chartData: tgju.chartData,
    history: history.slice(-20),
    news: marketNews,
    hasHistory: tgju.hasHistory,
  };

  return {
    query,
    ms: Date.now() - started,
    sources: sourceResults.map((sr) => ({
      id: sr.source.id, name: sr.source.name, color: sr.source.color, kind: sr.source.kind,
      mode: sr.mode, note: sr.note || null, count: (sr.offers || []).length, ms: sr.ms,
    })),
    offers: valid.sort((a, b) => a.price - b.price),
    offersNew: newOffers.sort((a,b)=>a.price-b.price),
    offersUsed: usedOffers.sort((a,b)=>a.price-b.price),
    stats, statsNew, statsUsed,
    buy, sell, demand, trend, alerts,
    tgju: fullAnalysis,
    analysis: fullAnalysis, // alias
  };
}

function computeStats(offers) {
  const prices = offers.map((o) => o.price);
  if (!prices.length) return { min: 0, max: 0, avg: 0, median: 0, count: 0, spreadPct: 0 };
  const s = [...prices].sort((a, b) => a - b);
  const min = s[0], max = s[s.length - 1];
  const avg = Math.round(s.reduce((a, b) => a + b, 0) / s.length);
  const median = s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
  return { min, max, avg, median, count: s.length, spreadPct: min ? Math.round(((max - min) / min) * 100) : 0 };
}

function pickBestBuy(all, newOffers, usedOffers) {
  if (!all.length) return null;
  const score = (offers) => {
    if (!offers.length) return null;
    const scored = offers.map((o) => {
      const trust = o.rating ? 0.03 * (o.rating / 5) : 0.01;
      return { o, eff: Math.round(o.price * (1 - trust)) };
    }).sort((a, b) => a.eff - b.eff);
    const best = scored[0];
    const absCheapest = [...offers].sort((a, b) => a.price - b.price)[0];
    return { offer: best.o, effectivePrice: best.eff, cheapest: absCheapest, why: whyBuy(best.o) };
  };
  const bestNew = score(newOffers);
  const bestUsed = score(usedOffers);
  const bestAll = score(all);
  return {
    cheapest: bestAll?.cheapest || null,
    effectivePrice: bestAll?.effectivePrice || 0,
    why: bestAll?.why || "",
    offer: bestAll?.offer || null,
    bestNew,
    bestUsed,
    ...bestAll,
  };
}

function whyBuy(o) {
  const bits = [`کمترین نرخ مؤثر (★ ${o.rating ?? "—"})`];
  if (o.deliveryDays === 0) bits.push("ارسال فوری");
  if (o.condition === "used") bits.push("وضعیت استوک/کارکرده");
  else bits.push("وضعیت نو/آکبند");
  if (o.snippet) bits.push("آگهی مستقیم فروشنده");
  return bits.join(" • ");
}

function pickBestSell(all, newOffers, usedOffers, buy, opts) {
  if (!all.length || !buy) return null;
  const feeMap = { digikala: 15, basalam: 10, bascool: 5, torob: 2, google: 0, telegram: 2, instagram: 2 };
  const feePctGlobal = Number(opts.feePct ?? 9);
  const shipCost = Number(opts.shipCost ?? 150_000);
  const buildSellForCondition = (offersCond, buyCond) => {
    if (!offersCond.length || !buyCond) return null;
    const prices = offersCond.map((o) => o.price).sort((a, b) => a - b);
    const p = (k) => prices[Math.min(prices.length - 1, Math.floor(k * prices.length))];
    const suggestedSell = p(0.7);
    const buyPrice = buyCond.cheapest.price;
    const gross = suggestedSell - buyPrice;
    const fee = Math.round(suggestedSell * (feePctGlobal / 100));
    const net = gross - fee - shipCost;
    const roi = buyPrice ? Math.round((net / buyPrice) * 100) : 0;
    const grouped = {};
    for (const o of offersCond) {
      if (!grouped[o.source]) grouped[o.source] = [];
      grouped[o.source].push(o);
    }
    const sellOptions = [];
    for (const [srcId, srcOffers] of Object.entries(grouped)) {
      const srcPrices = srcOffers.map((o) => o.price).sort((a, b) => a - b);
      const srcTop = srcPrices[srcPrices.length - 1];
      const srcP70 = srcPrices[Math.min(srcPrices.length - 1, Math.floor(0.7 * srcPrices.length))];
      const srcAvg = Math.round(srcPrices.reduce((a, b) => a + b, 0) / srcPrices.length);
      const potentialSellPrice = Math.max(srcTop, srcP70);
      const feePct = feeMap[srcId] ?? feePctGlobal;
      const feeSrc = Math.round(potentialSellPrice * (feePct / 100));
      const netSrc = potentialSellPrice - buyPrice - feeSrc - shipCost;
      const roiSrc = buyPrice ? Math.round((netSrc / buyPrice) * 100) : 0;
      sellOptions.push({
        source: srcId,
        condition: offersCond[0].condition || "new",
        avgPrice: srcAvg,
        topPrice: srcTop,
        p70Price: srcP70,
        potentialSellPrice,
        feePct,
        fee: feeSrc,
        net: netSrc,
        roi: roiSrc,
        offerCount: srcOffers.length,
      });
    }
    sellOptions.sort((a, b) => b.net - a.net);
    const best = sellOptions[0];
    const marketTop = offersCond.filter((o) => o.price >= p(0.5)).sort((a, b) => b.price - a.price);
    return {
      suggestedSell,
      gross, fee, shipCost, net, roi, feePct: feePctGlobal,
      topMarket: marketTop[0] || null,
      bestMarketplace: best ? offersCond.filter((o) => o.source === best.source).sort((a, b) => b.price - a.price)[0] : marketTop[0],
      sellOptions,
      bestSellPlatform: best,
      condition: offersCond[0].condition || "new",
    };
  };
  const sellNew = buildSellForCondition(newOffers, buy.bestNew);
  const sellUsed = buildSellForCondition(usedOffers, buy.bestUsed);
  const mainSell = sellNew || sellUsed;
  if (!mainSell) return null;
  let verdict = "";
  if (sellNew && sellUsed) {
    verdict = `نو: بهترین فروش در «${sellNew.bestSellPlatform?.source || "—"}» با ${sellNew.bestSellPlatform?.roi || 0}٪ ROI (${sellNew.bestSellPlatform?.net?.toLocaleString("fa-IR")} تومان سود). ` +
              `استوک: بهترین فروش در «${sellUsed.bestSellPlatform?.source || "—"}» با ${sellUsed.bestSellPlatform?.roi || 0}٪ ROI. ` +
              `⚠️ هرگز کالای استوک را به قیمت نو نفروشید.`;
  } else if (sellNew) {
    verdict = `پتانسیل نو — بهترین محل فروش «${sellNew.bestSellPlatform?.source}» با ${sellNew.bestSellPlatform?.roi}٪ بازده.`;
  } else if (sellUsed) {
    verdict = `فقط استوک موجود — بهترین فروش «${sellUsed.bestSellPlatform?.source}» با ${sellUsed.bestSellPlatform?.roi}٪.`;
  }
  return { ...mainSell, sellNew, sellUsed, verdict };
}

function demandSignal(prev, snap, offers) {
  if (!prev) {
    const base = Math.min(75, 40 + offers.length * 1.5);
    return { score: base, label: "داده‌ی مبنا در حال جمع‌آوری", note: "اولین مشاهده است؛ با ادامه‌ی پایش، روند تقاضا دقیق‌تر می‌شود.", parts: ["شروع پایش بازار"] };
  }
  const offerDelta = snap.offerCount - prev.offerCount;
  const avgDeltaPct = prev.avg ? ((snap.avg - prev.avg) / prev.avg) * 100 : 0;
  let score = 50 + offerDelta * 8 + Math.min(Math.abs(avgDeltaPct), 10) * (avgDeltaPct > 0 ? 3 : -2);
  score = Math.max(5, Math.min(100, Math.round(score)));
  const parts = [
    `تعداد فروشندگان: ${offerDelta >= 0 ? "+" : ""}${offerDelta} نسبت به مشاهده‌ی قبلی`,
    `میانگین قیمت: ${avgDeltaPct >= 0 ? "+" : ""}${Math.round(avgDeltaPct * 10) / 10}٪`,
    offerDelta > 0 && avgDeltaPct > 0 ? "⚠️ الگوی افزایش تقاضا" : offerDelta < 0 && avgDeltaPct > 3 ? "⚠️ احتمال کمبود/تقاضای ناگهانی" : "وضعیت نسبتاً پایدار",
  ];
  const label = score >= 75 ? "تقاضای داغ 🔥" : score >= 55 ? "در حال گرم شدن" : score >= 35 ? "پایدار" : "سرد";
  return { score, label, note: "سیگنال تخمینی بر پایه‌ی تغییر عرضه/قیمت بین مشاهدات", parts };
}

function passiveAlerts(prev, snap, query, opts) {
  const out = [];
  if (!prev || !prev.avg) return out;
  const avgDeltaPct = Math.round(((snap.avg - prev.avg) / prev.avg) * 1000) / 10;
  if (avgDeltaPct <= -3) out.push({ type: "price_drop", severity: avgDeltaPct <= -7 ? "high" : "mid", message: `📉 افت ${Math.abs(avgDeltaPct)}٪ میانگین قیمت «${query}» — زمان خوب برای خرید` });
  if (avgDeltaPct >= 3) out.push({ type: "price_spike", severity: avgDeltaPct >= 7 ? "high" : "mid", message: `📈 جهش ${avgDeltaPct}٪ میانگین قیمت «${query}» — برای فروش موقعیت بهتر است.` });
  const supplyDelta = snap.offerCount - prev.offerCount;
  if (Math.abs(supplyDelta) >= 2) out.push({ type: supplyDelta > 0 ? "supply_up" : "supply_down", severity: "low", message: supplyDelta > 0 ? `🧲 ${supplyDelta} فروشنده‌ی جدید وارد بازار «${query}» شد.` : `🧲 ${Math.abs(supplyDelta)} فروشنده از بازار «${query}» خارج شد.` });
  return out;
}
