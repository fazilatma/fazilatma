import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// نکته: قرارداد middleware.ts (به جای proxy.ts در Next 16) عمداً انتخاب شده است،
// چون آداپتور OpenNext برای Cloudflare در حال حاضر فقط Middleware لبه (Edge) را
// پشتیبانی می‌کند و proxy.ts همیشه روی رانتایم Node اجرا می‌شود.
// این میدل‌ور فقط یک کوکی را بررسی می‌کند و با Edge کاملاً سازگار است.
export function middleware(request: NextRequest) {
  const isAdmin = request.cookies.get("optibid_admin")?.value === "1";
  if (!isAdmin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
