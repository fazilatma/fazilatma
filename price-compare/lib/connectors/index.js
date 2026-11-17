import * as digikala from "./digikala";
import * as torob from "./torob";
import * as basalam from "./basalam";
import * as bascool from "./bascool";
import * as google from "./google";
import * as telegram from "./telegram";
import * as instagram from "./instagram";

// ترتیب نمایش در خروجی — باسکول اضافه شد برای محصولات کشاورزی/هایپر
export const CONNECTORS = [torob, digikala, basalam, bascool, google, telegram, instagram];

export async function huntAll(query, ctx = {}) {
  const started = Date.now();
  const settled = await Promise.allSettled(CONNECTORS.map((c) => c.search(query, ctx)));
  return settled.map((s, i) => {
    const meta = CONNECTORS[i].META;
    if (s.status === "fulfilled") return { ...s.value, ms: Date.now() - started };
    return { source: meta, mode: "error", note: s.reason?.message || "خطای ناشناخته", offers: [], ms: Date.now() - started };
  });
}
