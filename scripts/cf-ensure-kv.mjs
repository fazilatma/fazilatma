/**
 * اطمینان از وجود KV Namespace برای دیپلوی Cloudflare Workers.
 *
 * wrangler v4 دیگر پرچم `--json` روی `kv namespace list` ندارد،
 * بنابراین این اسکریپت مستقیماً Cloudflare REST API را صدا می‌زند:
 *   1. لیست KV Namespaceهای اکانت را می‌خواند؛
 *   2. اگر namespace با عنوان «OPTIBID_KV» وجود نداشته باشد، می‌سازد؛
 *   3. شناسه (id) را در wrangler.jsonc جایگزین placeholder می‌کند.
 *
 * نیاز به CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID (یا ACCOUNT_ID).
 */
import { readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER = "__OPTIBID_KV_ID__";
const EXPECTED_TITLE = "OPTIBID_KV";
const API_BASE = "https://api.cloudflare.com/client/v4";

function requiredEnv() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN تنظیم نشده است.");
  }
  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID یا ACCOUNT_ID تنظیم نشده است.");
  }
  return { token, accountId };
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

function patchWranglerConfig(namespaceId) {
  const configPath = new URL("../wrangler.jsonc", import.meta.url).pathname;
  let content = readFileSync(configPath, "utf8");
  const currentId = content.match(/"id"\s*:\s*"([^"]*)"/);
  if (currentId && currentId[1] === namespaceId) {
    console.log("✔ شناسه KV از قبل در wrangler.jsonc ثبت است.");
    return;
  }
  if (currentId && currentId[1] !== PLACEHOLDER) {
    console.log(
      `ℹ شناسه فعلی (${currentId[1].slice(0, 8)}…) با namespace پیدا شده مطابقت ندارد و به‌روزرسانی می‌شود.`
    );
  }
  content = content.replace(
    /("binding"\s*:\s*"OPTIBID_KV"[\s\S]*?"id"\s*:\s*")[^"]*(")/,
    `$1${namespaceId}$2`
  );
  writeFileSync(configPath, content);
  console.log(`✔ شناسه KV (${namespaceId}) در wrangler.jsonc ثبت شد.`);
}

async function main() {
  const creds = requiredEnv();
  const namespaces = await listAllNamespaces(creds);
  let namespaceId = findNamespaceId(namespaces);
  if (namespaceId) {
    console.log(`✔ KV Namespace موجود است: ${namespaceId}`);
  } else {
    console.log(`… KV Namespace یافت نشد؛ در حال ساخت ${EXPECTED_TITLE} …`);
    namespaceId = await createNamespace(creds);
    console.log(`✔ KV Namespace ساخته شد: ${namespaceId}`);
  }
  patchWranglerConfig(namespaceId);
}

main().catch((error) => {
  console.error("cf-ensure-kv ناموفق بود:", error instanceof Error ? error.message : error);
  process.exit(1);
});
