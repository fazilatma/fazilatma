export function publicStoreProductSpecs(specs: Record<string, string> = {}) {
  return Object.entries(specs).filter(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    const isLinkField = /url|link|لینک|آدرس/i.test(normalizedKey);
    const isSourceField = /source|منبع/i.test(normalizedKey);
    const isUrlValue = /^https?:\/\//i.test(String(value || "").trim());
    return !(isLinkField || (isSourceField && isUrlValue) || isUrlValue);
  });
}
