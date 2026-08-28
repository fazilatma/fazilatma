import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Provider = "google" | "facebook";
type RouteContext = {
  params: Promise<{ provider: string }> | { provider: string };
};

function providerFromValue(value: string): Provider | null {
  return value === "google" || value === "facebook" ? value : null;
}

async function readProvider(context: RouteContext) {
  const params = await context.params;
  return providerFromValue(params.provider);
}

function baseUrlFromRequest(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured?.startsWith("https://")) return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function clientConfig(provider: Provider) {
  if (provider === "google") {
    return {
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: "openid email profile",
    };
  }
  return {
    clientId:
      process.env.FACEBOOK_CLIENT_ID ||
      process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ||
      "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    scope: "email public_profile",
  };
}

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "";
}

function encodeState(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export async function GET(request: Request, context: RouteContext) {
  const provider = await readProvider(context);
  if (!provider) {
    return NextResponse.redirect(
      new URL("/login?social_error=provider", request.url),
    );
  }

  const url = new URL(request.url);
  const role = url.searchParams.get("role") === "seller" ? "seller" : "buyer";
  const redirect = safeRedirect(url.searchParams.get("redirect"));
  const config = clientConfig(provider);
  const missing: string[] = [];
  if (!config.clientId)
    missing.push(
      provider === "google" ? "GOOGLE_CLIENT_ID" : "FACEBOOK_CLIENT_ID",
    );
  if (!config.clientSecret)
    missing.push(
      provider === "google" ? "GOOGLE_CLIENT_SECRET" : "FACEBOOK_CLIENT_SECRET",
    );
  if (missing.length > 0) {
    const message = encodeURIComponent(
      `ورود با ${provider === "google" ? "گوگل" : "فیسبوک"} هنوز کامل تنظیم نشده است. متغیرهای ${missing.join(" و ")} را در Cloudflare Workers اضافه کنید.`,
    );
    return NextResponse.redirect(
      new URL(`/login?social_error=${message}`, request.url),
    );
  }

  const baseUrl = baseUrlFromRequest(request);
  const callbackUrl = `${baseUrl}/api/auth/social/${provider}/callback`;
  const nonce = randomBytes(16).toString("hex");
  const state = encodeState({ provider, role, redirect, nonce });
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state);
  if (provider === "google") {
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("prompt", "select_account");
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("optibid_social_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
