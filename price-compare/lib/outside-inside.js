// منطق فاز خارج به داخل - محاسبه لندد کاست، زمان، ریسک
export const OUTSIDE_SOURCES = [
  {
    id: "trendyol",
    name: "Trendyol ترکیه",
    flag: "🇹🇷",
    country: "TR",
    deliveryMin: 5,
    deliveryMax: 7,
    dutyPct: 20,
    shippingIntl: 350000,
    risk: "low",
    riskLabel: "کم‌ریسک",
    riskColor: "#10b981",
    desc: "پوشاک و کفش - پست پیشتاز ترکیه",
    baseUrl: "trendyol.com",
    currency: "TRY",
    rateToIRR: 120000, // هر لیر ~120k ریال
  },
  {
    id: "amazonAe",
    name: "Amazon.ae دبی",
    flag: "🇦🇪",
    country: "AE",
    deliveryMin: 3,
    deliveryMax: 5,
    dutyPct: 15,
    shippingIntl: 500000,
    risk: "low",
    riskLabel: "کم‌ریسک",
    riskColor: "#10b981",
    desc: "الکترونیک - کارگو دبی به بوشهر",
    baseUrl: "amazon.ae",
    currency: "AED",
    rateToIRR: 750000,
  },
  {
    id: "aliexpress",
    name: "AliExpress چین",
    flag: "🇨🇳",
    country: "CN",
    deliveryMin: 18,
    deliveryMax: 25,
    dutyPct: 10,
    shippingIntl: 200000,
    risk: "high",
    riskLabel: "پرریسک - فقط پیش‌خرید",
    riskColor: "#ef4444",
    desc: "ارزان‌ترین - پست چین",
    baseUrl: "aliexpress.com",
    currency: "USD",
    rateToIRR: 600000,
  },
  {
    id: "amazonTr",
    name: "Amazon ترکیه",
    flag: "🇹🇷",
    country: "TR",
    deliveryMin: 6,
    deliveryMax: 9,
    dutyPct: 20,
    shippingIntl: 400000,
    risk: "medium",
    riskLabel: "متوسط",
    riskColor: "#f59e0b",
    desc: "کتاب و الکترونیک",
    baseUrl: "amazon.com.tr",
    currency: "TRY",
    rateToIRR: 120000,
  },
];

export function calculateLandedCost(productPriceIRR, source, customsSettings = {}, extra = {}) {
  const dutyPct = customsSettings.defaultDutyPct ?? source.dutyPct;
  const shippingIntl = customsSettings.shippingIntl ?? source.shippingIntl;
  const insurancePct = customsSettings.insurancePct ?? 2;
  const clearanceFee = customsSettings.clearanceFee ?? 800000; // ترخیصیه
  const warehousingFee = customsSettings.warehousingFee ?? 200000; // انبارداری
  const domesticShipping = extra.domesticShipping ?? customsSettings.domesticShipping ?? 150000; // حمل داخل ایران
  const vatPct = customsSettings.vatPct ?? 10; // مالیات ارزش افزوده
  const hilalPct = customsSettings.hilalPct ?? 1; // هلال احمر
  const currencyFeePct = customsSettings.currencyFeePct ?? 2.5; // کارمزد صرافی/درگاه ارزی
  const platformFeePct = extra.platformFeePct ?? customsSettings.platformFeePct ?? 9; // کارمزد پلتفرم قیمت‌یار

  // CIF = قیمت کالا + حمل بین‌الملل + بیمه
  const insurance = Math.round(productPriceIRR * (insurancePct / 100));
  const cif = productPriceIRR + shippingIntl + insurance;

  // گمرک
  const duty = Math.round(cif * (dutyPct / 100));

  // هلال احمر 1% از CIF
  const hilal = Math.round(cif * (hilalPct / 100));

  // مالیات بر ارزش افزوده 10% از (CIF + Duty)
  const vatBase = cif + duty;
  const vat = Math.round(vatBase * (vatPct / 100));

  // کارمزد صرافی 2.5% از قیمت کالا
  const currencyFee = Math.round(productPriceIRR * (currencyFeePct / 100));

  // جمع هزینه‌های گمرکی
  const customsTotal = duty + hilal + vat + clearanceFee + warehousingFee;

  // جمع کل قبل از کارمزد پلتفرم
  const subtotal = cif + customsTotal + currencyFee + domesticShipping;

  // کارمزد پلتفرم
  const platformFee = Math.round(subtotal * (platformFeePct / 100));

  // قیمت نهایی تمام شده
  const total = subtotal + platformFee;

  // قیمت اقتصادی (با 10% تخفیف بابت صبر)
  const economyDiscount = Math.round(total * 0.10);
  const economyTotal = total - economyDiscount;

  // قیمت فوری (از انبار تهران - 15% گرون‌تر چون انبارداری + ریسک)
  const immediateTotal = Math.round(total * 1.15);

  return {
    productPrice: productPriceIRR,
    shippingIntl,
    insurance,
    insurancePct,
    cif,
    duty,
    dutyPct,
    hilal,
    hilalPct,
    vat,
    vatPct,
    vatBase,
    clearanceFee,
    warehousingFee,
    currencyFee,
    currencyFeePct,
    domesticShipping,
    customsTotal,
    subtotal,
    platformFee,
    platformFeePct,
    total,
    economyTotal,
    economyDiscount,
    immediateTotal,
    breakdown: {
      productPrice: productPriceIRR,
      shippingIntl,
      insurance,
      cif,
      duty,
      hilal,
      vat,
      clearanceFee,
      warehousingFee,
      currencyFee,
      domesticShipping,
      platformFee,
      total,
      economyTotal,
      immediateTotal
    },
    breakdownText: `قیمت کالا ${productPriceIRR.toLocaleString("fa-IR")} + حمل بین‌الملل ${shippingIntl.toLocaleString("fa-IR")} + بیمه ${insurance.toLocaleString("fa-IR")} = CIF ${cif.toLocaleString("fa-IR")} | گمرک ${duty.toLocaleString("fa-IR")} (${dutyPct}٪) + هلال ${hilal.toLocaleString("fa-IR")} (1٪) + مالیات ${vat.toLocaleString("fa-IR")} (10٪ از ${vatBase.toLocaleString("fa-IR")}) + ترخیص ${clearanceFee.toLocaleString("fa-IR")} + انبارداری ${warehousingFee.toLocaleString("fa-IR")} + صرافی ${currencyFee.toLocaleString("fa-IR")} (${currencyFeePct}٪) + حمل داخل ${domesticShipping.toLocaleString("fa-IR")} + کارمزد ${platformFee.toLocaleString("fa-IR")} (${platformFeePct}٪) = نهایی ${total.toLocaleString("fa-IR")}`
  };
}

