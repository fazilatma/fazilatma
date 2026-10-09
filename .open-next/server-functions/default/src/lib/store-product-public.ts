const internalSpecKeyPatterns = [
  /url|link|لینک|آدرس/i,
  /csv/i,
  /قیمت\s*خام|raw\s*price/i,
  /ردیف\s*(?:csv|فایل)?|csv\s*row/i,
  /sourcehost|source\s*host/i,
];

export function publicStoreProductSpecs(specs: Record<string, string> = {}) {
  return Object.entries(specs).filter(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/[\s\u200c_-]+/g, "");
    const isSourceLabel = /^(?:source|sourcehost|منبع|منبعکالا|منبعواردات|مرجعقیمت)$/.test(normalizedKey);
    const isUrlValue = /^https?:\/\//i.test(String(value || "").trim());
    const isInternalField = internalSpecKeyPatterns.some((pattern) => pattern.test(key));
    return !(isSourceLabel || isInternalField || isUrlValue);
  });
}

export function publicStoreProductBadges(badges: string[] = []) {
  return badges.filter((badge) =>
    !/وارداتی|قیمت\s*(?:ثبت‌شده|به‌روز|خام|csv)|\bcsv\b|\bimport(?:ed)?\b|ضریب\s*\d/i.test(String(badge || "")),
  );
}
