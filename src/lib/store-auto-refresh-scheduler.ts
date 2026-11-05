let started = false;

/**
 * زمان‌بند اجرای روزانهٔ به‌روزرسانی قیمت لینک‌ها.
 *
 * فقط در محیط Node (Liara/سرور شخصی) اجرا می‌شود؛ در Cloudflare Worker
 * فراخوانی از طریق کرون بیرونی یا باز بودن پنل انجام می‌شود.
 */
export function startStoreAutoRefreshScheduler() {
  if (started) return;
  started = true;

  const runOnce = async () => {
    try {
      const { runDueSourceAutoRefreshes } = await import("@/lib/store-source-auto-refresh");
      const result = await runDueSourceAutoRefreshes();
      if (result.ranLinks > 0) {
        console.log(
          `[auto-refresh] ${result.ranLinks} لینک در ساعت ${result.hour}:${result.minute} تهران به‌روزرسانی شد.`,
        );
      }
    } catch (error) {
      console.error("[auto-refresh] اجرای زمان‌بند ناموفق بود:", error);
    }
  };

  // اولین اجرا با تأخیر کوتاه تا اپلیکیشن کامل بالا بیاید.
  setTimeout(runOnce, 60_000);
  const timer = setInterval(runOnce, 10 * 60_000);
  // اجازه نده زمان‌بند جلوی خروج فرآیند را بگیرد.
  (timer as unknown as { unref?: () => void }).unref?.();
}
