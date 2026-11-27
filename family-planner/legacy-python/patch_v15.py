#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""پچ v15 — افزودن/حذف برنامهٔ هر روز + خانهٔ تقویمی در دسکتاپ:
- جعبهٔ «اضافه به این روز» زیر کارهای هر روز (کارت هفته + نمای روز + خانه) — پارس فارسی کامل (ساعت، تاریخ…)
- ✕ حذف روی هر ردیف: کارهای اضافه‌شده حذف کامل؛ کلاس/شیفت/رانندگی فقط از همان روز برداشته می‌شود (↺ برای برگرداندن)
- دسکتاپ: تب «🏠 خانه» (پیش‌فرض) = هدر یِکا + تقویم ماه + چک‌لیست روز انتخابی با تیک/یادآور/حذف/اضافه"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

EXTRA_JS = '''/* ── اضافه/حذف برنامهٔ هر روز (v15) ── */
let hideMap = {};
try{ hideMap = JSON.parse(store.get("wp2_hide")||"{}")||{}; }catch(e){ hideMap={}; }
function isHidden(dk, id){ return !!(hideMap[dk] && hideMap[dk][id]); }
function toggleHide(dk, id){
  id = decodeURIComponent(id);
  if(!hideMap[dk]) hideMap[dk]={};
  if(hideMap[dk][id]) delete hideMap[dk][id]; else hideMap[dk][id]=1;
  const ks=Object.keys(hideMap).sort();
  if(ks.length>150) ks.slice(0,ks.length-120).forEach(k=>{ delete hideMap[k]; });
  store.set("wp2_hide", JSON.stringify(hideMap));
  render();
}
function addExtra(dk, inputId){
  const el = document.getElementById(inputId);
  if(!el) return;
  const lines = (el.value||"").split(/\\n|؛/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length) return;
  const today = TODAY();
  let added = 0, lastErr = "";
  for(const line of lines){
    const r = parseLine(line, today);
    if(!r || !r.title){ lastErr="نتوانستم بخوانم — ساعت را هم بنویس"; continue; }
    tasks.push({ id: uid(), title: r.title, dates:[DK2(dk)], weekdays:[], everyDay:false,
      weekOnly:null, perWeek:1, fixStart:r.fixStart, fixEnd:r.fixEnd,
      dur: r.dur||60, window: r.window, priority: r.priority||2, notes:"", extra:true,
      createdAt: Date.now()+Math.random() });
    added++;
  }
  el.value="";
  const fb = document.getElementById("fb");
  if(fb) fb.innerHTML = `<div class="item ${lastErr?"warn":"ok"}">✅ ${faNum(added)} مورد به ${jalaliStr(DK2(dk),false)} اضافه شد${lastErr?" — ⚠️ "+esc(lastErr):""} <button class="undo" onclick="delExtraAll('${dk}')">حذف همه</button></div>`;
  saveState(); render();
}
function delExtraAll(dk){
  tasks = tasks.filter(t=>!(t.extra && t.dates && t.dates.length===1 && dkey(t.dates[0])===dk));
  saveState(); render();
}
function delExtraById(xid){
  tasks = tasks.filter(t=>t.id!==xid);
  saveState(); render();
}
function extraTaskOf(dk,b){ return (tasks||[]).find(t=>t.extra && t.dates && t.dates.length===1 && dkey(t.dates[0])===dk && t.title===b.title); }
function delCtlHTML(dk,b){
  const et = extraTaskOf(dk,b);
  return et ? `<span class="xdel" title="حذف" onclick="event.stopPropagation();delExtraById('${et.id}')">✕</span>`
            : `<span class="xdel" title="برداشتن از این روز" onclick="event.stopPropagation();toggleHide('${dk}','${encodeURIComponent(blockId(b))}')">✕</span>`;
}
function dayRequestHTML(day){'''

