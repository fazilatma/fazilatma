/**
 * توکن ورود ادمین برای محیط پیش‌نمایش.
 *
 * پیش‌نمایش‌ها داخل iframe با دامنهٔ دیگر اجرا می‌شوند و بعضی مرورگرها کوکی
 * نشست را در این حالت نگه نمی‌دارند. برای اینکه ورود ادمین در محیط توسعه
 * همیشه کار کند، علاوه بر کوکی یک توکن امضاشدهٔ کوتاه‌عمر صادر می‌شود.
 *
 * این مسیر فقط در حالت development فعال است؛ در production هیچ توکنی صادر یا
 * پذیرفته نمی‌شود و احراز هویت فقط با کوکی انجام می‌گیرد.
 */

const SECRET =
  process.env.OPTIBID_ADMIN_TOKEN_SECRET || "optibid-dev-preview-secret";
const TTL_MS = 1000 * 60 * 60 * 8; // ۸ ساعت

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64Url(new Uint8Array(signature));
}

export function previewAdminTokenEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function createPreviewAdminToken() {
  if (!previewAdminTokenEnabled()) return "";
  const expiresAt = Date.now() + TTL_MS;
  const signature = await sign(`admin:${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

export async function verifyPreviewAdminToken(token: string | null | undefined) {
  if (!previewAdminTokenEnabled() || !token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
    return false;
  }
  const expected = await sign(`admin:${expiresAt}`);
  return expected === signature;
}
