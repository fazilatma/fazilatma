import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyPreviewAdminToken } from "@/lib/preview-admin-token";

const publicPagePrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/shop",
  "/cart",
  "/support",
];

const publicApiPrefixes = [
  "/api/login",
  "/api/register",
  "/api/logout",
  "/api/auth/social",
  "/api/password",
  "/api/live-content",
  "/api/catalog-categories",
  "/api/site-mode",
  "/api/enamad",
  "/api/support-chat",
  "/api/shop/prices",
  // تیک سبک تازه‌سازی قیمت که از خود صفحات فروشگاه صدا زده می‌شود.
  "/api/store/price-refresh-tick",
  "/api/torob",
  "/api/health",
  "/api/session",
  // ربات به‌روزرسانی روزانهٔ قیمت لینک‌ها؛ داخل خود مسیر با CRON_SECRET محافظت می‌شود.
  "/api/store-products/auto-refresh",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;
  if (
    publicPagePrefixes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return true;
  if (
    publicApiPrefixes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return true;
  return false;
}

/**
 * مسیر فعلی را در هدر درخواست به لایهٔ سرور (layout) می‌رساند؛ layout در App Router
 * خودش pathname ندارد و برای «صفحهٔ ورود/ثبت‌نام هرگز هدر ادمین نبیند» لازم است.
 */
function forwardWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-optibid-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

function unauthorizedApi() {
  return NextResponse.json(
    {
      success: false,
      message: "برای دسترسی به این بخش باید ابتدا ثبت‌نام و ورود کنید.",
    },
    { status: 401 },
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // عیب‌یابی محلی: نشان می‌دهد آیا کوکی نشست از مرورگر می‌رسد یا نه.
  if (
    process.env.NODE_ENV !== "production" &&
    (pathname.startsWith("/admin") || pathname.startsWith("/api/login") || pathname.startsWith("/api/session"))
  ) {
    const names = request.cookies.getAll().map((cookie) => cookie.name);
    console.log(`[session] ${pathname} cookies=${names.join(",") || "none"}`);
  }
  const host = request.headers.get("host") || "";
  if (host.toLowerCase() === "www.optibid.ir") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "optibid.ir";
    canonicalUrl.protocol = "https";
    canonicalUrl.port = "";
    return NextResponse.redirect(canonicalUrl, 308);
  }
  if (isPublicPath(pathname)) return forwardWithPath(request);

  // در محیط پیش‌نمایش ممکن است کوکی در iframe ذخیره نشود؛ توکن کوتاه‌عمر
  // جایگزین فقط در توسعه پذیرفته می‌شود.
  const previewAdminTokenOk = await verifyPreviewAdminToken(
    request.headers.get("x-optibid-admin-token") ||
      request.nextUrl.searchParams.get("at"),
  );
  const isAdmin =
    request.cookies.get("optibid_admin")?.value === "1" || previewAdminTokenOk;
  const hasUserSession = Boolean(request.cookies.get("optibid_user")?.value);

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      if (pathname.startsWith("/api/")) return unauthorizedApi();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // توکن پیش‌نمایش: به لایه‌های سمت سرور (layout/header) اعلام می‌کنیم که
    // این درخواست ادمین است، چون کوکی در iframe ذخیره نشده است.
    if (previewAdminTokenOk) {
      const headers = new Headers(request.headers);
      headers.set("x-optibid-preview-admin", "1");
      headers.set("x-optibid-pathname", pathname);
      return NextResponse.next({ request: { headers } });
    }
    return forwardWithPath(request);
  }

  if (!hasUserSession && !isAdmin) {
    if (pathname.startsWith("/api/")) return unauthorizedApi();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return forwardWithPath(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
