import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { runStorePriceRefresh } from "@/lib/store-price-refresh-run";

export type SourceSchedule = {
  url: string;
  parts: string[];
  multiplier: number;
  limit: number;
  references: string[];
  /** ساعت اجرای روزانه به‌وقت تهران؛ null یعنی خاموش. */
  autoRefreshHour: number | null;
};

const defaultReferences = ["torob", "digikala"];
const validReferences = new Set(["torob", "digikala", "instagram", "telegram", "google"]);

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.max(min, Math.min(max, number));
}

/**
 * فهرست لینک‌ها را از تنظیمات (`storeComputerPartsSourceUrl`) می‌خواند.
 * پشتیبانی از قالب قدیمی (یک آدرس ساده) هم حفظ شده است.
 */
export function parseSourceSchedules(raw: unknown): SourceSchedule[] {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  let parsed: unknown = null;
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  const records = Array.isArray(parsed)
    ? parsed
    : /^https?:\/\//i.test(text)
      ? [{ url: text }]
      : [];
  return records
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const url = String(record.url || "").trim();
      if (!/^https?:\/\//i.test(url)) return [];
      const hourRaw = record.autoRefreshHour;
      const hourNumber = Number(hourRaw);
      const autoRefreshHour =
        hourRaw === null || hourRaw === undefined || hourRaw === "" || !Number.isFinite(hourNumber)
          ? null
          : Math.max(0, Math.min(23, Math.round(hourNumber)));
      const references = Array.isArray(record.references)
        ? [...new Set(record.references.map((item) => String(item).trim().toLowerCase()))].filter(
            (item) => validReferences.has(item),
          )
        : [];
      return [
        {
          url,
          parts: Array.isArray(record.parts) ? record.parts.map((part) => String(part)) : [],
          multiplier: clampNumber(record.multiplier, 0.1, 10, 1),
          limit: Math.round(clampNumber(record.limit, 1, 10_000, 10_000)),
          references: references.length ? references : [...defaultReferences],
          autoRefreshHour,
        },
      ];
    })
    .slice(0, 8);
}

export type TehranClock = { date: string; hour: number; minute: string };

export function tehranClock(now: Date = new Date()): TehranClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(get("hour"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: get("minute"),
  };
}

function parseLog(raw: unknown): Record<string, string> {
  try {
    const parsed = JSON.parse(String(raw || "{}"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const log: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") log[key] = value;
    }
    return log;
  } catch {
    return {};
  }
}

export type SourceAutoRefreshReport = {
  url: string;
  hour: number;
  checked: number;
  updated: number;
  unchanged: number;
  notFound: number;
  failed: number;
  limit: number;
  multiplier: number;
};

/**
 * لینک‌هایی که ساعت اجرای روزانه دارند و هنوز امروز اجرا نشده‌اند را
 * به‌روزرسانی می‌کند. اجرا idempotent است: هر لینک در هر روز تهران فقط یک بار.
 */
export async function runDueSourceAutoRefreshes(options: { now?: Date; force?: boolean } = {}) {
  const clock = tehranClock(options.now ?? new Date());
  const data = await getOptiBidData();
  const schedules = parseSourceSchedules(data.settings.storeComputerPartsSourceUrl).filter(
    (schedule) => schedule.autoRefreshHour !== null,
  );
  const log = parseLog(data.settings.storeSourceAutoRefreshLog);

  const due = schedules.filter(
    (schedule) =>
      options.force === true ||
      (clock.hour >= Number(schedule.autoRefreshHour) && log[schedule.url] !== clock.date),
  );

  const reports: SourceAutoRefreshReport[] = [];
  for (const schedule of due) {
    let checked = 0;
    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let failed = 0;
    let offset = 0;
    let hasMore = true;
    while (checked < schedule.limit && hasMore) {
      const remaining = schedule.limit - checked;
      const { body } = await runStorePriceRefresh({
        references: schedule.references,
        maxProducts: Math.min(remaining, 20),
        priceMultiplier: schedule.multiplier,
        onlyActive: true,
        sourceUrl: schedule.url,
        offset,
      });
      if (!body.success) break;
      const batchChecked = Number(body.totalChecked || 0);
      checked += batchChecked;
      updated += Number(body.updated || 0);
      unchanged += Number(body.unchanged || 0);
      notFound += Number(body.notFound || 0);
      failed += Number(body.failed || 0);
      offset = Number(body.nextOffset || 0);
      hasMore = Boolean(body.hasMore);
      if (batchChecked === 0) break;
    }
    log[schedule.url] = clock.date;
    reports.push({
      url: schedule.url,
      hour: Number(schedule.autoRefreshHour),
      checked,
      updated,
      unchanged,
      notFound,
      failed,
      limit: schedule.limit,
      multiplier: schedule.multiplier,
    });
  }

  if (due.length > 0) {
    const latest = await getOptiBidData();
    latest.settings.storeSourceAutoRefreshLog = JSON.stringify(log).slice(0, 8000);
    await writeOptiBidData(latest);
  }

  return {
    date: clock.date,
    hour: clock.hour,
    minute: clock.minute,
    scheduledLinks: schedules.length,
    ranLinks: reports.length,
    reports,
  };
}
