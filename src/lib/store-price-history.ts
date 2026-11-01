export type StorePriceHistoryPoint = {
  recordedAt: string;
  price: number;
  source: string;
  sourceUrl?: string;
};

const maxStorePriceHistoryPoints = 180;

function normalizeHistoryPoint(value: unknown): StorePriceHistoryPoint | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<StorePriceHistoryPoint>;
  const price = Number(record.price);
  const recordedAt = String(record.recordedAt || "").trim();
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(Date.parse(recordedAt))) return null;

  const point: StorePriceHistoryPoint = {
    recordedAt: new Date(recordedAt).toISOString(),
    price: Math.round(price),
    source: String(record.source || "ثبت فروشگاه").trim().slice(0, 80),
  };
  if (record.sourceUrl) {
    try {
      const url = new URL(String(record.sourceUrl));
      if (url.protocol === "http:" || url.protocol === "https:") point.sourceUrl = url.toString().slice(0, 2000);
    } catch {
      // Ignore malformed and non-web references in history metadata.
    }
  }
  return point;
}

export function normalizeStorePriceHistory(value: unknown): StorePriceHistoryPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeHistoryPoint)
    .filter((point): point is StorePriceHistoryPoint => Boolean(point))
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
    .slice(-maxStorePriceHistoryPoints);
}

export function appendStorePriceHistory(
  history: unknown,
  value: StorePriceHistoryPoint,
): StorePriceHistoryPoint[] {
  const points = normalizeStorePriceHistory(history);
  const next = normalizeHistoryPoint(value);
  if (!next) return points;

  const day = next.recordedAt.slice(0, 10);
  const sameSourceDayIndex = points.findIndex(
    (point) => point.recordedAt.slice(0, 10) === day && point.source === next.source,
  );
  if (sameSourceDayIndex >= 0) points[sameSourceDayIndex] = next;
  else points.push(next);

  return points
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
    .slice(-maxStorePriceHistoryPoints);
}

export function mergeStorePriceHistory(...values: unknown[]): StorePriceHistoryPoint[] {
  const merged: StorePriceHistoryPoint[] = [];
  for (const value of values) {
    for (const point of normalizeStorePriceHistory(value)) {
      merged.splice(0, merged.length, ...appendStorePriceHistory(merged, point));
    }
  }
  return merged;
}
