#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""پچ v13 — تم یِکا:
- تیک زدن هر کار روز (دایره ✓) با ذخیرهٔ روزانه (هفتهٔ بعد پاک از تیک)
- موبایل: نمای «تقویم» شد خانهٔ یِکا: تقویم ماه (دو تقویمی) بالا + چک‌لیست روز پایین + یادآورها
- موبایل: پیش‌فرض باز شدن روی خانه (تقویم+امروز)
- دسکتاپ: تقویم ماه هم دو تقویمی شد + تیک در نمای روز
- SEED v13: راننده‌های کهنهٔ ۱۲ شهریور پاک می‌شوند"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

DONE_JS = '''/* ── تیک کارها ── */
let doneMap = {};
try{ doneMap = JSON.parse(store.get("wp2_done")||"{}")||{}; }catch(e){ doneMap={}; }
function blockId(b){ return b.kind+"|"+b.start+"|"+(b.kid||"")+"|"+b.title; }
function isDone(dk, id){ return !!(doneMap[dk] && doneMap[dk][id]); }
function toggleDone(dk, id){
  id = decodeURIComponent(id);
  if(!doneMap[dk]) doneMap[dk]={};
  if(doneMap[dk][id]) delete doneMap[dk][id]; else doneMap[dk][id]=1;
  const ks=Object.keys(doneMap).sort();
  if(ks.length>120) ks.slice(0,ks.length-90).forEach(k=>{ delete doneMap[k]; });
  store.set("wp2_done", JSON.stringify(doneMap));
  render();
}
function dayRequestHTML(day){'''

CSS_ADD = '''/* ── تیک و خانهٔ یِکا ── */
.ckb{display:inline-block;width:22px;height:22px;border:2px solid #94a3b8;border-radius:50%;cursor:pointer;flex:none}
.ckb.on{background:#22c55e;border-color:#22c55e;position:relative}
.ckb.on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800}
.ti .ckb{margin-top:0;vertical-align:-5px;margin-inline-end:6px}
.row.doneRow{opacity:.8}
.row.doneRow .ti{opacity:.65}
.row.doneRow .ti span:last-child{text-decoration:line-through}
.ckrow{display:flex;gap:9px;align-items:flex-start;background:#fafafa;border-radius:10px;padding:7px 10px;margin:4px 0}
.calcell .gn{font-size:9px;color:#94a3b8;line-height:1.1}
.calcell.todayc{background:#eef2ff;border-color:#6366f1}
</style>'''

ROWDIV_OLD = '<div class="row${b.kind==="fixed"?" fixed":""}${b.kind==="duty"?" duty":""}${b.kind==="work"?" work":""}" style="--bc:${bc}">'
ROWDIV_NEW = '<div class="row${did?" doneRow":""}${b.kind==="fixed"?" fixed":""}${b.kind==="duty"?" duty":""}${b.kind==="work"?" work":""}" style="--bc:${bc}">'
TI_OLD = '<div class="ti">${esc(b.title)}</div>'
TI_NEW = '<div class="ti">${ck}${esc(b.title)}</div>'

MIG_OLD = '''    if(store.get("wp2_seedVer")!==SEED_VER && family && family.kids){
      if(!family.driverByKidDate || !family.driverByKidDate["2026-09-12"])
        family.driverByKidDate = {"2026-09-12":{"پارسا":{"go":"اسنپ"},"مهرسا":{"go":"من","ret":"خانمم"}}};
      family.kids = seedKids();
      family.notes = seedNotes();
      store.set("wp2_seedVer", SEED_VER);
      saveState();
    }'''
MIG_NEW = '''    if(store.get("wp2_seedVer")!==SEED_VER && family && family.kids){
      family.driverByKidDate = {};
      family.kids = seedKids();
      family.notes = seedNotes();
      store.set("wp2_seedVer", SEED_VER);
      saveState();
    }'''

FAM_OLD = '''    driverByKidDate:{"2026-09-12":{"پارسا":{"go":"اسنپ"},"مهرسا":{"go":"من","ret":"خانمم"}}}, driverByDate:{},'''
FAM_NEW = '''    driverByKidDate:{}, driverByDate:{},'''