export function getRiskScore(product, source) {
  let score = 0;
  let reasons = [];

  // قیمت بالا = ریسک بیشتر
  if (product.basePrice > 50000000) {
    score += 30;
    reasons.push("قیمت بالای 50م - ریسک گمرک");
  }

  // دسته‌بندی پرریسک
  const highRiskCategories = ["آرایشی", "بهداشت", "باتری", "عطر"];
  if (highRiskCategories.some(c => product.category?.includes(c) || product.name?.includes(c))) {
    score += 40;
    reasons.push("دسته پرریسک گمرک");
  }

  // منبع
  if (source.risk === "high") {
    score += 30;
    reasons.push("مبدا چین - زمان طولانی");
  } else if (source.risk === "medium") {
    score += 15;
  }

  // زمان
  if (source.deliveryMax > 15) {
    score += 20;
    reasons.push(`تحویل ${source.deliveryMax} روزه - احتمال کنسلی`);
  }

  let level = "low";
  let label = "کم‌ریسک";
  let color = "#10b981";
  if (score >= 60) {
    level = "high";
    label = "پرریسک";
    color = "#ef4444";
  } else if (score >= 30) {
    level = "medium";
    label = "متوسط";
    color = "#f59e0b";
  }

  return { score, level, label, color, reasons };
}

export function generateOutsideOffers(query, product, settings) {
  // بر اساس کوئری و محصول، آفرهای خارجی بساز
  const enabledSources = OUTSIDE_SOURCES.filter(s => {
    if (!settings?.outsideSources) return true;
    return settings.outsideSources[s.id] !== false;
  });

  const basePrice = product?.basePrice || 10000000;
  // قیمت خارجی معمولا 20-40٪ ارزون‌تر از ایران
  const discountFactor = 0.7; // 30٪ ارزون‌تر

  return enabledSources.map(source => {
    const foreignPrice = Math.round(basePrice * discountFactor * (0.9 + Math.random() * 0.2));
    const landed = calculateLandedCost(foreignPrice, source, settings?.customs);
    const risk = getRiskScore(product || { basePrice, name: query, category: "عمومی" }, source);

    // دو گزینه: فوری (از انبار تهران) و اقتصادی (از خارج)
    const immediatePrice = Math.round(landed.total * 1.15); // 15٪ گرون‌تر ولی فوری
    const economyPrice = landed.total;

    return {
      source,
      foreignPrice,
      landed,
      risk,
      immediate: {
        price: immediatePrice,
        delivery: "فردا - از انبار تهران (موجودی مجازی)",
        label: "⚡ فوری",
        color: "#10b981"
      },
      economy: {
        price: economyPrice,
        delivery: `${source.deliveryMin}-${source.deliveryMax} روز - از ${source.name}`,
        label: "💰 اقتصادی",
        color: "#0ea5e9"
      },
      profitVsInside: basePrice - economyPrice, // سود نسبت به خرید داخلی
    };
  });
}
