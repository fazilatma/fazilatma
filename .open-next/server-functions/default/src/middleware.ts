import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPagePrefixes = ["/login", "/register", "/forgot-password"];

const publicApiPrefixes = [
  "/api/login",
  "/api/register",
  "/api/logout",
  "/api/auth/social",
  "/api/password",
  "/api/live-content",
  "/api/catalog-categories",
  "/api/health",
];

function isPublicPath(pathname: string) {
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

function unauthorizedApi() {
  return NextResponse.json(
    {
      success: false,
      message: "برای دسترسی به این بخش باید ابتدا ثبت‌نام و ورود کنید.",
    },
    { status: 401 },
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) return NextResponse.next();

  const isAdmin = request.cookies.get("optibid_admin")?.value === "1";
  const hasUserSession = Boolean(request.cookies.get("optibid_user")?.value);

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      if (pathname.startsWith("/api/")) return unauthorizedApi();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!hasUserSession && !isAdmin) {
    if (pathname.startsWith("/api/")) return unauthorizedApi();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
