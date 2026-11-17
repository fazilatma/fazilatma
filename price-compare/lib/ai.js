// موتور تحلیل AI — امتیازدهی ارزش، توضیحات فارسی و پیشنهاد خرید
// اگر OPENAI_API_KEY موجود باشد، جمع‌بندی نهایی را با LLM می‌نویسد،
// در غیر این صورت از موتور تحلیل قواعدی محلی استفاده می‌کند.

export function analyze(product, offers, history) {
  const sorted = [...offers].sort((a, b) => a.price - b.price).filter((o) => o.inStock);
  const prices = offers.map((o) => o.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const spreadPct = Math.round(((max - min) / min) * 100);

  // امتیاز ارزش: ترکیب قیمت، امتیاز فروشگاه و سرعت ارسال (نرمال ۰..۱)
  const scored = sorted.map((o) => {
    const priceScore = (max - o.price) / ((max - min) || 1); // ارزان‌تر = بهتر
    const ratingScore = (o.rating - 3.5) / 1.5;
    const deliveryScore = 1 - Math.min(o.deliveryDays, 4) / 4;
    const value = 0.55 * priceScore + 0.3 * ratingScore + 0.15 * deliveryScore;
    return { ...o, value: Math.round(value * 100) / 100 };
  });

  const bestValue = [...scored].sort((a, b) => b.value - a.value)[0];
  const cheapest = sorted[0];
  const fastest = [...scored].sort((a, b) => a.deliveryDays - b.deliveryDays || a.price - b.price)[0];

  // روند قیمت از تاریخچه
  const lastWeek = history.slice(-7).map((h) => h.price);
  const prevWeek = history.slice(-14, -7).map((h) => h.price);
  const lastAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
  const prevAvg = prevWeek.reduce((a, b) => a + b, 0) / prevWeek.length;
  const trendPct = Math.round(((lastAvg - prevAvg) / prevAvg) * 1000) / 10;

  const trendText =
    trendPct <= -1.5
      ? "زمان خوبی برای خرید است — قیمت در یک هفته‌ی گذشته نزولی بوده."
      : trendPct >= 1.5
      ? "قیمت رو به افزایش است؛ اگر قصد خرید دارید کشش ندهید."
      : "قیمت تقریباً ثابت است؛ فعلاً تغییر معناداری نمی‌بینیم.";

  const insights = [];

  insights.push(
    `ارزان‌ترین قیمت در «${cheapest.store}» است با ${fmt(cheapest.price)}؛ ` +
      (cheapest.value < bestValue.value
        ? `اما «${bestValue.store}» با ${fmt(bestValue.price)} به‌دلیل امتیاز ${toFa(bestValue.rating)} و ارسال ${dayTxt(bestValue.deliveryDays)} ارزش خرید بالاتری دارد.`
        : `و همین فروشگاه بهترین ارزش خرید را هم دارد.`)
  );

  if (spreadPct >= 8) {
    insights.push(`پراکندگی قیمت زیاد است (${toFa(spreadPct)}٪ بین ارزان‌ترین و گران‌ترین) — حتماً مقایسه کنید، چون پتانسیل صرفه‌جویی تا ${fmt(max - min)} تومان وجود دارد.`);
  } else {
    insights.push(`قیمت‌ها نزدیک به یکدیگرند (${toFa(spreadPct)}٪ اختلاف)؛ به‌جای قیمت، روی امتیاز فروشگاه و سرعت ارسال تمرکز کنید.`);
  }

  insights.push(
    `اگر عجله دارید «${fastest.store}» سریع‌ترین ارسال را دارد (${dayTxt(fastest.deliveryDays)})` +
      (fastest.price > min ? ` ولی ${fmt(fastest.price - min)} تومان گران‌تر از بهترین قیمت است.` : " و قیمتش هم پایین‌ترین است.")
  );

  insights.push(`روند قیمت: ${trendText}`);

  const avgNote =
    cheapest.price < avg
      ? `بهترین قیمت ${toFa(Math.round(((avg - cheapest.price) / avg) * 100))}٪ زیر میانگین بازار است.`
      : "قیمت پایین‌تر از میانگین بازار حال‌حاضر پیدا نشد.";

  const verdict = [
    `جمع‌بندی AI: از بین ${toFa(offers.length)} فروشگاه، پیشنهاد ما «${bestValue.store}» است — ${fmt(bestValue.price)} با اعتبار ${toFa(bestValue.rating)}/۵ و ارسال ${dayTxt(bestValue.deliveryDays)}. ${avgNote}`,
    trendText,
    product.spec ? `نکته‌ی فنی مدل: ${product.spec}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    bestPick: bestValue,
    cheapest,
    fastest,
    avg,
    min,
    max,
    spreadPct,
    trendPct,
    insights,
    verdict,
  };
}

export function answerQuestion(kind, product, analysis) {
  const { bestPick, cheapest, fastest, min, trendPct } = analysis;
  switch (kind) {
    case "worth": {
      const t = trendPct <= -1 ? "قیمت روند نزولی دارد و" : trendPct >= 1 ? "قیمت صعودی شده، و باز هم" : "قیمت پایدار است و";
      return `بله، از دید مقایسه‌ی بازار ${t} «${bestPick.store}» با ${fmt(bestPick.price)} حدود ${Math.max(0, toFa(Math.round(((analysis.avg - bestPick.price) / analysis.avg) * 100)))}٪ زیر میانگین بازار است. امتیاز ${toFa(bestPick.rating)}/۵ هم خیال را از کیفیت فروشگاه راحت می‌کند.`;
    }
    case "trusted": {
      const ranked = [...analysis._offers].sort((a, b) => b.rating - a.rating || a.price - b.price);
      const top = ranked[0];
      return `قابل‌اعتمادترین فروشگاه «${top.store}» با امتیاز ${toFa(top.rating)}/۵ از ${top.reviews.toLocaleString("fa-IR")} نظر است. قیمتش ${fmt(top.price)} و ارسال ${dayTxt(top.deliveryDays)} می‌باشد${top.price > min ? ` — یعنی برای اعتماد بیشتر، ${fmt(top.price - min)} مازاد پرداخت می‌کنید.` : " — و اتفاقاً گران‌ترین هم نیست!"}`;
    }
    case "wait": {
      if (analysis.trendPct <= -2) return `فعلاً نه — قیمت در حال کاهش است (${toFa(analysis.trendPct)}٪ هفتگی)‌؛ احتمالاً چند روز دیگر ارزان‌تر هم دیده می‌شود. البته موجودی را چک کنید.`;
      if (analysis.trendPct >= 2) return `نه — قیمت دارد بالا می‌رود (+${toFa(analysis.trendPct)}٪ هفتگی). اگر نیاز دارید، همین حالا خرید عاقلانه‌تر است.${trendPct > 5 ? " افزایش قیمت قابل توجه است." : ""}`;
      return `تفاوت چندانی نمی‌کند؛ قیمت پایدار است. اگر صبر می‌کنید، قیمت فروشگاه «${cheapest.store}» (${fmt(cheapest.price)}) را زیر نظر بگیرید — هر لحظه ممکن است تغییر کند. اگر عجله‌ای دارید، «${fastest.store}» با ارسال ${dayTxt(fastest.deliveryDays)} گزینه‌ی مناسبی است.`;
    }
    default:
      return "";
  }
}

export const fmt = (n) => n.toLocaleString("fa-IR") + " تومان";
export const dayTxt = (d) => (d <= 0 ? "همان امروز" : `${toFa(d)} روز کاری`);
export const toFa = (n) => Number(n).toLocaleString("fa-IR");
