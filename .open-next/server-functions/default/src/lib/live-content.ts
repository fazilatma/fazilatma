export type LiveContent = {
  cityFa: string;
  cityEn: string;
  streetFa: string;
  contactAddressFa: string;
  footerAddressFa: string;
  invoiceCompanyAddressFa: string;
  invoiceCompanyAddressEn: string;
  invoiceShippingAddressFa: string;
  registerCityExampleFa: string;
};

export const LIVE_CONTENT_STORAGE_KEY = "optibid:live-content";

export const DEFAULT_LIVE_CONTENT: LiveContent = {
  cityFa: "تبریز",
  cityEn: "Tabriz",
  streetFa: "خیابان ولیعصر",
  contactAddressFa: "تبریز، خیابان ولیعصر، برج فناوری، طبقه ۱۰",
  footerAddressFa: "تبریز، خیابان ولیعصر",
  invoiceCompanyAddressFa: "تبریز، خیابان ولیعصر، مجتمع تجاری نور",
  invoiceCompanyAddressEn: "No.123, Valiasr St., Tabriz, Iran",
  invoiceShippingAddressFa: "تبریز، جاده مخصوص، کیلومتر ۱۴",
  registerCityExampleFa: "تبریز، تبریز",
};

const LIVE_CONTENT_BRANCH =
  process.env.NEXT_PUBLIC_LIVE_CONTENT_BRANCH || "arena/01a020d5-fazilatma";

const LIVE_CONTENT_RAW_URL =
  process.env.NEXT_PUBLIC_LIVE_CONTENT_URL ||
  `https://raw.githubusercontent.com/fazilatma/fazilatma/refs/heads/${LIVE_CONTENT_BRANCH}/data/live-content.json`;

const LIVE_CONTENT_API_URL =
  process.env.NEXT_PUBLIC_LIVE_CONTENT_API_URL ||
  `https://api.github.com/repos/fazilatma/fazilatma/contents/data/live-content.json?ref=${encodeURIComponent(
    LIVE_CONTENT_BRANCH
  )}`;

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function decodeBase64ToUtf8(value: string) {
  const normalized = value.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function normalizeLiveContent(input: unknown): LiveContent {
  const source = input && typeof input === "object" ? (input as Partial<LiveContent>) : {};
  const cityFa = cleanString(source.cityFa) || DEFAULT_LIVE_CONTENT.cityFa;
  const cityEn = cleanString(source.cityEn) || DEFAULT_LIVE_CONTENT.cityEn;
  const streetFa = cleanString(source.streetFa) || DEFAULT_LIVE_CONTENT.streetFa;

  return {
    cityFa,
    cityEn,
    streetFa,
    contactAddressFa:
      cleanString(source.contactAddressFa) || `${cityFa}، ${streetFa}، برج فناوری، طبقه ۱۰`,
    footerAddressFa: cleanString(source.footerAddressFa) || `${cityFa}، ${streetFa}`,
    invoiceCompanyAddressFa:
      cleanString(source.invoiceCompanyAddressFa) || `${cityFa}، ${streetFa}، مجتمع تجاری نور`,
    invoiceCompanyAddressEn:
      cleanString(source.invoiceCompanyAddressEn) || `No.123, Valiasr St., ${cityEn}, Iran`,
    invoiceShippingAddressFa:
      cleanString(source.invoiceShippingAddressFa) || `${cityFa}، جاده مخصوص، کیلومتر ۱۴`,
    registerCityExampleFa: cleanString(source.registerCityExampleFa) || `${cityFa}، ${cityFa}`,
  };
}

function withCacheBust(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}liveContentBust=${Date.now()}`;
}

export function getLiveContentUrl() {
  return withCacheBust(LIVE_CONTENT_API_URL);
}

async function fetchFromGithubApi() {
  const response = await fetch(getLiveContentUrl(), {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "Cache-Control": "no-cache",
      "User-Agent": "optibid-live-content",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) return null;
  const data = await response.json();

  if (typeof data?.content === "string") {
    return JSON.parse(decodeBase64ToUtf8(data.content));
  }

  return data;
}

async function fetchFromRawFallback() {
  const response = await fetch(withCacheBust(LIVE_CONTENT_RAW_URL), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function getLiveContent(): Promise<LiveContent> {
  try {
    const data = (await fetchFromGithubApi()) || (await fetchFromRawFallback());
    return normalizeLiveContent(data);
  } catch {
    return DEFAULT_LIVE_CONTENT;
  }
}
