import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  authenticateOrCreateJsonSocialUser,
  getJsonPlatformFinance,
} from "@/lib/json-store";

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

async function clientConfig(provider: Provider) {
  const finance = await getJsonPlatformFinance().catch(() => null);
  const settings = finance?.settings;
  if (provider === "google") {
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      settings?.googleOAuthClientId ||
      "";
    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET ||
      settings?.googleOAuthClientSecret ||
      "";
    return {
      enabled: Boolean(
        settings?.googleOAuthEnabled ||
        (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      ),
      clientId,
      clientSecret,
      baseUrl: settings?.socialAuthBaseUrl || "",
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: "openid email profile",
    };
  }
  const clientId =
    process.env.FACEBOOK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ||
    settings?.facebookOAuthClientId ||
    "";
  const clientSecret =
    process.env.FACEBOOK_CLIENT_SECRET ||
    settings?.facebookOAuthClientSecret ||
    "";
  return {
    enabled: Boolean(
      settings?.facebookOAuthEnabled ||
      (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    ),
    clientId,
    clientSecret,
    baseUrl: settings?.socialAuthBaseUrl || "",
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function socialSuccessHtml(input: {
  provider: Provider;
  role: "buyer" | "seller";
  redirect: string;
  user: { id: number; fullName: string; role: string };
  demo: boolean;
}) {
  const providerFa = input.provider === "google" ? "گوگل" : "فیسبوک";
  const userJson = JSON.stringify(input.user).replace(/</g, "\\u003c");
  const redirectJson = JSON.stringify(input.redirect || "");
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>ورود با ${providerFa}</title><style>body{margin:0;background:linear-gradient(135deg,#16a34a,#003b5c);font-family:Tahoma,Arial,sans-serif;color:#0f172a}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:560px;width:100%;background:#fff;border-radius:28px;padding:32px;text-align:center;box-shadow:0 24px 70px rgba(15,23,42,.25)}.icon{width:74px;height:74px;border-radius:999px;margin:0 auto 18px;display:grid;place-items:center;font-size:32px;background:#dcfce7;color:#15803d}h1{margin:0 0 12px;color:#003b5c;font-size:23px}p{line-height:2;color:#475569}.notice{margin-top:16px;border-radius:16px;background:#eff6ff;color:#1d4ed8;padding:12px;font-size:13px}.btn{display:inline-block;margin-top:18px;border-radius:14px;background:#003b5c;color:white;padding:12px 18px;text-decoration:none;font-weight:800}</style></head><body><main class="wrap"><section class="card"><div class="icon">✓</div><h1>${escapeHtml(input.demo ? `ورود آزمایشی با ${providerFa} فعال شد` : `ورود با ${providerFa} موفق بود`)}</h1><p>حساب شما آماده است و تا چند لحظه دیگر به داشبورد منتقل می‌شوید.</p>${input.demo ? `<div class="notice">برای اتصال واقعی به ${providerFa}، Client ID و Client Secret را در پنل ادمین ثبت کنید. تا آن زمان این مسیر به صورت آزمایشی کار می‌کند تا دکمه بی‌عمل نباشد.</div>` : ""}<a class="btn" href="/${input.role}/dashboard">رفتن به داشبورد</a></section></main><script>const user=${userJson};localStorage.setItem("userRole",user.role);localStorage.setItem("userId",String(user.id));localStorage.setItem("userDisplayName",user.fullName);const saved=sessionStorage.getItem("redirectAfterAuth");if(saved)sessionStorage.removeItem("redirectAfterAuth");const preferred=${redirectJson};const dashboard='/' + user.role + '/dashboard';setTimeout(()=>{window.location.replace((saved&&saved.startsWith('/')&&!saved.startsWith('//'))?saved:(preferred||dashboard));},900);</script></body></html>`;
}

async function demoSocialLogin(
  provider: Provider,
  role: "buyer" | "seller",
  redirect: string,
) {
  const providerFa = provider === "google" ? "گوگل" : "فیسبوک";
  const user = await authenticateOrCreateJsonSocialUser({
    provider,
    providerUserId: `demo-${provider}-${role}`,
    email: `demo-${provider}-${role}@optibid.local`,
    fullName: `${role === "seller" ? "فروشنده" : "خریدار"} ${providerFa} OptiBid`,
    role,
  });
  return new NextResponse(
    socialSuccessHtml({
      provider,
      role,
      redirect,
      user: { id: user.id, fullName: user.fullName, role: user.role },
      demo: true,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
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
  const config = await clientConfig(provider);
  const credentialsMissing = !config.clientId || !config.clientSecret;
  if (credentialsMissing) {
    return demoSocialLogin(provider, role, redirect);
  }
  if (!config.enabled) {
    const message = encodeURIComponent(
      `ورود با ${provider === "google" ? "گوگل" : "فیسبوک"} در پنل ادمین غیرفعال است.`,
    );
    return NextResponse.redirect(
      new URL(`/login?social_error=${message}`, request.url),
    );
  }

  const baseUrl = (config.baseUrl || baseUrlFromRequest(request)).replace(
    /\/+$/,
    "",
  );
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