CSS_ADD15 = '''/* ── افزودن/حذف روز (v15) ── */
.xdel{cursor:pointer;border:none;background:#fff;border:1px solid var(--line,#e2e8f0);color:#b91c1c;border-radius:8px;font-size:11px;padding:2px 8px;flex:none;margin-inline-start:6px;font-family:inherit}
.xdel:hover{background:#fef2f2}
.addrow{display:flex;gap:6px;margin-top:8px}
.addrow input{flex:1;min-width:0;border:1px dashed #94a3b8;border-radius:10px;padding:7px 10px;font-family:inherit;font-size:12.5px;background:#f8fafc;box-sizing:border-box}
.addrow button{border:none;background:#eef2ff;color:#4338ca;border-radius:10px;padding:0 14px;font-weight:800;cursor:pointer;font-size:12.5px;font-family:inherit;white-space:nowrap}
.homecard{background:#fff;border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:14px;margin:10px 0}
:root{--accent:#4f46e5;--muted:#64748b;--line:#e2e8f0}
</style>'''

BUSY_OLD = 'function busyOf(day){ return day.blocks.filter(b=>b.kind!=="kid"&&!b.nobusy); }'
BUSY_NEW = 'function busyOf(day){ return day.blocks.filter(b=>b.kind!=="kid"&&!b.nobusy&&!isHidden(dkey(day.date),blockId(b))); }'

KIDSEC_DESK_OLD = '''function kidSecHTML(day){
  const kids = day.blocks.filter(b=>b.kind==="kid");
  if(!kids.length) return "";
  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم (ثابت)</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)} تا ${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر — از کادر درخواست عوضش کن)</span>':""}</div>`).join("") + `</div>`;
}'''
KIDSEC_DESK_NEW = '''function kidSecHTML(day){
  const kids = day.blocks.filter(b=>b.kind==="kid"&&!isHidden(dkey(day.date),blockId(b)));
  if(!kids.length) return "";
  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم (ثابت)</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)} تا ${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر — از کادر درخواست عوضش کن)</span>':""}<button class="xdel" title="برداشتن از این روز" onclick="toggleHide('${dkey(day.date)}','${encodeURIComponent(blockId(b))}')">✕</button></div>`).join("") + `</div>`;
}'''
KIDSEC_MOB_OLD = '''function kidSecHTML(day){
  const kids = day.blocks.filter(b=>b.kind==="kid");
  if(!kids.length) return "";
  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)}–${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر)</span>':""}</div>`).join("") + `</div>`;
}'''
KIDSEC_MOB_NEW = '''function kidSecHTML(day){
  const kids = day.blocks.filter(b=>b.kind==="kid"&&!isHidden(dkey(day.date),blockId(b)));
  if(!kids.length) return "";
  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)}–${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر)</span>':""}<button class="xdel" title="برداشتن از این روز" onclick="toggleHide('${dkey(day.date)}','${encodeURIComponent(blockId(b))}')">✕</button></div>`).join("") + `</div>`;
}'''

ROWS_OLD = 'rows = busy.map(b=>rowHTML(b,false)).join("");'
ROWS_NEW = 'rows = busy.map(b=>rowHTML(b,false,dk)).join("");'

BELL_END_OLD = '''    tags.push(`<span class="tag${ron?"":" tagoff"}" style="cursor:pointer" onclick="event.stopPropagation();toggleRem('${dk}','${encodeURIComponent(blockId(b))}',${ron?1:0})">${ron?"🔔 یادآور ۳۰د":"🔕 یادآور"}</span>`);
  }'''
BELL_END_NEW = '''    tags.push(`<span class="tag${ron?"":" tagoff"}" style="cursor:pointer" onclick="event.stopPropagation();toggleRem('${dk}','${encodeURIComponent(blockId(b))}',${ron?1:0})">${ron?"🔔 یادآور ۳۰د":"🔕 یادآور"}</span>`);
  }
  if(dk) tags.push(delCtlHTML(dk,b));'''

ROWSBOX_OLD = '<div class="rows">${body}</div>'
ROWSBOX_NEW = '''<div class="rows">${body}</div>
    ${d.active?`<div class="addrow"><input id="exT_${dk}" placeholder="اضافه به این روز: مثلاً ۱۷ تا ۱۸ دکتر"><button onclick="addExtra('${dk}','exT_${dk}')">➕ اضافه کن</button></div>`:""}'''

TABBAR_OLD = '''<nav class="tabs">
  <button class="tab on" id="tabWeek" onclick="setTab('week')">📅 هفته</button>
  <button class="tab" id="tabDay" onclick="setTab('day')">☀️ روز</button>
  <button class="tab" id="tabCal" onclick="setTab('cal')">🗓 تقویم</button>
</nav>'''
TABBAR_NEW = '''<nav class="tabs">
  <button class="tab" id="tabCal" onclick="setTab('cal')">🏠 خانه</button>
  <button class="tab on" id="tabWeek" onclick="setTab('week')">📅 هفته</button>
  <button class="tab" id="tabDay" onclick="setTab('day')">☀️ روز</button>
</nav>'''

