import { NextResponse } from "next/server";
import { listAlerts, addRule, deleteRule, addEvents, getSnapshots } from "../../../lib/store";
import { hunt } from "../../../lib/engine";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const a = await listAlerts();

  // بررسی دستی هشدارها: برای هر قاعده، hunt می‌زنیم و آستانه را با آخرین اسنپ‌شات می‌سنجیم
  if (searchParams.get("check") === "1") {
    const triggered = [];
    const uniq = [...new Set(a.rules.map((r) => r.query))];
    for (const query of uniq) {
      const before = await getSnapshots(query);
      const prev = before.length ? before[before.length - 1] : null;
      const res = await hunt(query, {});
      const cur = { avg: res.stats.avg, min: res.stats.min, max: res.stats.max, offerCount: res.stats.count };
      for (const rule of a.rules.filter((r) => r.query === query)) {
        if (!prev) continue;
        const deltaPct = ((cur.avg - prev.avg) / prev.avg) * 100;
        const low = (rule.currentLow = prev.min);
        let hit = false, detail = "";
        if (rule.type === "drop" && cur.avg <= prev.avg * (1 - rule.thresholdPct / 100)) {
          hit = true; detail = `میانگین بازار ${Math.abs(Math.round(deltaPct * 10) / 10)}٪ کاهش یافت`;
        } else if (rule.type === "spike" && cur.avg >= prev.avg * (1 + rule.thresholdPct / 100)) {
          hit = true; detail = `میانگین بازار ${Math.round(deltaPct * 10) / 10}٪ افزایش یافت (افزایش تقاضا؟)`;
        } else if (rule.type === "supply" && cur.offerCount <= 2) {
          hit = true; detail = `فقط ${cur.offerCount} فروشنده فعال — کمبود عرضه/گرم شدن طرف فروش`;
        }
        if (hit) {
          triggered.push({
            ruleId: rule.id, query, type: rule.type, detail,
            message: `${rule.type === "drop" ? "📉" : rule.type === "spike" ? "📈" : "🧲"} «${query}»: ${detail} — آستانه‌ی شما ${rule.thresholdPct}٪`,
            cur, prev,
          });
        }
      }
    }
    if (triggered.length) {
      await addEvents(triggered);
      // نوتیفیکیشن تلگرام (اختیاری — با env)
      try {
        const { sendTelegram, alertMessage } = await import("../../../lib/notify");
        for (const ev of triggered.slice(0, 10)) await sendTelegram(alertMessage(ev));
      } catch {}
    }
    const fresh = await listAlerts();
    return NextResponse.json({ checkedAt: Date.now(), triggered: triggered.length, freshEvents: triggered, alerts: fresh });
  }

  return NextResponse.json(a);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { query, type = "drop", thresholdPct = 5 } = body || {};
  if (!query || !["drop", "spike", "supply"].includes(type)) {
    return NextResponse.json({ error: "query و type (drop|spike|supply) لازم است" }, { status: 400 });
  }
  const rule = await addRule({ query, type, thresholdPct: Number(thresholdPct) || 5 });
  return NextResponse.json({ ok: true, rule });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
  await deleteRule(id);
  return NextResponse.json({ ok: true });
}
