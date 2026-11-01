/**
 * اطمینان از وجود KV Namespace برای دیپلوی Cloudflare Workers.
 *
 * این اسکریپت قبل از `wrangler deploy` اجرا می‌شود و شناسه KV مربوط به
 * binding `OPTIBID_KV` را داخل `wrangler.jsonc` ثبت می‌کند.
 *
 * حالت‌های پشتیبانی‌شده:
 *   1. اگر CLOUDFLARE_API_TOKEN موجود باشد، مستقیماً از Cloudflare REST API
 *      استفاده می‌شود. اگر CLOUDFLARE_ACCOUNT_ID/ACCOUNT_ID تنظیم نشده باشد،
 *      اسکریپت تلاش می‌کند account id را از خود API تشخیص دهد.
 *   2. اگر توکن صریح در محیط وجود نداشته باشد، اسکریپت با Wrangler CLI تلاش
 *      می‌کند Namespace را پیدا/ایجاد کند. این حالت برای Cloudflare Workers
 *      Builds مفید است؛ چون آن محیط می‌تواند Wrangler را با توکن داخلی خودش
 *      اجرا کند و دیگر نیازی به تنظیم دستی متغیرهای build نیست.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER = "__OPTIBID_KV_ID__";
const EXPECTED_TITLE = "OPTIBID_KV";
const API_BASE = "https://api.cloudflare.com/client/v4";
const configPath = new URL("../wrangler.jsonc", import.meta.url).pathname;

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
}

function getExplicitAccountId() {
  return (
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID ||
    ""
  ).trim();
}

function getCurrentNamespaceId() {
  const content = readFileSync(configPath, "utf8");
  const match = content.match(
    /"binding"\s*:\s*"OPTIBID_KV"[\s\S]*?"id"\s*:\s*"([^"]*)"/
  );
  return match?.[1] || "";
}

function patchWranglerConfig(namespaceId) {
  let content = readFileSync(configPath, "utf8");
  const currentId = getCurrentNamespaceId();
  if (currentId === namespaceId) {
    console.log("✔ شناسه KV از قبل در wrangler.jsonc ثبت است.");
    return;
  }
  if (currentId && currentId !== PLACEHOLDER) {
    console.log(
      `ℹ شناسه فعلی (${currentId.slice(0, 8)}…) با namespace پیدا شده مطابقت ندارد و به‌روزرسانی می‌شود.`
    );
  }
  content = content.replace(
    /("binding"\s*:\s*"OPTIBID_KV"[\s\S]*?"id"\s*:\s*")[^"]*(")/,
    `$1${namespaceId}$2`
  );
  writeFileSync(configPath, content);
  console.log(`✔ شناسه KV (${namespaceId}) در wrangler.jsonc ثبت شد.`);
}

async function cfFetch(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail =
      json.errors?.map((e) => e.message).join("; ") ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new Error(`Cloudflare API: ${detail}`);
  }
  return json;
}

async function resolveAccountId(token) {
  const explicit = getExplicitAccountId();
  if (explicit) return explicit;

  console.log("ℹ CLOUDFLARE_ACCOUNT_ID تنظیم نشده؛ در حال تشخیص account id از Cloudflare API…");
  const json = await cfFetch("/accounts?per_page=2", { token });
  const accounts = Array.isArray(json.result) ? json.result : [];
  if (accounts.length === 1 && accounts[0]?.id) {
    console.log(`✔ account id از API تشخیص داده شد: ${accounts[0].id}`);
    return accounts[0].id;
  }
  if (accounts.length === 0) {
    throw new Error("هیچ Cloudflare account قابل دسترسی با این توکن پیدا نشد.");
  }
  throw new Error(
    "این توکن به بیش از یک Cloudflare account دسترسی دارد؛ CLOUDFLARE_ACCOUNT_ID را تنظیم کنید."
  );
}

async function listAllNamespaces({ token, accountId }) {
  const namespaces = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const json = await cfFetch(
      `/accounts/${accountId}/storage/kv/namespaces?page=${page}&per_page=${perPage}`,
      { token }
    );
    const batch = Array.isArray(json.result) ? json.result : [];
    namespaces.push(...batch);
    const info = json.result_info;
    if (!info || page >= (info.total_pages || 1) || batch.length < perPage) {
      break;
    }
    page += 1;
  }
  return namespaces;
}

function findNamespaceId(namespaces) {
  const match =
    namespaces.find((ns) => ns.title === EXPECTED_TITLE) ||
    namespaces.find((ns) => ns.title?.endsWith(`-${EXPECTED_TITLE}`));
  return match ? match.id : null;
}

async function createNamespace({ token, accountId }) {
  const json = await cfFetch(`/accounts/${accountId}/storage/kv/namespaces`, {
    token,
    method: "POST",
    body: { title: EXPECTED_TITLE },
  });
  const id = json.result?.id;
  if (!id) {
    throw new Error("شناسه KV Namespace در پاسخ API پیدا نشد.");
  }
  return id;
}

async function ensureWithCloudflareApi(token) {
  const accountId = await resolveAccountId(token);
  const namespaces = await listAllNamespaces({ token, accountId });
  let namespaceId = findNamespaceId(namespaces);
  if (namespaceId) {
    console.log(`✔ KV Namespace موجود است: ${namespaceId}`);
  } else {
    console.log(`… KV Namespace یافت نشد؛ در حال ساخت ${EXPECTED_TITLE} …`);
    namespaceId = await createNamespace({ token, accountId });
    console.log(`✔ KV Namespace ساخته شد: ${namespaceId}`);
  }
  patchWranglerConfig(namespaceId);
}

function runWrangler(args) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["wrangler", ...args], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    throw new Error(`Wrangler (${args.join(" ")}) ناموفق بود:\n${stripAnsi(output).trim()}`);
  }
  return output;
}

function parseJsonArrayFromWranglerOutput(output) {
  const cleaned = stripAnsi(output).trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseNamespaceIdFromCreateOutput(output) {
  const cleaned = stripAnsi(output);
  const patterns = [
    /"id"\s*:\s*"([a-f0-9]{32})"/i,
    /id\s*=\s*"([a-f0-9]{32})"/i,
    /\bid\b[^a-f0-9]*([a-f0-9]{32})/i,
  ];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function ensureWithWranglerCli() {
  const existingId = getCurrentNamespaceId();
  if (existingId && existingId !== PLACEHOLDER) {
    console.log("✔ شناسه KV از قبل در wrangler.jsonc ثبت است؛ نیازی به ساخت/جستجو نیست.");
    return;
  }

  console.log("ℹ توکن صریح Cloudflare در محیط نیست؛ تلاش با احراز هویت داخلی Wrangler/Workers Builds…");
  const listOutput = runWrangler(["kv", "namespace", "list"]);
  const namespaces = parseJsonArrayFromWranglerOutput(listOutput);
  let namespaceId = findNamespaceId(namespaces);

  if (namespaceId) {
    console.log(`✔ KV Namespace موجود است: ${namespaceId}`);
  } else {
    console.log(`… KV Namespace یافت نشد؛ در حال ساخت ${EXPECTED_TITLE} با Wrangler …`);
    const createOutput = runWrangler([
      "kv",
      "namespace",
      "create",
      EXPECTED_TITLE,
      "--binding",
      EXPECTED_TITLE,
    ]);
    namespaceId = parseNamespaceIdFromCreateOutput(createOutput);
    if (!namespaceId) {
      throw new Error(
        `شناسه KV Namespace از خروجی Wrangler قابل تشخیص نبود:\n${stripAnsi(createOutput).trim()}`
      );
    }
    console.log(`✔ KV Namespace ساخته شد: ${namespaceId}`);
  }

  patchWranglerConfig(namespaceId);
}

async function main() {
  const configuredId = getCurrentNamespaceId();
  if (configuredId && configuredId !== PLACEHOLDER && process.env.CF_ENSURE_KV_FORCE !== "1") {
    console.log("✔ شناسه KV از قبل در wrangler.jsonc ثبت است.");
    return;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (token) {
    try {
      await ensureWithCloudflareApi(token);
      return;
    } catch (error) {
      // اگر account id به‌صورت صریح تنظیم نشده باشد، ممکن است Wrangler بتواند در
      // محیط Workers Builds با همان توکن داخلی account درست را تشخیص دهد.
      if (!getExplicitAccountId()) {
        console.warn(
          `⚠ مسیر API ناموفق بود؛ تلاش جایگزین با Wrangler CLI: ${
            error instanceof Error ? error.message : error
          }`
        );
        await ensureWithWranglerCli();
        return;
      }
      throw error;
    }
  }

  await ensureWithWranglerCli();
}

main().catch((error) => {
  console.error("cf-ensure-kv ناموفق بود:", error instanceof Error ? error.message : error);
  process.exit(1);
});