MOBILE_CAL = '''function calHTML(){
  const base = calSel? DK2(calSel) : TODAY();
  if(calY==null){ const j=toJalali(base.getFullYear(),base.getMonth()+1,base.getDate()); calY=j[0]; calM=j[1]; }
  const first = jFirstGreg(calY,calM);
  let gs=new Date(first.getTime()); while(gs.getDay()!==6) gs=addDays(gs,-1);
  const ge=addDays(gs,41);
  const gRange=(gs.getMonth()===ge.getMonth()? G_MONTHS[gs.getMonth()] : G_MONTHS[gs.getMonth()]+" تا "+G_MONTHS[ge.getMonth()])+" "+faNum(ge.getFullYear());
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
  /* چک‌لیست روز انتخاب‌شده */
  const sd = calSel? DK2(calSel) : TODAY();
  const sdk = dkey(sd);
  const ddays = planWeek(tasks, satOf(sd), settings, family, shiftCfg);
  const fday = ddays.find(x=>sameDay(x.date,sd)) || {idx:satIdx(sd), date:sd, active:true, blocks:[], unplaced:[], driver:effDriver(family, satIdx(sd), sdk)};
  const sorted = fday.blocks.slice().sort((a,b)=>a.start-b.start);
  const doneCnt = sorted.filter(b=>isDone(sdk, blockId(b))).length;
  const KC = {kid:"#0d9488", duty:"#c2410c", work:"#475569", fixed:"#b45309"};
  const checklist = `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div><b>${jalaliStr(sd)}</b> <small style="color:var(--muted)">${gregStr(sd,false)}</small></div>
      <span class="chip" style="background:#fff7ed;color:#9a3412;border-color:#fed7aa">🕗 ${SHIFT_FA[fday.shift]||"—"}</span></div>
    ${sorted.length?`<div class="panelnote" style="margin-top:5px">${faNum(doneCnt)} از ${faNum(sorted.length)} انجام شد • روی دایره بزن تا تیک بخورد • 🔔 = اعلان نیم‌ساعت قبل</div>`:""}
    <div class="cks">${sorted.map(b=>{
      const id=encodeURIComponent(blockId(b));
      const col=KC[b.kind]||"#64748b";
      return `<div class="ckrow" style="border-inline-start:4px solid ${col}">
        <span class="ckb${isDone(sdk,blockId(b))?" on":""}" onclick="toggleDone('${sdk}','${id}')"></span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13.5px;line-height:1.7">${b.kind==="duty"?esc(b.kid)+" — ":""}${esc(b.title)}${b.ret==="var"&&b.kind==="kid"?' <span class="tag duty">🎒 برگشت متغیر</span>':""}</div>
          <div style="font-size:11px;color:var(--muted)">${fmtT(b.start)} تا ${fmtT(b.end)}${b.notes?" • ✎ "+esc(b.notes):""}</div></div>
        <span style="font-size:14px;opacity:${b.kind==="kid"?0.95:0.3}" title="اعلان نیم‌ساعت قبل">🔔</span></div>`;
    }).join("")||'<div class="empty">این روز چیزی ندارد 🌿</div>'}</div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="xs" onclick="calGoDay('${sdk}')">📅 نمای کامل روز</button>
      <button class="xs" onclick="calToday()">امروز</button></div></div>`;
  const rl=(REMS||[]).filter(r=>r.date===calSel);
  const remsPanel = calSel? `<div class="card">
      <b>🔔 یادآورهای ${jalaliStr(sd)}</b> <small>(${gregStr(sd,false)})</small>
      <div>${rl.map(r=>`<div class="remitem"><span>🔔 ${esc(r.title)} — ${faNum(r.lead||0)} روز قبل، ${faNum(r.times||1)} بار هر ${faNum(r.gapDays||1)} روز</span><button onclick="delRem('${r.id}')">حذف</button></div>`).join("")||'<div class="panelnote">یادآوری ندارد.</div>'}</div>
      <div class="set2">عنوان <input id="remTitle" placeholder="مثلاً تماس با اداره"></div>
      <div class="set2">چقدر زودتر؟ <input type="number" id="remLead" value="2" min="0" style="width:52px"> روز • چند بار؟ <input type="number" id="remTimes" value="3" min="1" style="width:44px"> • فاصله؟ <input type="number" id="remGap" value="1" min="1" style="width:44px"> روز</div>
      <button class="xs" onclick="addRem('${calSel}')">🔔 ثبت یادآور</button>
      <button class="xs" onclick="calGoDay('${calSel}')">📅 برنامهٔ این روز</button>
    </div>` : "";
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="navbtn" onclick="calShift(1)">‹</button>
      <div style="text-align:center"><b>${J_MONTHS[calM-1]} ${faNum(calY)}</b><br><small style="color:var(--muted)">${gRange}</small></div>
      <button class="navbtn" onclick="calShift(-1)">›</button></div>
    <div class="calhead">${["ش","ی","د","س","چ","پ","ج"].map(x=>`<span>${x}</span>`).join("")}</div>
    <div class="calgrid">${cells}</div>
    <div class="panelnote">☀️ روزکار • 🌙 شبکار • ⚡ اضافه‌کار — 🔔 یادآور — 🎓 کلاس بچه‌ها. روی روز بزن تا کارهایش را ببینی و تیک بزن.</div>
  </div>` + checklist + remsPanel;
}
'''

