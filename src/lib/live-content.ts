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
  cityFa: "آبادان",
  cityEn: "Abadan",
  streetFa: "خیابان ولیعصر",
  contactAddressFa: "آبادان، خیابان ولیعصر، برج فناوری، طبقه ۱۰",
  footerAddressFa: "آبادان، خیابان ولیعصر",
  invoiceCompanyAddressFa: "آبادان، خیابان ولیعصر، مجتمع تجاری نور",
  invoiceCompanyAddressEn: "No.123, Valiasr St., Abadan, Iran",
  invoiceShippingAddressFa: "آبادان، جاده مخصوص، کیلومتر ۱۴",
  registerCityExampleFa: "آبادان، آبادان",
};

const LIVE_CONTENT_URL =
  process.env.NEXT_PUBLIC_LIVE_CONTENT_URL ||
  "https://raw.githubusercontent.com/fazilatma/fazilatma/refs/heads/arena/01a020d5-fazilatma/data/live-content.json";

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
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

export function getLiveContentUrl() {
  // GitHub Raw و CDNهای بین مسیر ممکن است URL ثابت branch را چند دقیقه cache کنند.
  // این bucket کوتاه، بدون نیاز به build، refreshهای بعد از push را سریع‌تر به نسخه جدید می‌رساند.
  const cacheBucket = Math.floor(Date.now() / 15_000);
  const separator = LIVE_CONTENT_URL.includes("?") ? "&" : "?";
  return `${LIVE_CONTENT_URL}${separator}liveContentTs=${cacheBucket}`;
}

export async function getLiveContent(): Promise<LiveContent> {
  try {
    const response = await fetch(getLiveContentUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) return DEFAULT_LIVE_CONTENT;
    const data = await response.json();
    return normalizeLiveContent(data);
  } catch {
    return DEFAULT_LIVE_CONTENT;
  }
}