CALPICK_DESK_OLD = 'function calPick(dk){ calSel=(calSel===dk)?null:dk; render(); }'
CALPICK_DESK_NEW = '''function calPick(dk){ calSel=dk; render(); }
function calToday(){ const t=TODAY(); calSel=dkey(t); const j=toJalali(t.getFullYear(),t.getMonth()+1,t.getDate()); calY=j[0]; calM=j[1]; render(); }'''

MOB_CKROW_OLD = '''      return `<div class="ckrow" style="border-inline-start:4px solid ${col}">
        <span class="ckb${isDone(sdk,blockId(b))?" on":""}" onclick="toggleDone('${sdk}','${id}')"></span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13.5px;line-height:1.7">${b.kind==="duty"?esc(b.kid)+" — ":""}${esc(b.title)}${b.ret==="var"&&b.kind==="kid"?' <span class="tag duty">🎒 برگشت متغیر</span>':""}</div>
          <div style="font-size:11.5px;color:var(--muted)"><span class="bell${on?" on":""}" onclick="toggleRem('${sdk}','${id}',${on?1:0})">🔔</span> ${fmtT(b.start)} تا ${fmtT(b.end)}${on?" • یادآور "+faNum(remLeadMin)+" دقیقه قبل":""}${b.notes?" • ✎ "+esc(b.notes):""}</div></div></div>`;'''
MOB_CKROW_NEW = '''      const hid = isHidden(sdk,blockId(b));
      return `<div class="ckrow" style="border-inline-start:4px solid ${col}${hid?";opacity:.45":""}">
        <span class="ckb${isDone(sdk,blockId(b))?" on":""}" onclick="toggleDone('${sdk}','${id}')"></span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13.5px;line-height:1.7">${b.kind==="duty"?esc(b.kid)+" — ":""}${esc(b.title)}${b.ret==="var"&&b.kind==="kid"?' <span class="tag duty">🎒 برگشت متغیر</span>':""}</div>
          <div style="font-size:11.5px;color:var(--muted)"><span class="bell${on?" on":""}" onclick="toggleRem('${sdk}','${id}',${on?1:0})">🔔</span> ${fmtT(b.start)} تا ${fmtT(b.end)}${on?" • یادآور "+faNum(remLeadMin)+" دقیقه قبل":""}${b.notes?" • ✎ "+esc(b.notes):""}</div></div>${hid?`<span class="xdel" onclick="toggleHide('${sdk}','${id}')">↺</span>`:delCtlHTML(sdk,b)}</div>`;'''

MOB_ADDBTN_OLD = '''    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="xs" onclick="calGoDay('${sdk}')">📅 نمای کامل روز</button>'''
MOB_ADDBTN_NEW = '''    <div class="addrow"><input id="exT" placeholder="اضافه به این روز: مثلاً ۱۷ تا ۱۸ دکتر"><button onclick="addExtra('${sdk}','exT')">➕ اضافه کن</button></div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="xs" onclick="calGoDay('${sdk}')">📅 نمای کامل روز</button>'''


def apply(path, reps):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    p.write_text(t, encoding="utf-8"); print(f"OK {path}")

def slice_cal(path, newfn):
    p = Path(path); t = p.read_text(encoding="utf-8")
    a = "function calHTML(){"
    i = t.index(a)
    j = t.index("\nfunction ", i)
    t = t[:i] + newfn + t[j+1:]
    p.write_text(t, encoding="utf-8"); print(f"OK calHTML {path}")

