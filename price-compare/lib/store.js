// ذخیره‌سازی ساده‌ی JSON محلی برای اسنپ‌شات قیمت و قوانین هشدار (دمو/تک‌نمونه)
import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data");
const SNAPS = path.join(DIR, "snapshots.json");
const ALERTS = path.join(DIR, "alerts.json");

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}
async function writeJson(file, data) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// ---------- snapshots: query -> [{ts,min,avg,max,offerCount,sources}]
export async function pushSnapshot(query, stats) {
  const all = await readJson(SNAPS, {});
  const key = query.trim();
  const list = all[key] || [];
  const prev = list.length ? list[list.length - 1] : null;
  list.push({ ts: Date.now(), ...stats });
  all[key] = list.slice(-100); // نگه‌داشت ۱۰۰ نقطه‌ی آخر
  await writeJson(SNAPS, all);
  return { prev, history: all[key] };
}
export async function getSnapshots(query) {
  const all = await readJson(SNAPS, {});
  return all[query.trim()] || [];
}

// ---------- alert rules & events
export async function listAlerts() {
  return readJson(ALERTS, { rules: [], events: [] });
}
export async function addRule(rule) {
  const a = await listAlerts();
  const r = { id: "r" + Math.random().toString(36).slice(2, 8), createdAt: Date.now(), ...rule };
  a.rules.push(r);
  await writeJson(ALERTS, a);
  return r;
}
export async function deleteRule(id) {
  const a = await listAlerts();
  a.rules = a.rules.filter((r) => r.id !== id);
  await writeJson(ALERTS, a);
  return true;
}
export async function addEvents(events) {
  const a = await listAlerts();
  a.events = [...events.map((e) => ({ id: "e" + Math.random().toString(36).slice(2, 8), at: Date.now(), ...e })), ...a.events].slice(0, 100);
  await writeJson(ALERTS, a);
  return a.events;
}
