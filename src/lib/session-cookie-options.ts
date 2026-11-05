/**
 * گزینه‌های کوکی نشست.
 *
 * پیش‌نمایش‌های Arena داخل یک iframe با دامنهٔ متفاوت (arena.ai) نمایش داده
 * می‌شوند. کروم کوکی با `SameSite=Lax` را در چنین iframeهای cross-site ذخیره
 * نمی‌کند؛ نتیجه اینکه ورود «موفق» به نظر می‌رسد ولی نشست از بین می‌رود و
 * کاربر دوباره در صفحهٔ لاگین یا هدر بدون ورود قرار می‌گیرد.
 *
 * بنابراین وقتی درخواست از دامنهٔ پروکسی/HTTPS می‌آید از کوکی
 * `SameSite=None; Secure; Partitioned` استفاده می‌کنیم (CHIPS) که در iframe هم
 * ذخیره و ارسال می‌شود. روی localhost تغییر نمی‌کند.
 */

export type SessionCookieOptions = {
  httpOnly: true;
  path: string;
  maxAge: number;
  sameSite: "lax" | "none";
  secure: boolean;
  partitioned: boolean;
};

function isCrossSiteContext(request: Request) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const proto = (request.headers.get("x-forwarded-proto") || "").toLowerCase();
  const isHttps = proto === "https" || host.endsWith(".e2b.app") || host.endsWith(".arena.site");
  const isProxyHost = host.endsWith(".e2b.app") || host.endsWith(".arena.site");
  return isHttps || isProxyHost;
}

export function sessionCookieOptions(
  request: Request,
  maxAge: number,
): SessionCookieOptions {
  const crossSite = isCrossSiteContext(request);
  return {
    httpOnly: true,
    path: "/",
    maxAge,
    sameSite: crossSite ? "none" : "lax",
    // روی HTTPS (پیش‌نمایش) کوکی امن لازم است؛ روی http معمولاً نه.
    secure: crossSite,
    // فقط با SameSite=None معنا دارد و به iframe اجازهٔ نگه‌داری می‌دهد.
    partitioned: crossSite,
  };
}
