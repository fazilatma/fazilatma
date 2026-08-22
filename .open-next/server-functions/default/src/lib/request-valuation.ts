export type ProductCondition =
  | "new"
  | "open_box"
  | "refurbished"
  | "used_like_new"
  | "used_good"
  | "used_fair"
  | "for_parts"
  | "unknown";

export type ProductValuationFactors = {
  productCondition: ProductCondition;
  sameNewProductPrice: string;
  manufactureYear: string;
  warrantyStatus: "manufacturer" | "seller" | "test" | "none" | "unknown";
  warrantyMonths: string;
  partsHealth: "all_healthy" | "minor_issue" | "needs_repair" | "unknown";
  batteryHealthPercent: string;
  appearanceGrade: "A" | "B" | "C" | "unknown";
  repairHistory: "none" | "minor" | "major" | "unknown";
  usageLevel: "low" | "normal" | "heavy" | "unknown";
  accessoriesStatus: "complete" | "missing_minor" | "missing_key" | "unknown";
  originalPackaging: "yes" | "no" | "unknown";
  purchaseInvoiceAvailable: "yes" | "no" | "unknown";
  marketAvailability: "available" | "rare" | "discontinued" | "unknown";
  valuationNotes: string;
};

export type AiPriceEstimate = {
  currency: "تومان";
  source: string;
  generatedAt: string;
  estimatedUnitMin: number;
  estimatedUnitFair: number;
  estimatedUnitMax: number;
  estimatedTotalMin: number;
  estimatedTotalFair: number;
  estimatedTotalMax: number;
  confidence: number;
  depreciationPercent: number;
  summary: string;
  factors: string[];
};

const defaultFactors: ProductValuationFactors = {
  productCondition: "unknown",
  sameNewProductPrice: "",
  manufactureYear: "",
  warrantyStatus: "unknown",
  warrantyMonths: "",
  partsHealth: "unknown",
  batteryHealthPercent: "",
  appearanceGrade: "unknown",
  repairHistory: "unknown",
  usageLevel: "unknown",
  accessoriesStatus: "unknown",
  originalPackaging: "unknown",
  purchaseInvoiceAvailable: "unknown",
  marketAvailability: "unknown",
  valuationNotes: "",
};