CAL_HOME_DESK = '''function calHTML(){
  const sd = calSel? DK2(calSel) : TODAY();
  if(calY==null){ const j=toJalali(sd.getFullYear(),sd.getMonth()+1,sd.getDate()); calY=j[0]; calM=j[1]; }
  const first = jFirstGreg(calY,calM);
  let gs=new Date(first.getTime()); while(gs.getDay()!==6) gs=addDays(gs,-1);
  const ge=addDays(gs,41);
  const jSel=toJalali(sd.getFullYear(),sd.getMonth()+1,sd.getDate());
  const gRange=(gs.getMonth()===ge.getMonth()? G_MONTHS[gs.getMonth()] : G_MONTHS[gs.getMonth()]+" - "+G_MONTHS[ge.getMonth()])+" "+faNum(ge.getFullYear());
  let cells="";
  for(let i=0;i<42;i++){
    const dt=addDays(gs,i), j=toJalali(dt.getFullYear(),dt.getMonth()+1,dt.getDate());
    const dk=dkey(dt), st=shiftTypeFor(dt, shiftCfg);
    const sem = st==="day"?"☀️":st==="night"?"🌙":st==="ot"?"⚡":"";
    const nk = kidBlocksFor(family, satIdx(dt), dk).length;
    const nr = remsForDay(REMS, dk).length;
    cells += `<div class="calcell${j[1]===calM?"":" out"}${calSel===dk?" sel":""}${sameDay(dt,TODAY())?" todayc":""}" onclick="calPick('${dk}')">
      <div class="dn">${faNum(j[2])}</div><div class="gn">${faNum(dt.getDate())}</div>
      <div class="ms">${sem}${nr?`<span class="rb">🔔</span>`:""}${nk?`<span class="kb">🎓</span>`:""}</div></div>`;
  }
  const sdk=dkey(sd);
  const ddays = planWeek(tasks, satOf(sd), settings, family, shiftCfg);
  const fday = ddays.find(x=>sameDay(x.date,sd)) || {idx:satIdx(sd), date:sd, active:true, blocks:[], unplaced:[], driver:effDriver(family, satIdx(sd), sdk)};
  const sorted = fday.blocks.slice().sort((a,b)=>a.start-b.start);
  const doneCnt = sorted.filter(b=>isDone(sdk, blockId(b))).length;
  const KC = {kid:"#0d9488", duty:"#c2410c", work:"#475569", fixed:"#b45309"};
  const checklist = `<div class="homecard">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
      <div><b>${jalaliStr(sd)}</b><br><small style="color:var(--muted)">${gregStr(sd,false)}</small></div>
      <span class="chip" style="background:#fff7ed;color:#9a3412;border-color:#fed7aa">🕗 ${SHIFT_FA[fday.shift]||"—"}</span></div>
    ${sorted.length?`<div class="panelnote">${faNum(doneCnt)} از ${faNum(sorted.length)} انجام شد • روی ⭕ تیک بزن • 🔔 یادآورِ ۳۰ دقیقه قبل هر کار • ✕ حذف</div>`:""}
    <div class="cks">${sorted.map(b=>{
      const id=encodeURIComponent(blockId(b));
      const col=KC[b.kind]||"#64748b";
      const on=remState(sdk,b)===1;
      const hid = isHidden(sdk,blockId(b));
      return `<div class="ckrow" style="border-inline-start:4px solid ${col}${hid?";opacity:.45":""}">
        <span class="ckb${isDone(sdk,blockId(b))?" on":""}" onclick="toggleDone('${sdk}','${id}')"></span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13.5px;line-height:1.7">${b.kind==="duty"?esc(b.kid)+" — ":""}${esc(b.title)}${b.ret==="var"&&b.kind==="kid"?' <span class="tag duty">🎒 برگشت متغیر</span>':""}</div>
          <div style="font-size:11.5px;color:var(--muted)"><span class="bell${on?" on":""}" onclick="toggleRem('${sdk}','${id}',${on?1:0})">🔔</span> ${fmtT(b.start)} تا ${fmtT(b.end)}${on?" • یادآور "+faNum(remLeadMin)+" دقیقه قبل":""}${b.notes?" • ✎ "+esc(b.notes):""}</div></div>${hid?`<span class="xdel" onclick="toggleHide('${sdk}','${id}')">↺</span>`:delCtlHTML(sdk,b)}</div>`;
    }).join("")||'<div class="empty">این روز چیزی ندارد 🌿</div>'}</div>
    <div class="addrow"><input id="exT" placeholder="اضافه به این روز: مثلاً ۱۷ تا ۱۸ دکتر"><button onclick="addExtra('${sdk}','exT')">➕ اضافه کن</button></div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="iconbtn" onclick="calGoDay('${sdk}')">📅 نمای کامل روز</button>
      <button class="iconbtn" onclick="calToday()">امروز</button></div></div>`;
  const rl=(REMS||[]).filter(r=>r.date===calSel);
  const remsPanel = calSel? `<div class="homecard">
      <b>🔔 یادآورهای ${jalaliStr(sd)}</b> <small>(${gregStr(sd,false)})</small>
      <div>${rl.map(r=>`<div class="remitem"><span>🔔 ${esc(r.title)} — ${faNum(r.lead||0)} روز قبل، ${faNum(r.times||1)} بار هر ${faNum(r.gapDays||1)} روز</span><button onclick="delRem('${r.id}')">حذف</button></div>`).join("")||'<div class="panelnote">یادآوری ندارد.</div>'}</div>
      <div class="set2">عنوان <input id="remTitle" placeholder="مثلاً تماس با اداره"></div>
      <div class="set2">چقدر زودتر؟ <input type="number" id="remLead" value="2" min="0" style="width:52px"> روز • چند بار؟ <input type="number" id="remTimes" value="3" min="1" style="width:44px"> • فاصله؟ <input type="number" id="remGap" value="1" min="1" style="width:44px"> روز</div>
      <button class="iconbtn" onclick="addRem('${calSel}')">🔔 ثبت یادآور</button>
      <button class="iconbtn" onclick="calGoDay('${calSel}')">📅 برنامهٔ این روز</button>
    </div>` : "";
  return `<div class="homecard">
    <div class="yh1"><span class="yh-side">${J_MONTHS[calM-1]} ${faNum(calY)}</span>
      <span class="yh-big">${faNum(jSel[2])}</span>
      <span class="yh-side">${gRange}</span></div>
    <div class="yh2"><span class="yh-side">${jalaliStr(sd,false)}</span>
      <span class="yh-c">${G_MONTHS[sd.getMonth()]} ${faNum(sd.getFullYear())}</span>
      <span class="yh-side">${gregStr(sd,false)}</span></div>
    <div class="calhead">${["ش","ی","د","س","چ","پ","ج"].map(x=>`<span>${x}</span>`).join("")}</div>
    <div class="calgrid">${cells}</div>
    <div class="panelnote">☀️ روزکار • 🌙 شبکار • ⚡ اضافه‌کار — 🔔 یادآور — 🎓 کلاس. روی روز بزن تا کارهایش پایین بیاید؛ از جعبهٔ «اضافه کن» برنامهٔ همان روز را بنویس.</div>
  </div>` + checklist + remsPanel;
}
'''

