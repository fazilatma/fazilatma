import { normalizeStorePriceMultiplier } from "@/lib/store-pricing";

function decodeAmpEntities(value: string) {
  let output = value;
  for (let pass = 0; pass < 5; pass += 1) {
    const decoded = output.replace(/&amp;/gi, "&");
    if (decoded === output) break;
    output = decoded;
  }
  return output;
}

export function parseSourceLinks(value: unknown, maximum = 8) {
  const joined = Array.isArray(value) ? value.map(String).join("\n") : String(value || "");
  const normalized = decodeAmpEntities(joined)
    .replace(/\s*&\s*(?=https?:\/\/)/gi, "\n")
    .replace(/[|،]+(?=\s*https?:\/\/)/gi, "\n");
  const matches = normalized.match(/https?:\/\/[^\s<>"'()[\]]+/gi) || [];
  const links: string[] = [];
  for (const match of matches) {
    const cleaned = match.replace(/[.,;،]+$/g, "");
    try {
      const url = new URL(cleaned);
      if ((url.protocol === "http:" || url.protocol === "https:") && !links.includes(url.toString())) {
        links.push(url.toString());
      }
    } catch {
      // Ignore malformed fragments around links copied from rich text or Markdown.
    }
    if (links.length >= maximum) break;
  }
  return links;
}

export type ComputerPartSourceLinkEntry = {
  url: string;
  parts: string[];
  /** ضریب اختصاصی همین لینک؛ قیمت‌های دانلودشده از این لینک در آن ضرب می‌شوند. */
  priceMultiplier: number;
};

/**
 * خواندن باکس‌های لینک مرجع قطعات از مقدار ذخیره‌شده در تنظیمات
 * (`storeComputerPartsSourceUrl`) که به‌صورت JSON شامل url/parts/priceMultiplier
 * ذخیره می‌شود. مقادیر قدیمیِ متنی (فقط لینک) هم با ضریب ۱ خوانده می‌شوند.
 */
export function parseComputerPartSourceEntries(
  value: unknown,
  maximum = 8,
): ComputerPartSourceLinkEntry[] {
  const raw = String(value || "").trim();
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object" && !Array.isArray(item))
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              url: String(record.url || "").trim(),
              parts: Array.isArray(record.parts)
                ? [...new Set(record.parts.map((part) => String(part).trim().toLowerCase()).filter(Boolean))]
                : [],
              priceMultiplier: normalizeStorePriceMultiplier(record.priceMultiplier, 1),
            };
          })
          .filter((entry) => entry.url)
          .slice(0, maximum);
      }
    } catch {
      // مقادیر قدیمیِ غیر JSON در ادامه به‌صورت لینک ساده خوانده می‌شوند.
    }
  }
  return parseSourceLinks(raw, maximum).map((url) => ({
    url,
    parts: [],
    priceMultiplier: 1,
  }));
}

function normalizedHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * ضریب اختصاصی لینکی که محصول از آن آمده است؛ تطبیق بر اساس هاستِ لینک صفحهٔ
 * محصول (`externalSourceUrl`) با هاست باکس لینک انجام می‌شود. اگر چند باکس روی
 * یک هاست باشند، اولین ضریبِ متفاوت از ۱ اعمال می‌شود.
 */
export function computerPartSourceMultiplierForProductUrl(
  entries: ComputerPartSourceLinkEntry[],
  productUrl: string,
) {
  const host = normalizedHost(productUrl || "");
  if (!host) return 1;
  let fallback = 1;
  for (const entry of entries) {
    const entryHost = normalizedHost(entry.url);
    if (!entryHost) continue;
    if (entryHost === host || entryHost.endsWith(`.${host}`) || host.endsWith(`.${entryHost}`)) {
      const multiplier = normalizeStorePriceMultiplier(entry.priceMultiplier, 1);
      if (multiplier !== 1) return multiplier;
      fallback = multiplier;
    }
  }
  return fallback;
}
