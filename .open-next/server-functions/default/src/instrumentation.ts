/**
 * هوک اجرای سمت سرور Next.js.
 * فقط در محیط Node (Liara یا سرور شخصی) زمان‌بند ربات روزانه را روشن می‌کند؛
 * در Cloudflare Worker زمان‌بند از طریق کرون بیرونی یا پنل مدیریت اجرا می‌شود.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.OPTIBID_DISABLE_AUTO_REFRESH === "1") return;
  const { startStoreAutoRefreshScheduler } = await import("@/lib/store-auto-refresh-scheduler");
  startStoreAutoRefreshScheduler();
}