apply(BASE/"app-template.html", [
    ("extra-js",  'function dayRequestHTML(day){', EXTRA_JS, 1),
    ("css15",     '</style>', CSS_ADD15, 1),
    ("busy",      BUSY_OLD, BUSY_NEW, 1),
    ("kidsec",    KIDSEC_DESK_OLD, KIDSEC_DESK_NEW, 1),
    ("rows-dk",   ROWS_OLD, ROWS_NEW, 1),
    ("bell-x",    BELL_END_OLD, BELL_END_NEW, 1),
    ("rowsbox",   ROWSBOX_OLD, ROWSBOX_NEW, 1),
    ("tabbar",    TABBAR_OLD, TABBAR_NEW, 1),
    ("tab-default",'let tab = "week";', 'let tab = "cal";', 1),
    ("calpick",   CALPICK_DESK_OLD, CALPICK_DESK_NEW, 1),
])
slice_cal(BASE/"app-template.html", CAL_HOME_DESK)

apply(BASE/"app-mobile-template.html", [
    ("extra-js",  'function dayRequestHTML(day){', EXTRA_JS, 1),
    ("css15",     '</style>', CSS_ADD15, 1),
    ("busy",      BUSY_OLD, BUSY_NEW, 1),
    ("kidsec",    KIDSEC_MOB_OLD, KIDSEC_MOB_NEW, 1),
    ("rows-dk",   ROWS_OLD, ROWS_NEW, 1),
    ("bell-x",    BELL_END_OLD, BELL_END_NEW, 1),
    ("rowsbox",   ROWSBOX_OLD, ROWSBOX_NEW, 1),
    ("ckrow",     MOB_CKROW_OLD, MOB_CKROW_NEW, 1),
    ("addbtn",    MOB_ADDBTN_OLD, MOB_ADDBTN_NEW, 1),
])
print("پچ v15 کامل شد ✓")
