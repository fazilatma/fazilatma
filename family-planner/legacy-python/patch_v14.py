#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""پچ v14 — هدر تقویم دقیقاً به سبک یِکا + یادآورِ قابل تنظیم برای تک‌تک کارها:
- هدر: عدد بزرگ روز انتخابی در وسط • چپ: ماه شمسی • راست: بازهٔ میلادی؛ ردیف دوم: تاریخ کامل شمسی/میلادی
- خِل امروز: حلقهٔ آبی دور عدد (مثل عکس)
- هر کار در چک‌لیست: 🔔 کنار ساعت — با ضربه روشن/خاموش (پیش‌فرض: کلاس‌ها روشن، بقیه خاموش) + ذخیره
- چیپ یادآور در نمای روز (موبایل و دسکتاپ) + موتور اعلان از وضعیت هر کار پیروی می‌کند"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

REM_JS = '''/* ── یادآورِ هر کار (نیم‌ساعت قبل) ── */
let remLeadMin = 30;
let remMap = {};
try{ remMap = JSON.parse(store.get("wp2_rem")||"{}")||{}; }catch(e){ remMap={}; }
function remState(dk, b){
  const id = blockId(b);
  if(remMap[dk] && remMap[dk][id]!=null) return remMap[dk][id];
  return b.kind==="kid" ? 1 : 0;
}
function toggleRem(dk, id, cur){
  id = decodeURIComponent(id);
  if(!remMap[dk]) remMap[dk]={};
  remMap[dk][id] = cur ? 0 : 1;
  const ks=Object.keys(remMap).sort();
  if(ks.length>120) ks.slice(0,ks.length-90).forEach(k=>{ delete remMap[k]; });
  store.set("wp2_rem", JSON.stringify(remMap));
  render();
}
function dayRequestHTML(day){'''

NOTIF_OLD = '''      if(b.kind!=="kid"||b.start<=nm||b.start>nm+30) continue;'''
NOTIF_NEW = '''      if(b.start<=nm||b.start>nm+30) continue;
      if(remState(dk,b)!==1) continue;'''

BELL_OLD = '''  if(b.online) tags.push(`<span class="tag work">🎧 آنلاین</span>`);'''
BELL_NEW = '''  if(b.online) tags.push(`<span class="tag work">🎧 آنلاین</span>`);
  if(big&&dk){
    const ron = remState(dk,b)===1;
    tags.push(`<span class="tag${ron?"":" tagoff"}" style="cursor:pointer" onclick="event.stopPropagation();toggleRem('${dk}','${encodeURIComponent(blockId(b))}',${ron?1:0})">${ron?"🔔 یادآور ۳۰د":"🔕 یادآور"}</span>`);
  }'''

CSS_ADD = '''/* ── هدر یِکا و یادآور هر کار ── */
.yh1{display:flex;align-items:center;justify-content:space-between;gap:6px}
.yh1 .yh-big{font-size:32px;font-weight:800;color:var(--accent);min-width:70px;text-align:center}
.yh-side{font-size:11px;color:var(--muted);flex:1;text-align:center;line-height:1.5}
.yh2{display:flex;justify-content:space-between;gap:6px;margin-top:2px}
.yh2 .yh-c{color:var(--accent);font-weight:800;font-size:13.5px;flex:1;text-align:center}
.calcell.todayc .dn{display:inline-block;min-width:22px;border:2px solid var(--accent);border-radius:50%;line-height:19px;color:var(--accent)}
.bell{cursor:pointer;opacity:.32;margin-inline-end:3px;font-size:13px}
.bell.on{opacity:1}
.tag.tagoff{opacity:.55}
</style>'''