MOBILE_RENDER_OLD = '''  } else {
    document.getElementById("mainWeek").innerHTML = remBannerHTML() + weekDays.map(d=>dayCardHTML(d, today, {selectable:true})).join("");
  }'''
MOBILE_RENDER_NEW = '''  }
  document.getElementById("mainWeek").innerHTML = remBannerHTML() + weekDays.map(d=>dayCardHTML(d, today, {selectable:true})).join("");'''

MOBILE_CALPICK_OLD = '''function calPick(dk){ calSel=(calSel===dk)?null:dk; render(); }
function calGoDay(dk){ dayDate=DK2(dk); setMode("day"); }'''
MOBILE_CALPICK_NEW = '''function calPick(dk){ calSel=dk; render(); }
function calGoDay(dk){ dayDate=DK2(dk); setMode("day"); }
function calToday(){ const t=TODAY(); calSel=dkey(t); const j=toJalali(t.getFullYear(),t.getMonth()+1,t.getDate()); calY=j[0]; calM=j[1]; render(); }'''

MOBILE_INIT_OLD = '''  checkNotifs();
  render();
}
init();'''
MOBILE_INIT_NEW = '''  if(!calSel) calSel=dkey(TODAY());
  checkNotifs();
  setMode(mode);
}
init();'''

DESK_CELL_OLD = '''    cells += `<div class="calcell${j[1]===calM?"":" out"}${calSel===dk?" sel":""}" onclick="calPick('${dk}')">
      <div class="dn">${faNum(j[2])}</div><div class="ms">${sem}${nr?`<span class="rb">🔔${nr>1?faNum(nr):""}</span>`:""}${nk?`<span class="kb">🎓${faNum(nk)}</span>`:""}</div></div>`;'''
DESK_CELL_NEW = '''    cells += `<div class="calcell${j[1]===calM?"":" out"}${calSel===dk?" sel":""}${sameDay(dt,TODAY())?" todayc":""}" onclick="calPick('${dk}')">
      <div class="dn">${faNum(j[2])}</div><div class="gn">${faNum(dt.getDate())}</div><div class="ms">${sem}${nr?`<span class="rb">🔔${nr>1?faNum(nr):""}</span>`:""}${nk?`<span class="kb">🎓${faNum(nk)}</span>`:""}</div></div>`;'''

DESK_HDR_OLD = '''      <b>${J_MONTHS[calM-1]} ${faNum(calY)}</b>'''
DESK_HDR_NEW = '''      <div style="text-align:center"><b>${J_MONTHS[calM-1]} ${faNum(calY)}</b><br><small style="color:var(--muted);font-weight:500">${(()=>{const g1=new Date(gs.getTime()),g2=addDays(gs,41);return (g1.getMonth()===g2.getMonth()?G_MONTHS[g1.getMonth()]:G_MONTHS[g1.getMonth()]+" تا "+G_MONTHS[g2.getMonth()])+" "+faNum(g2.getFullYear());})()}</small></div>'''

