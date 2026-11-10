/**
 * دریافت متن صفحه‌های بازار (ترب، دیجی‌کالا، فروشگاه‌ها) با چند مسیر پشتیبان.
 *
 * IPهای مشترک Cloudflare معمولاً از سوی ترب/دیجی‌کالا با 429 یا 403 محدود
 * می‌شوند؛ به همین دلیل اگر درخواست مستقیم شکست بخورد، همان صفحه از دو مسیر
 * متنی دیگر خوانده می‌شود. این کار باعث می‌شود «استخراج قیمت» به یک منبع
 * وابسته نباشد و قیمت‌ها خودکار به‌روز شوند.
 */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEFAULT_ACCEPT = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8";

export type MarketTransport = "direct" | "reader" | "proxy";

function timeoutSignal(milliseconds: number) {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
    ? (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout(milliseconds)
    : undefined;
}

async function readBody(response: Response, maxBytes = 1_500_000) {
  const text = await response.text();
  return text.length > maxBytes ? text.slice(0, maxBytes) : text;
}

function readerUrlFor(url: string) {
  return `https://r.jina.ai/${url.replace(/^https?:\/\//i, "https://")}`;
}

function proxyUrlFor(url: string) {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
}

/**
 * متن صفحه را با اولین مسیری که جواب می‌دهد برمی‌گرداند.
 * در صورت شکست همهٔ مسیرها، خطای خوانا پرتاب می‌شود.
 */
export async function fetchMarketText(
  url: string,
  accept = DEFAULT_ACCEPT,
): Promise<{ text: string; transport: MarketTransport }> {
  const attempts: Array<{ transport: MarketTransport; run: () => Promise<Response> }> = [
    {
      transport: "direct",
      run: () =>
        fetch(url, {
          headers: { "user-agent": BROWSER_USER_AGENT, accept, "accept-language": "fa-IR,fa;q=0.9,en;q=0.8" },
          signal: timeoutSignal(12_000),
        }),
    },
    {
      transport: "reader",
      run: () =>
        fetch(readerUrlFor(url), {
          headers: { "user-agent": BROWSER_USER_AGENT, accept: "text/plain,*/*", "x-respond-with": "text" },
          signal: timeoutSignal(20_000),
        }),
    },
    {
      transport: "proxy",
      run: () =>
        fetch(proxyUrlFor(url), {
          headers: { "user-agent": BROWSER_USER_AGENT, accept },
          signal: timeoutSignal(20_000),
        }),
    },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const response = await attempt.run();
      if (!response.ok) {
        errors.push(`${attempt.transport}: HTTP ${response.status}`);
        continue;
      }
      const text = await readBody(response);
      if (text.trim().length < 20) {
        errors.push(`${attempt.transport}: پاسخ خالی`);
        continue;
      }
      return { text, transport: attempt.transport };
    } catch (error) {
      errors.push(`${attempt.transport}: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }

  throw new Error(`هیچ مسیری به منبع باز نشد (${errors.join(" | ")})`);
}

/** فقط متن؛ برای مسیرهایی که مسیر انتقال را لازم ندارند. */
export async function fetchMarketTextSimple(url: string, accept = DEFAULT_ACCEPT) {
  const { text } = await fetchMarketText(url, accept);
  return text;
}
