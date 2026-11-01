import { kvGetText, kvPutText } from "@/lib/kv-storage";
import { normalizeProductImageAttachments, type ProductImageAttachment } from "@/lib/product-image-shared";

const ENAMAD_SETTINGS_KEY = "optibid:enamad-settings";

export type EnamadSettings = {
  enabled: boolean;
  title: string;
  verificationUrl: string;
  logoUrl: string;
  logoImage?: ProductImageAttachment;
};

export const defaultEnamadSettings: EnamadSettings = {
  enabled: false,
  title: "نماد اعتماد الکترونیکی",
  verificationUrl: "",
  logoUrl: "",
};

export async function getEnamadSettings(): Promise<EnamadSettings> {
  try {
    const raw = await kvGetText(ENAMAD_SETTINGS_KEY);
    if (!raw) return { ...defaultEnamadSettings };
    const parsed = JSON.parse(raw) as Partial<EnamadSettings>;
    const logoImage = normalizeProductImageAttachments(parsed.logoImage ? [parsed.logoImage] : [])[0];
    return {
      enabled: parsed.enabled === true,
      title: String(parsed.title || defaultEnamadSettings.title).trim().slice(0, 100),
      verificationUrl: String(parsed.verificationUrl || "").trim().slice(0, 1000),
      logoUrl: String(parsed.logoUrl || "").trim().slice(0, 1000),
      ...(logoImage ? { logoImage } : {}),
    };
  } catch {
    return { ...defaultEnamadSettings };
  }
}

export async function saveEnamadSettings(settings: EnamadSettings) {
  await kvPutText(ENAMAD_SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}