DESK_ROWDEF_OLD = '''function rowHTML(b, big){
  const pc = {1:"var(--p1)",2:"var(--p2)",3:"var(--p3)"}[b.priority];'''
DESK_ROWDEF_NEW = '''function rowHTML(b, big, dk){
  const pc = {1:"var(--p1)",2:"var(--p2)",3:"var(--p3)"}[b.priority];
  const did = dk ? isDone(dk, blockId(b)) : false;
  const ck = (big && dk) ? `<span class="ckb${did?" on":""}" onclick="event.stopPropagation();toggleDone('${dk}','${encodeURIComponent(blockId(b))}')"></span>` : "";'''

MOB_ROWDEF_OLD = '''function rowHTML(b){
  const pc = {1:"var(--p1)",2:"var(--p2)",3:"var(--p3)"}[b.priority];'''
MOB_ROWDEF_NEW = '''function rowHTML(b, big, dk){
  const pc = {1:"var(--p1)",2:"var(--p2)",3:"var(--p3)"}[b.priority];
  const did = dk ? isDone(dk, blockId(b)) : false;
  const ck = (big && dk) ? `<span class="ckb${did?" on":""}" onclick="event.stopPropagation();toggleDone('${dk}','${encodeURIComponent(blockId(b))}')"></span>` : "";'''


def apply(path, reps, slices=None):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    for name, a, b in (slices or []):
        i1, i2 = t.find(a), t.find(b)
        if i1<0 or i2<0 or i2<=i1: raise SystemExit(f"[{path}] slice «{name}» پیدا نشد")
        t = t[:i1] + b_name_val(name) + t[i2:]
    p.write_text(t, encoding="utf-8"); print(f"OK {path}")


def b_name_val(name):
    return MOBILE_CAL

COMMON = [
    ("SEED_VER",   'const SEED_VER = "12";', 'const SEED_VER = "13";', 1),
    ("migration",  MIG_OLD, MIG_NEW, 1),
    ("fam-default",FAM_OLD, FAM_NEW, 1),
    ("done-js",    'function dayRequestHTML(day){', DONE_JS, 1),
    ("css",        '</style>', CSS_ADD, 1),
    ("rowdiv",     ROWDIV_OLD, ROWDIV_NEW, 1),
    ("ti",         TI_OLD, TI_NEW, 1),
]

apply(BASE/"app-template.html", COMMON + [
    ("rowdef",   DESK_ROWDEF_OLD, DESK_ROWDEF_NEW, 1),
    ("rowcall",  'rows += rowHTML(b,true);', 'rows += rowHTML(b,true,dk);', 1),
    ("cal-cell", DESK_CELL_OLD, DESK_CELL_NEW, 1),
    ("cal-hdr",  DESK_HDR_OLD, DESK_HDR_NEW, 1),
])

apply(BASE/"app-mobile-template.html", COMMON + [
    ("mode-def", 'let mode = "week";', 'let mode = "cal";', 1),
    ("rowdef",   MOB_ROWDEF_OLD, MOB_ROWDEF_NEW, 1),
    ("rowcall1", 'rows += rowHTML(b);', 'rows += rowHTML(b,true,dk);', 1),
    ("rowcall2", 'rows = busy.map(b=>rowHTML(b)).join("");', 'rows = busy.map(b=>rowHTML(b,false)).join("");', 1),
    ("calpick",  MOBILE_CALPICK_OLD, MOBILE_CALPICK_NEW, 1),
    ("render-wk",MOBILE_RENDER_OLD, MOBILE_RENDER_NEW, 1),
    ("init",     MOBILE_INIT_OLD, MOBILE_INIT_NEW, 1),
], slices=[("calHTML", "function calHTML(){", "function addRem(dk){")])

print("پچ v13 کامل شد ✓")
