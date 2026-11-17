// ابزار نرمال‌سازی متن فارسی/انگلیسی + تبدیل ارقام
export function faToEnDigits(s = "") {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return String(s).replace(/[۰-۹٠-٩]/g, (c) => {
    const i = fa.indexOf(c);
    if (i >= 0) return String(i);
    const j = ar.indexOf(c);
    return j >= 0 ? String(j) : c;
  });
}

export function normalizeQuery(s = "") {
  return faToEnDigits(s)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[يئ]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/ـ/g, "") // کشیده (تطویل) که در قیمت‌نامه‌ها زیاد است
    .replace(/[‌ء]/g, " ")
    .replace(/[^\w\sآ-یa-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// استخراج قیمت از متن فارسی/انگلیسی:
// ۱) "قیمت 12,300,000 تومان" | "12500000ت"   ۲) خطوط قیمت‌نامه: "هر گرم ۱۸ عیار: ۲۴,۱۲۳,۹۱۰"   ۳) "$12.5"
export function extractPrices(text = "") {
  const t = faToEnDigits(text).replace(/ـ/g, "");
  const out = [];
  const re1 = /([0-9][0-9,.\s٬]{3,20})\s*(تومان|تومن|toman|ت)(?![\wآ-ی])/gi;
  let m;
  while ((m = re1.exec(t))) {
    const num = parseInt(m[1].replace(/[,.\s٬]/g, ""), 10);
    if (num >= 1000 && num <= 500_000_000_000) out.push({ price: num, unit: "IRT", raw: m[0] });
  }
  // الگوی قیمت‌نامه: عدد با جداکننده‌ی هزارگان بعد از «:» — بدون نیاز به واحد
  const re2 = /[:：]\s*([0-9]{1,3}(?:[,٬][0-9]{3}){1,4})/g;
  while ((m = re2.exec(t))) {
    const num = parseInt(m[1].replace(/[,٬]/g, ""), 10);
    if (num >= 10_000 && num <= 500_000_000_000) out.push({ price: num, unit: "IRT", raw: m[0] });
  }
  const re3 = /\$\s*([0-9]+(?:\.[0-9]+)?)/g; // دلاری (اختیاری)
  while ((m = re3.exec(t))) out.push({ price: parseFloat(m[1]), unit: "USD", raw: m[0] });
  return out;
}
