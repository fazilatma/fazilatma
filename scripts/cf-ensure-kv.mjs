/**
 * اطمینان از وجود KV Namespace برای دیپلوی Cloudflare Workers.
 *
 * این اسکریپت به صورت خودکار:
 *   1. لیست KV Namespaceهای اکانت را می‌خواند؛
 *   2. اگر namespace با عنوان «optibid-OPTIBID_KV» وجود نداشته باشد، می‌سازد؛
 *   3. شناسه (id) را در wrangler.jsonc جایگزین placeholder می‌کند.
 *
 * در محیط Cloudflare Workers Builds توکن احراز هویت به صورت خودکار
 * (CLOUDFLARE_API_TOKEN) در دسترس است. برای اجرای محلی ابتدا
 * `npx wrangler login` را اجرا کنید.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER = "__OPTIBID_KV_ID__";
const EXPECTED_TITLE_SUFFIX = "OPTIBID_KV";

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  }).toString();
}

function findNamespaceId() {
  const output = run("npx wrangler kv namespace list --json");
  const parsed = JSON.parse(output);
  const namespaces = Array.isArray(parsed) ? parsed : [];
  const match =
    namespaces.find((ns) => ns.title?.endsWith(`-${EXPECTED_TITLE_SUFFIX}`)) ||
    namespaces.find((ns) => ns.title === EXPECTED_TITLE_SUFFIX);
  return match ? match.id : null;
}

function createNamespace() {
  const output = run("npx wrangler kv namespace create OPTIBID_KV");
  process.stdout.write(output);
  // خروجی wrangler یا JSON است یا TOML/متن؛ هر دو پوشش داده می‌شوند.
  const jsonMatch = output.match(/"id"\s*:\s*"([0-9a-f]{32})"/);
  if (jsonMatch) return jsonMatch[1];
  const tomlMatch = output.match(/id\s*=\s*"([0-9a-f]{32})"/);
  if (tomlMatch) return tomlMatch[1];
  const genericMatch = output.match(/\bid\b["']?\s*[:=]\s*["']([0-9a-f]{32})["']/i);
  if (genericMatch) return genericMatch[1];
  throw new Error("شناسه KV Namespace در خروجی wrangler پیدا نشد.");
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
  let namespaceId = null;
  try {
    namespaceId = findNamespaceId();
    if (namespaceId) {
      console.log(`✔ KV Namespace موجود است: ${namespaceId}`);
    }
  } catch (error) {
    console.error(
      "خطا در خواندن لیست KV Namespaceها. آیا `npx wrangler login` انجام شده است؟"
    );
    throw error;
  }

  if (!namespaceId) {
    console.log("… KV Namespace یافت نشد؛ در حال ساخت optibid-OPTIBID_KV …");
    namespaceId = createNamespace();
    console.log(`✔ KV Namespace ساخته شد: ${namespaceId}`);
  }

  patchWranglerConfig(namespaceId);
}

main().catch((error) => {
  console.error("cf-ensure-kv ناموفق بود:", error instanceof Error ? error.message : error);
  process.exit(1);
});