MOBILE_CAL = '''function calHTML(){
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
  /* کارهای روز انتخاب‌شده — یادآورِ هر کار جداگانه تنظیم می‌شود */
  const sdk=dkey(sd);
  const ddays = planWeek(tasks, satOf(sd), settings, family, shiftCfg);
  const fday = ddays.find(x=>sameDay(x.date,sd)) || {idx:satIdx(sd), date:sd, active:true, blocks:[], unplaced:[], driver:effDriver(family, satIdx(sd), sdk)};
  const sorted = fday.blocks.slice().sort((a,b)=>a.start-b.start);
  const doneCnt = sorted.filter(b=>isDone(sdk, blockId(b))).length;
  const KC = {kid:"#0d9488", duty:"#c2410c", work:"#475569", fixed:"#b45309"};
  const checklist = `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
      <div><b>${jalaliStr(sd)}</b><br><small style="color:var(--muted)">${gregStr(sd,false)}</small></div>
      <span class="chip" style="background:#fff7ed;color:#9a3412;border-color:#fed7aa">🕗 ${SHIFT_FA[fday.shift]||"—"}</span></div>
    ${sorted.length?`<div class="panelnote">${faNum(doneCnt)} از ${faNum(sorted.length)} انجام شد • روی ⭕ تیک بزن • روی 🔔 هر کار بزن تا یادآورِ ${faNum(remLeadMin)} دقیقه قبلش روشن/خاموش شود</div>`:""}
    <div class="cks">${sorted.map(b=>{
      const id=encodeURIComponent(blockId(b));
      const col=KC[b.kind]||"#64748b";
      const on=remState(sdk,b)===1;
      return `<div class="ckrow" style="border-inline-start:4px solid ${col}">
        <span class="ckb${isDone(sdk,blockId(b))?" on":""}" onclick="toggleDone('${sdk}','${id}')"></span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13.5px;line-height:1.7">${b.kind==="duty"?esc(b.kid)+" — ":""}${esc(b.title)}${b.ret==="var"&&b.kind==="kid"?' <span class="tag duty">🎒 برگشت متغیر</span>':""}</div>
          <div style="font-size:11.5px;color:var(--muted)"><span class="bell${on?" on":""}" onclick="toggleRem('${sdk}','${id}',${on?1:0})">🔔</span> ${fmtT(b.start)} تا ${fmtT(b.end)}${on?" • یادآور "+faNum(remLeadMin)+" دقیقه قبل":""}${b.notes?" • ✎ "+esc(b.notes):""}</div></div></div>`;
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
    <div class="yh1"><span class="yh-side">${J_MONTHS[calM-1]} ${faNum(calY)}</span>
      <span class="yh-big">${faNum(jSel[2])}</span>
      <span class="yh-side">${gRange}</span></div>
    <div class="yh2"><span class="yh-side">${jalaliStr(sd,false)}</span>
      <span class="yh-c">${G_MONTHS[sd.getMonth()]} ${faNum(sd.getFullYear())}</span>
      <span class="yh-side">${gregStr(sd,false)}</span></div>
    <div class="calhead">${["ش","ی","د","س","چ","پ","ج"].map(x=>`<span>${x}</span>`).join("")}</div>
    <div class="calgrid">${cells}</div>
    <div class="panelnote">☀️ روزکار • 🌙 شبکار • ⚡ اضافه‌کار — 🔔 یادآور — 🎓 کلاس. روی روز بزن تا کارهایش پایین بیاید.</div>
  </div>` + checklist + remsPanel;
}
'''


def apply(path, reps, slices=None):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    for name, a, b in (slices or []):
        i1, i2 = t.find(a), t.find(b)
        if i1<0 or i2<0 or i2<=i1: raise SystemExit(f"[{path}] slice «{name}» پیدا نشد")
        t = t[:i1] + MOBILE_CAL + t[i2:]
    p.write_text(t, encoding="utf-8"); print(f"OK {path}")

COMMON = [
    ("rem-js",     'function dayRequestHTML(day){', REM_JS, 1),
    ("notif-cond", NOTIF_OLD, NOTIF_NEW, 1),
    ("bell-chip",  BELL_OLD, BELL_NEW, 1),
    ("css",        '</style>', CSS_ADD, 1),
]

apply(BASE/"app-mobile-template.html", COMMON,
      slices=[("calHTML", "function calHTML(){", "function addRem(dk){")])
apply(BASE/"app-template.html", COMMON)
print("پچ v14 کامل شد ✓")
