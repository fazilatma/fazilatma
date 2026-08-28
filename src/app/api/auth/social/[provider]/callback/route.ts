import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authenticateOrCreateJsonSocialUser,
  type SocialAuthProvider,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

type Provider = SocialAuthProvider;
type RouteContext = {
  params: Promise<{ provider: string }> | { provider: string };
};

type SocialState = {
  provider: Provider;
  role: "buyer" | "seller";
  redirect: string;
  nonce: string;
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

function decodeState(value: string): SocialState | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      parsed &&
      (parsed.provider === "google" || parsed.provider === "facebook") &&
      (parsed.role === "buyer" || parsed.role === "seller") &&
      typeof parsed.nonce === "string"
    ) {
      return {
        provider: parsed.provider,
        role: parsed.role,
        redirect:
          typeof parsed.redirect === "string" &&
          parsed.redirect.startsWith("/") &&
          !parsed.redirect.startsWith("//")
            ? parsed.redirect
            : "",
        nonce: parsed.nonce,
      };
    }
  } catch {
    // invalid state
  }
  return null;
}

function oauthConfig(provider: Provider) {
  if (provider === "google") {
    return {
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    };
  }
  return {
    clientId:
      process.env.FACEBOOK_CLIENT_ID ||
      process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ||
      "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
    userInfoUrl:
      "https://graph.facebook.com/me?fields=id,name,email,picture.width(256).height(256)",
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resultHtml(input: {
  ok: boolean;
  title: string;
  message: string;
  user?: { id: number; fullName: string; role: string };
  redirect?: string;
}) {
  const userJson = input.user
    ? JSON.stringify(input.user).replace(/</g, "\\u003c")
    : "null";
  const redirectJson = JSON.stringify(input.redirect || "");
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(input.title)}</title><style>body{margin:0;background:linear-gradient(135deg,#16a34a,#003b5c);font-family:Tahoma,Arial,sans-serif;color:#0f172a}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:520px;width:100%;background:#fff;border-radius:28px;padding:32px;text-align:center;box-shadow:0 24px 70px rgba(15,23,42,.25)}.icon{width:74px;height:74px;border-radius:999px;margin:0 auto 18px;display:grid;place-items:center;font-size:32px;background:${input.ok ? "#dcfce7;color:#15803d" : "#fee2e2;color:#b91c1c"}}h1{margin:0 0 12px;color:#003b5c;font-size:23px}p{line-height:2;color:#475569}.btn{display:inline-block;margin-top:18px;border-radius:14px;background:#003b5c;color:white;padding:12px 18px;text-decoration:none;font-weight:800}</style></head><body><main class="wrap"><section class="card"><div class="icon">${input.ok ? "✓" : "!"}</div><h1>${escapeHtml(input.title)}</h1><p>${escapeHtml(input.message)}</p><a class="btn" href="/login">بازگشت به ورود</a></section></main>${input.ok && input.user ? `<script>const user=${userJson};localStorage.setItem("userRole",user.role);localStorage.setItem("userId",String(user.id));localStorage.setItem("userDisplayName",user.fullName);const saved=sessionStorage.getItem("redirectAfterAuth");if(saved)sessionStorage.removeItem("redirectAfterAuth");const preferred=${redirectJson};const dashboard='/' + (user.role === 'admin' ? 'admin' : user.role) + '/dashboard';setTimeout(()=>{window.location.replace((saved&&saved.startsWith('/')&&!saved.startsWith('//'))?saved:(preferred||dashboard));},900);</script>` : ""}</body></html>`;
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  config: ReturnType<typeof oauthConfig>,
) {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token)
    throw new Error(
      token.error_description || token.error || "Google token exchange failed",
    );
  const profileResponse = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !profile.sub)
    throw new Error("Google profile fetch failed");
  return {
    providerUserId: String(profile.sub),
    email: String(profile.email || ""),
    fullName: String(profile.name || profile.email || "کاربر گوگل"),
  };
}

async function exchangeFacebookCode(
  code: string,
  redirectUri: string,
  config: ReturnType<typeof oauthConfig>,
) {
  const tokenUrl = new URL(config.tokenUrl);
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);
  const response = await fetch(tokenUrl, {
    headers: { Accept: "application/json" },
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token)
    throw new Error(
      token.error?.message ||
        token.error_description ||
        "Facebook token exchange failed",
    );
  const profileUrl = new URL(config.userInfoUrl);
  profileUrl.searchParams.set("access_token", String(token.access_token));
  const profileResponse = await fetch(profileUrl, {
    headers: { Accept: "application/json" },
  });
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !profile.id)
    throw new Error(profile.error?.message || "Facebook profile fetch failed");
  return {
    providerUserId: String(profile.id),
    email: String(
      profile.email || `facebook-${profile.id}@social.optibid.local`,
    ),
    fullName: String(profile.name || "کاربر فیسبوک"),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const provider = await readProvider(context);
  const url = new URL(request.url);
  const stateParam = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const oauthError = url.searchParams.get("error") || "";
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("optibid_social_state")?.value || "";

  if (!provider) {
    return new NextResponse(
      resultHtml({
        ok: false,
        title: "ورود اجتماعی نامعتبر",
        message: "ارائه‌دهنده ورود پشتیبانی نمی‌شود.",
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  try {
    if (oauthError)
      throw new Error(`درخواست ورود توسط ارائه‌دهنده رد شد: ${oauthError}`);
    if (!stateParam || !cookieState || stateParam !== cookieState)
      throw new Error(
        "اعتبار نشست ورود اجتماعی منقضی شده است؛ لطفاً دوباره تلاش کنید.",
      );
    const state = decodeState(stateParam);
    if (!state || state.provider !== provider)
      throw new Error("State ورود اجتماعی نامعتبر است.");
    if (!code) throw new Error("کد تایید ورود اجتماعی دریافت نشد.");

    const config = oauthConfig(provider);
    if (!config.clientId || !config.clientSecret)
      throw new Error("تنظیمات Client ID / Client Secret کامل نیست.");
    const redirectUri = `${baseUrlFromRequest(request)}/api/auth/social/${provider}/callback`;
    const profile =
      provider === "google"
        ? await exchangeGoogleCode(code, redirectUri, config)
        : await exchangeFacebookCode(code, redirectUri, config);
    const user = await authenticateOrCreateJsonSocialUser({
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      fullName: profile.fullName,
      role: state.role,
    });

    const response = new NextResponse(
      resultHtml({
        ok: true,
        title:
          provider === "google"
            ? "ورود با گوگل موفق بود"
            : "ورود با فیسبوک موفق بود",
        message: "حساب شما تایید شد و تا چند لحظه دیگر وارد داشبورد می‌شوید.",
        user: { id: user.id, fullName: user.fullName, role: user.role },
        redirect: state.redirect,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
    response.cookies.set("optibid_social_state", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "خطای ناشناخته در ورود اجتماعی";
    const response = new NextResponse(
      resultHtml({
        ok: false,
        title:
          provider === "google"
            ? "ورود با گوگل ناموفق بود"
            : "ورود با فیسبوک ناموفق بود",
        message: detail,
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
    response.cookies.set("optibid_social_state", "", { path: "/", maxAge: 0 });
    return response;
  }
}
