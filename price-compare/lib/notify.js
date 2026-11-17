// نوتیفیکیشن تلگرام سمت سرور — اگر TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID تنظیم شود فعال است
export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, reason: "env not set" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: r.ok };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export function alertMessage(e) {
  return [
    `🛎️ هشدار قیمت‌یار پرو`,
    e.message,
    e.cur ? `میانگین الان: ${e.cur.avg?.toLocaleString("fa-IR")} | کف: ${e.cur.min?.toLocaleString("fa-IR")}` : null,
    `منبع: داشبورد قیمت‌یار`,
  ].filter(Boolean).join("\n");
}
