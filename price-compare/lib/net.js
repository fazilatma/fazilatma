// fetch امن برای پروداکشن: تایم‌اوت + retry + هدرهای فارسی - سریع برای demo
export async function fetchJson(url, { timeoutMs = 2500, retries = 0, headers = {} } = {}) {
  const defaultHeaders = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "accept": "application/json",
    "accept-language": "fa-IR,fa;q=0.9,en;q=0.8",
    ...headers,
  };
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: defaultHeaders, next: { revalidate: 0 } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}
