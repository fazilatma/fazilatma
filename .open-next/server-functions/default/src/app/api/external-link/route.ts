import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "https://optibid.arena.site";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_EXTERNAL_BASE_URL ||
      process.env.EXTERNAL_BASE_URL ||
      "https://optibid.arena.site"
  );

  return NextResponse.json({
    externalUrl: `${baseUrl}${safePath}`,
    hostFormat: "*.arena.site",
    note: "برای فعال شدن واقعی این لینک، دامنه باید در پنل هاست یا پلتفرم به سامانه متصل شود.",
  });
}