export function money(value: string | number) {
  return Math.max(0, Number(String(value).replace(/\D/g, "")) || 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeProductValuationFactors(input: Partial<ProductValuationFactors> | undefined | null): ProductValuationFactors {
  const source = input || {};
  return {
    productCondition: normalizeEnum(source.productCondition, ["new", "open_box", "refurbished", "used_like_new", "used_good", "used_fair", "for_parts", "unknown"] as const, "unknown"),
    sameNewProductPrice: String(source.sameNewProductPrice || "").trim(),
    manufactureYear: String(source.manufactureYear || "").replace(/\D/g, "").slice(0, 4),
    warrantyStatus: normalizeEnum(source.warrantyStatus, ["manufacturer", "seller", "test", "none", "unknown"] as const, "unknown"),
    warrantyMonths: String(source.warrantyMonths || "").replace(/\D/g, "").slice(0, 3),
    partsHealth: normalizeEnum(source.partsHealth, ["all_healthy", "minor_issue", "needs_repair", "unknown"] as const, "unknown"),
    batteryHealthPercent: String(source.batteryHealthPercent || "").replace(/\D/g, "").slice(0, 3),
    appearanceGrade: normalizeEnum(source.appearanceGrade, ["A", "B", "C", "unknown"] as const, "unknown"),
    repairHistory: normalizeEnum(source.repairHistory, ["none", "minor", "major", "unknown"] as const, "unknown"),
    usageLevel: normalizeEnum(source.usageLevel, ["low", "normal", "heavy", "unknown"] as const, "unknown"),
    accessoriesStatus: normalizeEnum(source.accessoriesStatus, ["complete", "missing_minor", "missing_key", "unknown"] as const, "unknown"),
    originalPackaging: normalizeEnum(source.originalPackaging, ["yes", "no", "unknown"] as const, "unknown"),
    purchaseInvoiceAvailable: normalizeEnum(source.purchaseInvoiceAvailable, ["yes", "no", "unknown"] as const, "unknown"),
    marketAvailability: normalizeEnum(source.marketAvailability, ["available", "rare", "discontinued", "unknown"] as const, "unknown"),
    valuationNotes: String(source.valuationNotes || "").trim().slice(0, 1000),
  };
}

export function estimateFairUsedProductPrice(input: {
  title: string;
  category: string;
  budget: string | number;
  quantity: string | number;
  factors?: Partial<ProductValuationFactors> | null;
}): AiPriceEstimate {
  const factors = normalizeProductValuationFactors(input.factors);
  const quantity = Math.max(1, Number(String(input.quantity || 1).replace(/\D/g, "")) || 1);
  const totalBudget = money(input.budget);
  const sameNewUnitPrice = money(factors.sameNewProductPrice);
  const baseUnitPrice = sameNewUnitPrice || Math.round(totalBudget / quantity) || 0;
  const currentYear = new Date().getFullYear();
  const manufactureYear = Number(factors.manufactureYear || 0);
  const age = manufactureYear >= 1990 && manufactureYear <= currentYear + 1 ? Math.max(0, currentYear - manufactureYear) : 0;
  const factorNotes: string[] = [];
  let depreciation = 0;
  let unknowns = 0;

  const conditionPenalty: Record<ProductCondition, number> = {
    new: 0,
    open_box: 0.08,
    refurbished: 0.18,
    used_like_new: 0.22,
    used_good: 0.32,
    used_fair: 0.45,
    for_parts: 0.68,
    unknown: 0.28,
  };
  depreciation += conditionPenalty[factors.productCondition];
  if (factors.productCondition === "unknown") unknowns += 1;
  else factorNotes.push(`وضعیت کالا: ${conditionLabel(factors.productCondition)}`);

  const ageRate = input.category.includes("دیجیتال") ? 0.055 : input.category.includes("خودرو") ? 0.045 : 0.035;
  if (age > 0) {
    const agePenalty = clamp(age * ageRate, 0, 0.42);
    depreciation += agePenalty;
    factorNotes.push(`سال ساخت ${manufactureYear} و افت سنی حدود ${Math.round(agePenalty * 100)}٪`);
  } else {
    unknowns += 1;
  }

  if (factors.warrantyStatus === "manufacturer") {
    depreciation -= 0.08;
    factorNotes.push("گارانتی رسمی/شرکتی ارزش کالا را افزایش می‌دهد");
  } else if (factors.warrantyStatus === "seller") {
    depreciation -= 0.04;
    factorNotes.push("گارانتی فروشنده لحاظ شد");
  } else if (factors.warrantyStatus === "test") {
    depreciation -= 0.015;
    factorNotes.push("مهلت تست کوتاه لحاظ شد");
  } else if (factors.warrantyStatus === "none") {
    depreciation += 0.08;
    factorNotes.push("نداشتن گارانتی باعث افت قیمت شد");
  } else {
    unknowns += 1;
  }

  const warrantyMonths = Number(factors.warrantyMonths || 0);
  if (warrantyMonths > 0) depreciation -= clamp(warrantyMonths * 0.003, 0, 0.08);

  if (factors.partsHealth === "all_healthy") {
    factorNotes.push("سلامت کامل قطعات امتیاز مثبت دارد");
  } else if (factors.partsHealth === "minor_issue") {
    depreciation += 0.08;
    factorNotes.push("ایراد جزئی قطعات لحاظ شد");
  } else if (factors.partsHealth === "needs_repair") {
    depreciation += 0.25;
    factorNotes.push("نیاز به تعمیر افت جدی قیمت ایجاد می‌کند");
  } else {
    depreciation += 0.05;
    unknowns += 1;
  }

  const battery = Number(factors.batteryHealthPercent || 0);
  if (battery > 0) {
    if (battery < 50) depreciation += 0.14;
    else if (battery < 70) depreciation += 0.09;
    else if (battery < 85) depreciation += 0.045;
    else depreciation -= 0.015;
    factorNotes.push(`سلامت باتری ${battery}٪ در تخمین لحاظ شد`);
  }

  if (factors.appearanceGrade === "B") depreciation += 0.06;
  else if (factors.appearanceGrade === "C") depreciation += 0.15;
  else if (factors.appearanceGrade === "A") depreciation -= 0.02;
  else unknowns += 1;

  if (factors.repairHistory === "minor") depreciation += 0.045;
  else if (factors.repairHistory === "major") depreciation += 0.18;
  else if (factors.repairHistory === "none") depreciation -= 0.02;
  else unknowns += 1;

  if (factors.usageLevel === "low") depreciation -= 0.025;
  else if (factors.usageLevel === "heavy") depreciation += 0.08;
  else if (factors.usageLevel === "unknown") unknowns += 1;

  if (factors.accessoriesStatus === "missing_minor") depreciation += 0.03;
  else if (factors.accessoriesStatus === "missing_key") depreciation += 0.08;
  else if (factors.accessoriesStatus === "complete") depreciation -= 0.02;
  else unknowns += 1;

  if (factors.originalPackaging === "yes") depreciation -= 0.015;
  if (factors.purchaseInvoiceAvailable === "yes") depreciation -= 0.015;
  if (factors.marketAvailability === "rare") depreciation -= 0.04;
  else if (factors.marketAvailability === "discontinued") depreciation += 0.04;

  depreciation = clamp(depreciation, 0, 0.82);
  const fairUnit = Math.max(0, Math.round(baseUnitPrice * (1 - depreciation)));
  const rangePercent = clamp(0.1 + unknowns * 0.025 + (sameNewUnitPrice ? 0 : 0.08), 0.1, 0.32);
  const minUnit = Math.round(fairUnit * (1 - rangePercent));
  const maxUnit = Math.round(fairUnit * (1 + rangePercent));
  const confidence = clamp(88 - unknowns * 6 + (sameNewUnitPrice ? 8 : -8) + (factors.valuationNotes ? 3 : 0), 25, 95);

  return {
    currency: "تومان",
    source: "OptiBid AI valuation v1 - rule based fair price estimate",
    generatedAt: new Date().toISOString(),
    estimatedUnitMin: minUnit,
    estimatedUnitFair: fairUnit,
    estimatedUnitMax: maxUnit,
    estimatedTotalMin: minUnit * quantity,
    estimatedTotalFair: fairUnit * quantity,
    estimatedTotalMax: maxUnit * quantity,
    confidence,
    depreciationPercent: Math.round(depreciation * 100),
    summary: sameNewUnitPrice
      ? `قیمت نو مشابه مبنا قرار گرفت و با افت کیفیت/سن/گارانتی به قیمت منصفانه دست‌دوم تبدیل شد.`
      : `چون قیمت نو مشابه وارد نشده، بودجه هر واحد مبنای تخمین قرار گرفت و دقت پایین‌تر است.`,
    factors: factorNotes.slice(0, 10),
  };
}

export function conditionLabel(value: ProductCondition) {
  const labels: Record<ProductCondition, string> = {
    new: "نو",
    open_box: "اپن‌باکس",
    refurbished: "ریفربیشد/بازسازی‌شده",
    used_like_new: "دست‌دوم در حد نو",
    used_good: "دست‌دوم سالم",
    used_fair: "دست‌دوم معمولی",
    for_parts: "نیازمند تعمیر/قطعاتی",
    unknown: "نامشخص",
  };
  return labels[value] || labels.unknown;
}
