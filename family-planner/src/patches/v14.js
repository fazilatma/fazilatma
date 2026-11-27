/**
 * پچ v14 (پورت Node از patch_v14.py)
 * هدر یِکا + یادآور نیم‌ساعت قبل برای هر کار
 *
 * این فایل از نسخهٔ پایتونی تولید شده (legacy-python/convert_patches.py) و همان
 * جایگزینی‌ها را روی قالب‌های همان نسخه انجام می‌دهد.
 * اجرا: node scripts/apply-patch.js v14 --dir <پوشهٔ نسخهٔ قبل>
 */
export const version = "14";
export const title = "هدر یِکا + یادآور نیم‌ساعت قبل برای هر کار";

export const files = [
  {
    path: "app-mobile-template.html",
    replacements: [
      { name: "rem-js", from: "function dayRequestHTML(day){", to: "/* ── یادآورِ هر کار (نیم‌ساعت قبل) ── */\nlet remLeadMin = 30;\nlet remMap = {};\ntry{ remMap = JSON.parse(store.get(\"wp2_rem\")||\"{}\")||{}; }catch(e){ remMap={}; }\nfunction remState(dk, b){\n  const id = blockId(b);\n  if(remMap[dk] && remMap[dk][id]!=null) return remMap[dk][id];\n  return b.kind===\"kid\" ? 1 : 0;\n}\nfunction toggleRem(dk, id, cur){\n  id = decodeURIComponent(id);\n  if(!remMap[dk]) remMap[dk]={};\n  remMap[dk][id] = cur ? 0 : 1;\n  const ks=Object.keys(remMap).sort();\n  if(ks.length>120) ks.slice(0,ks.length-90).forEach(k=>{ delete remMap[k]; });\n  store.set(\"wp2_rem\", JSON.stringify(remMap));\n  render();\n}\nfunction dayRequestHTML(day){", count: 1 },
      { name: "notif-cond", from: "      if(b.kind!==\"kid\"||b.start<=nm||b.start>nm+30) continue;", to: "      if(b.start<=nm||b.start>nm+30) continue;\n      if(remState(dk,b)!==1) continue;", count: 1 },
      { name: "bell-chip", from: "  if(b.online) tags.push(`<span class=\"tag work\">🎧 آنلاین</span>`);", to: "  if(b.online) tags.push(`<span class=\"tag work\">🎧 آنلاین</span>`);\n  if(big&&dk){\n    const ron = remState(dk,b)===1;\n    tags.push(`<span class=\"tag${ron?\"\":\" tagoff\"}\" style=\"cursor:pointer\" onclick=\"event.stopPropagation();toggleRem('${dk}','${encodeURIComponent(blockId(b))}',${ron?1:0})\">${ron?\"🔔 یادآور ۳۰د\":\"🔕 یادآور\"}</span>`);\n  }", count: 1 },
      { name: "css", from: "</style>", to: "/* ── هدر یِکا و یادآور هر کار ── */\n.yh1{display:flex;align-items:center;justify-content:space-between;gap:6px}\n.yh1 .yh-big{font-size:32px;font-weight:800;color:var(--accent);min-width:70px;text-align:center}\n.yh-side{font-size:11px;color:var(--muted);flex:1;text-align:center;line-height:1.5}\n.yh2{display:flex;justify-content:space-between;gap:6px;margin-top:2px}\n.yh2 .yh-c{color:var(--accent);font-weight:800;font-size:13.5px;flex:1;text-align:center}\n.calcell.todayc .dn{display:inline-block;min-width:22px;border:2px solid var(--accent);border-radius:50%;line-height:19px;color:var(--accent)}\n.bell{cursor:pointer;opacity:.32;margin-inline-end:3px;font-size:13px}\n.bell.on{opacity:1}\n.tag.tagoff{opacity:.55}\n</style>", count: 1 },
    ],
  },
  {
    path: "app-template.html",
    replacements: [
      { name: "rem-js", from: "function dayRequestHTML(day){", to: "/* ── یادآورِ هر کار (نیم‌ساعت قبل) ── */\nlet remLeadMin = 30;\nlet remMap = {};\ntry{ remMap = JSON.parse(store.get(\"wp2_rem\")||\"{}\")||{}; }catch(e){ remMap={}; }\nfunction remState(dk, b){\n  const id = blockId(b);\n  if(remMap[dk] && remMap[dk][id]!=null) return remMap[dk][id];\n  return b.kind===\"kid\" ? 1 : 0;\n}\nfunction toggleRem(dk, id, cur){\n  id = decodeURIComponent(id);\n  if(!remMap[dk]) remMap[dk]={};\n  remMap[dk][id] = cur ? 0 : 1;\n  const ks=Object.keys(remMap).sort();\n  if(ks.length>120) ks.slice(0,ks.length-90).forEach(k=>{ delete remMap[k]; });\n  store.set(\"wp2_rem\", JSON.stringify(remMap));\n  render();\n}\nfunction dayRequestHTML(day){", count: 1 },
      { name: "notif-cond", from: "      if(b.kind!==\"kid\"||b.start<=nm||b.start>nm+30) continue;", to: "      if(b.start<=nm||b.start>nm+30) continue;\n      if(remState(dk,b)!==1) continue;", count: 1 },
      { name: "bell-chip", from: "  if(b.online) tags.push(`<span class=\"tag work\">🎧 آنلاین</span>`);", to: "  if(b.online) tags.push(`<span class=\"tag work\">🎧 آنلاین</span>`);\n  if(big&&dk){\n    const ron = remState(dk,b)===1;\n    tags.push(`<span class=\"tag${ron?\"\":\" tagoff\"}\" style=\"cursor:pointer\" onclick=\"event.stopPropagation();toggleRem('${dk}','${encodeURIComponent(blockId(b))}',${ron?1:0})\">${ron?\"🔔 یادآور ۳۰د\":\"🔕 یادآور\"}</span>`);\n  }", count: 1 },
      { name: "css", from: "</style>", to: "/* ── هدر یِکا و یادآور هر کار ── */\n.yh1{display:flex;align-items:center;justify-content:space-between;gap:6px}\n.yh1 .yh-big{font-size:32px;font-weight:800;color:var(--accent);min-width:70px;text-align:center}\n.yh-side{font-size:11px;color:var(--muted);flex:1;text-align:center;line-height:1.5}\n.yh2{display:flex;justify-content:space-between;gap:6px;margin-top:2px}\n.yh2 .yh-c{color:var(--accent);font-weight:800;font-size:13.5px;flex:1;text-align:center}\n.calcell.todayc .dn{display:inline-block;min-width:22px;border:2px solid var(--accent);border-radius:50%;line-height:19px;color:var(--accent)}\n.bell{cursor:pointer;opacity:.32;margin-inline-end:3px;font-size:13px}\n.bell.on{opacity:1}\n.tag.tagoff{opacity:.55}\n</style>", count: 1 },
    ],
  },
];

export default { version, title, files };
