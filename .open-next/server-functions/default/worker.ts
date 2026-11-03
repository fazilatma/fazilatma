/**
 * ورودی سفارشی Cloudflare Worker برای OptiBid.
 *
 * خروجی OpenNext در `.open-next/worker.js` فقط هندلر `fetch` دارد؛ این فایل
 * همان هندلر را بدون تغییر بازنشر می‌کند و یک هندلر `scheduled` برای
 * به‌روزرسانی خودکار قیمت‌ها به آن اضافه می‌کند (Cron Trigger در
 * `wrangler.jsonc` — هر ۱۰ دقیقه؛ مسیر کرون خودش سقف شبانه‌روزی پنل ادمین
 * (تا ۱۰٬۰۰۰ محصول) را مدیریت می‌کند و وقتی سهمیهٔ روز کامل شود، فراخوانی‌ها
 * بدون پردازش برمی‌گردند تا روز بعد از ابتدا شروع شود).
 *
 * هندلر زمان‌بندی‌شده به‌جای فراخوانی دامنهٔ عمومی (که در Cloudflare به
 * ورکرِ همان زون نمی‌رسد)، مسیر داخلی `/api/cron/refresh-prices` را مستقیم
 * روی هندلر OpenNext صدا می‌زند؛ دقیقاً مثل یک درخواست HTTP واقعی، همراه با
 * سکرت `CRON_SECRET` که باید با `wrangler secret put CRON_SECRET` تنظیم شود.
 */
//@ts-expect-error: خروجی build در زمان اجرا توسط Wrangler resolve می‌شود و تایپ پروژه ندارد.
import openNextWorker from "./.open-next/worker.js";

// کلاس‌های Durable Object مربوط به OpenNext باید از ورودی اصلی export شوند.
//@ts-expect-error: خروجی build در زمان اجرا توسط Wrangler resolve می‌شود و تایپ پروژه ندارد.
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

type WorkerEnv = Record<string, unknown> & {
  CRON_SECRET?: string;
  OPTIBID_CRON_BASE_URL?: string;
};

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type ScheduledController = {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
};

type OpenNextWorker = {
  fetch(
    request: Request,
    env: WorkerEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response>;
};

const handler = openNextWorker as OpenNextWorker;

// هر ده دقیقه یک‌بار اجرا می‌شود؛ در هر اجرا چند دور پشت سر هم صدا زده
// می‌شود و بقیهٔ کار به اجراهای بعدی همان روز می‌ماند.
const MAX_CRON_ROUNDS = 10;

async function runDailyPriceRefresh(env: WorkerEnv, ctx: WorkerExecutionContext) {
  const secret = typeof env.CRON_SECRET === "string" ? env.CRON_SECRET : "";
  if (!secret) {
    console.warn(
      "[optibid-cron] CRON_SECRET is not set; skipping automatic price refresh.",
    );
    return;
  }
  const baseUrl = String(env.OPTIBID_CRON_BASE_URL || "https://optibid.ir").replace(
    /\/+$/,
    "",
  );
  for (let round = 1; round <= MAX_CRON_ROUNDS; round += 1) {
    const response = await handler.fetch(
      new Request(`${baseUrl}/api/cron/refresh-prices?batches=3`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      }),
      env,
      ctx,
    );
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      skipped?: boolean;
      hasMore?: boolean;
      totalChecked?: number;
      updated?: number;
      dailyChecked?: number;
      dailyLimit?: number;
      dailyDone?: boolean;
      message?: string;
    } | null;
    console.log(
      `[optibid-cron] round ${round}: HTTP ${response.status}` +
        (payload
          ? ` checked=${payload.totalChecked ?? 0} updated=${payload.updated ?? 0} hasMore=${Boolean(payload.hasMore)} daily=${payload.dailyChecked ?? 0}/${payload.dailyLimit ?? 0} dailyDone=${Boolean(payload.dailyDone)}`
          : " (no JSON payload)"),
    );
    // سقف روز پر شده یا چرخهٔ امروز کامل است: تا اجرای بعدی (روز تازه) صبر کن.
    if (!response.ok || !payload?.success || payload.skipped || payload.dailyDone || !payload.hasMore) break;
  }
}

const worker = {
  fetch(request: Request, env: WorkerEnv, ctx: WorkerExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
  scheduled(
    _controller: ScheduledController,
    env: WorkerEnv,
    ctx: WorkerExecutionContext,
  ) {
    ctx.waitUntil(runDailyPriceRefresh(env, ctx));
  },
};

export default worker;
