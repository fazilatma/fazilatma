#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""پچ v12: کلاس‌های جدید (مدرسه/شنا ۱۵–۱۷/زبان‌های آنلاین/تکواندو ش‌ی‌پ/فیروزه دوشنبه/موسیقی شنبه)
+ خانمم به‌عنوان عضو کلاس‌ها (شنا/گروهی) + حذف کونگ‌فو + پایتون پنجشنبه متغیر
+ اعلان نیم‌ساعت قبل کلاس‌ها + نوار «کلاس بعدی» + قاعدهٔ ساعت کلاس بدون واژهٔ «کلاس»."""
from pathlib import Path

BASE = Path(__file__).resolve().parent

SEED_KIDS_OLD = '''function seedKids(){ return [
  {id:"k1", name:"پارسا", classes:[
    {id:"p1",  title:"پایتون", weekdays:[0], start:870, end:900},
    {id:"p2",  title:"والیبال (پرورده)", weekdays:[0,2,4], start:1080, end:1170, travel:30, ret:"var"},
    {id:"p3",  title:"والیبال (ابوالمعصومی)", weekdays:[1], start:870, end:960, travel:0, ret:"var"},
    {id:"p5",  title:"زبان (آنلاین)", weekdays:[1], start:1140, end:1200, travel:0, online:true},
    {id:"p6",  title:"کونگ‌فو", weekdays:[1], start:1260, end:1350},
    {id:"p8",  title:"زبان (آنلاین)", weekdays:[3], start:960, end:1020, travel:0, online:true},
    {id:"p9",  title:"رباتیک", weekdays:[3], start:1110, end:1200},
    {id:"p10", title:"کونگ‌فو", weekdays:[3], start:1260, end:1350},
    {id:"p11", title:"والیبال (ابوالمعصومی)", weekdays:[4], start:900, end:1020, travel:30}
  ]},
  {id:"k2", name:"مهرسا", classes:[
    {id:"m1",  title:"شنا", weekdays:[0], start:900, end:960, travel:30, ret:"var", retNote:"گاهی تا ۱۷ می‌ماند — برگشت با خانمم یا انصاری"},
    {id:"m2",  title:"موسیقی", weekdays:[0], start:1260, end:1290},
    {id:"m3",  title:"زبان (آنلاین)", weekdays:[1], start:810, end:870, travel:0, online:true},
    {id:"m4",  title:"فیروزه انفرادی", weekdays:[1], start:900, end:960, travel:30},
    {id:"m5",  title:"تکواندو", weekdays:[1], start:1140, end:1230},
    {id:"m6",  title:"شنا", weekdays:[2], start:900, end:960, travel:30, ret:"var", retNote:"گاهی تا ۱۷ می‌ماند — برگشت با خانمم یا انصاری"},
    {id:"m7",  title:"کارگاه حل مسئله (فیروزه)", weekdays:[5], start:960, end:1020, travel:30},
    {id:"m8",  title:"زبان", weekdays:[3], start:900, end:960},
    {id:"m9",  title:"تکواندو", weekdays:[3], start:1140, end:1230},
    {id:"m10", title:"شنا", weekdays:[4], start:900, end:960, travel:30, ret:"var", retNote:"گاهی تا ۱۷ می‌ماند — برگشت با خانمم یا انصاری"},
    {id:"m11", title:"موسیقی", weekdays:[5], start:1170, end:1230},
  ]}];
}'''

SEED_KIDS_NEW = '''function seedKids(){ return [
  {id:"k1", name:"پارسا", classes:[
    {id:"ps1", title:"مدرسه", weekdays:[0,1,2,3], start:480, end:810, travel:0, nodrv:true},
    {id:"p1",  title:"پایتون", weekdays:[5], start:900, end:990, varTime:true},
    {id:"p2",  title:"والیبال (پرورده)", weekdays:[0,2,4], start:1080, end:1170, travel:30, ret:"var"},
    {id:"p3",  title:"والیبال (ابوالمعصومی)", weekdays:[1], start:870, end:960, travel:0, ret:"var"},
    {id:"p5",  title:"زبان (آنلاین)", weekdays:[1,3], start:990, end:1050, travel:0, online:true},
    {id:"p9",  title:"رباتیک", weekdays:[3], start:1110, end:1200},
    {id:"p11", title:"والیبال (ابوالمعصومی)", weekdays:[4], start:900, end:1020, travel:30}
  ]},
  {id:"k2", name:"مهرسا", classes:[
    {id:"ms1", title:"مدرسه", weekdays:[0,1,2,3], start:480, end:810, travel:0, nodrv:true},
    {id:"m1",  title:"شنا", weekdays:[0,2,4], start:900, end:1080, travel:30, ret:"var"},
    {id:"m2",  title:"موسیقی", weekdays:[0], start:1170, end:1200},
    {id:"m3",  title:"زبان (آنلاین)", weekdays:[1,3], start:930, end:990, travel:0, online:true},
    {id:"m4",  title:"فیروزه انفرادی", weekdays:[2], start:1140, end:1200, travel:30},
    {id:"m5",  title:"تکواندو", weekdays:[1,3,5], start:1140, end:1230},
    {id:"m7",  title:"کارگاه حل مسئله (فیروزه)", weekdays:[5], start:960, end:1020, travel:30}
  ]},
  {id:"kw", name:"خانمم", classes:[
    {id:"w1", title:"شنا", weekdays:[0,2,4], start:900, end:1080, travel:0, nodrv:true},
    {id:"w2", title:"کلاس گروهی مادران (با فیروزه)", weekdays:[3], start:960, end:1050, travel:0, nodrv:true}
  ]}
];}'''

SEED_NOTES_OLD = '''function seedNotes(){ return [
  {text:"📞 فیروزهٔ انفرادی پارسا: دوشنبه‌ها — ساعتش هر هفته متغیره", weekdays:[2]},
  {text:"📅 والیبال پرورده: شنبه/دوشنبه/چهارشنبه ۱۸–۱۹:۳۰ — جمعه‌ها هیچ کلاسی ندارند", weekdays:[0,1,2,3,4,5,6]}
];}'''

SEED_NOTES_NEW = '''function seedNotes(){ return [
  {text:"🏫 مدرسهٔ بچه‌ها: شنبه تا چهارشنبه ۸ تا ۱۳:۳۰ — کار خانمم هم تا ۱۳:۳۰", weekdays:[0,1,2,3]},
  {text:"📞 فیروزهٔ انفرادی پارسا: دوشنبه‌ها — ساعتش هر هفته متغیره", weekdays:[2]},
  {text:"🐍 پایتون پارسا: پنجشنبه‌ها، ساعت هر هفته فرق می‌کند — شب قبل یا صبح پنجشنبه بنویس: «پایتون پارسا ۱۵ تا ۱۶:۳۰»", weekdays:[3,5]},
  {text:"📅 والیبال پرورده: شنبه/دوشنبه/چهارشنبه ۱۸–۱۹:۳۰ — جمعه‌ها هیچ کلاسی ندارند", weekdays:[0,1,2,3,4,5,6]},
  {text:"🏊 شنا خانمم: خودش می‌رود — ۳۰ دقیقه رفت و ۳۰ دقیقه برگشت (ش/د/چ ۱۵–۱۷)", weekdays:[0,2,4]},
  {text:"👩‍👧 کلاس گروهی مادران با فیروزه: سه‌شنبه ۱۶–۱۷:۳۰", weekdays:[3]},
  {text:"📞 جلسهٔ خصوصی خانمم با فیروزه: روز وساعتش متغیره — در کادر درخواستِ همان روز بنویس: «جلسه فیروزه ۱۷ تا ۱۸:۳۰»", weekdays:[0,1,2,3,4,5]},
  {text:"❌ کونگ‌فو پارسا تا اطلاع ثانوی کنسل است", weekdays:[1,3]}
];}'''

SHIFTVER_OLD = '''    if(store.get("wp2_shiftVer")!=="6"){ shiftCfg.anchor="2026-09-19"; shiftCfg.anchorType="day"; shiftCfg.overrides={"2026-09-11":"night","2026-09-12":"night","2026-09-13":"rest","2026-09-14":"rest","2026-09-15":"day","2026-09-16":"night","2026-09-17":"rest","2026-09-18":"rest"}; shiftCfg.wife={...DEFAULT_SHIFT.wife}; store.set("wp2_shiftVer","6"); }'''
SHIFTVER_NEW = '''    if(store.get("wp2_shiftVer")!=="7"){ shiftCfg.wife={...DEFAULT_SHIFT.wife}; store.set("wp2_shiftVer","7"); }'''

CLKRULE_OLD = '''  if(/کلاس/.test(line) && tm && family){
    const st=(+tm[1])*60+(tm[2]?+tm[2]:0), en=(+tm[3])*60+(tm[4]?+tm[4]:0);
    const q=line.replace(/ساعت|کلاس|به|تغییر|کن/g," ").replace(tm[0]," ").trim();
    for(const k of (family.kids||[])) for(const c of (k.classes||[])){
      const t=c.title||"";
      if((((c.weekdays||[]).includes(idx)) || ((c.dates||[]).includes(dk))) && q && (t.includes(q)||q.includes(t.split(" ")[0]))){
        c.start=st; c.end=en;
        return okm("⏰","«"+t+"» شد "+fmtT(st)+" تا "+fmtT(en)+((c.weekdays||[]).length>1?" (همهٔ روزهای این کلاس)":""));
      }
    }
    return err("کلاس برای تغییر ساعت پیدا نشد");
  }'''

CLKRULE_NEW = '''  if(tm && family){
    const st=(+tm[1])*60+(tm[2]?+tm[2]:0), en=(+tm[3])*60+(tm[4]?+tm[4]:0);
    if(en>st){
      const q=line.replace(/ساعت|کلاس|به|تغییر|کن/g," ").replace(tm[0]," ").trim();
      const anotherKid=(family.kids||[]).some(x=>line.includes(x.name));
      for(const k of (family.kids||[])) for(const c of (k.classes||[])){
        const t=c.title||"";
        if(q && (t.includes(q)||q.includes(t.split(" ")[0]))){
          if(anotherKid && !line.includes(k.name)) continue;
          c.start=st; c.end=en;
          return okm("⏰","«"+t+"» برای "+k.name+" شد "+fmtT(st)+" تا "+fmtT(en)+((c.weekdays||[]).length>1?" (همهٔ روزهای این کلاس)":""));
        }
      }
      if(/کلاس/.test(line)) return err("کلاس برای تغییر ساعت پیدا نشد");
    }
  }'''

PLACE_OLD = '''placeholder="راننده: اسنپ
شیفت: استراحت
حذف کلاس تکواندو
ساعت کلاس فیروزه به ۱۶ تا ۱۷:۳۰
۱۷:۳۰ تا ۱۸:۳۰ خرید"'''
PLACE_NEW = '''placeholder="راننده: اسنپ
پایتون پارسا ۱۵ تا ۱۶:۳۰
حذف کلاس تکواندو
ساعت کلاس شنا به ۱۶ تا ۱۷:۳۰
۱۷:۳۰ تا ۱۸:۳۰ خرید"'''

KS_OLD = '''  const ks=[...new Set(day.blocks.filter(b=>b.kind==="kid").map(b=>b.kid))];'''
KS_NEW = '''  const ks=[...new Set(day.blocks.filter(b=>b.kind==="kid"&&!b.nodrv).map(b=>b.kid))];'''

NIGHT_OLD = '''      <b>🌙 مرور شبانه</b> — ثابت‌های فردا همینه. اگه کار جدیدی داری از «افزودن کار روزانه» پایین اضافه کن، وگرنه برنامهٔ فردا رو ببند تا خروجی‌ش رو بگیری.'''
NIGHT_NEW = '''      <b>🌙 مرور شبانه</b> — ثابت‌های فردا همینه. اگه کار جدیدی داری از «افزودن کار روزانه» پایین اضافه کن، وگرنه برنامهٔ فردا رو ببند تا خروجی‌ش رو بگیری.
      ${satIdx(tm)===5?'<div style="margin-top:6px;font-weight:800;color:#92400e">🐍 فردا پایتون پارساست — ساعتش را در کادر «درخواست تغییر» پایین همین صفحه بنویس (مثلاً: پایتون پارسا ۱۵ تا ۱۶:۳۰) تا برنامهٔ فردا با آن ساعت رندر شود.</div>':''}'''

INIT_OLD = '''  render();
}
init();'''
INIT_NEW = '''  checkNotifs();
  render();
}
init();'''

TOAST_ANCHOR = '''
</div>

<script>
/*CORE-START*/'''
TOAST_NEW = '''
<div class="toastwrap" id="toastwrap"></div>
</div>

<script>
/*CORE-START*/'''

NOTIF_MODULE = '''/* ── اعلان کلاس‌ها (نیم‌ساعت قبل) ── */
let notifOn = store.get("wp2_notif")!=="0";
let notifFired = {};
try{ notifFired = JSON.parse(store.get("wp2_notifFired")||"{}")||{}; }catch(e){ notifFired={}; }
function notifToggle(){
  notifOn = !notifOn; store.set("wp2_notif", notifOn?"1":"0");
  if(notifOn && typeof Notification!=="undefined" && Notification.permission==="default"){
    try{ const p=Notification.requestPermission(); if(p&&p.then) p.then(function(){ render(); }).catch(function(){}); }catch(e){}
  }
  render();
}
function notifToast(msg){
  const w=document.getElementById("toastwrap"); if(!w) return;
  const d=document.createElement("div"); d.className="toast"; d.innerHTML=msg;
  w.appendChild(d);
  setTimeout(function(){ if(d&&d.remove) d.remove(); }, 45000);
}
function nextClassHTML(day){
  try{
    if(!day) return "";
    const kids=day.blocks.filter(function(b){return b.kind==="kid";}).sort(function(a,b){return a.start-b.start;});
    if(!kids.length) return "";
    const now=new Date();
    const isToday=sameDay(day.date, now);
    const nm=now.getHours()*60+now.getMinutes();
    const k=isToday? kids.find(function(b){return b.start>nm;}) : kids[0];
    if(!k) return "";
    const when=isToday? "، "+fmtDur(k.start-nm)+" دیگر" : " — "+DAY_NAMES[satIdx(day.date)];
    return '<div class="notifbar">🔔 '+(isToday?"کلاس بعدی: ":"اولین کلاس: ")+"<b>"+esc(k.kid)+" — "+esc(k.title)+"</b> ساعت "+fmtT(k.start)+when+"</div>";
  }catch(e){ return ""; }
}
function checkNotifs(){
  if(!notifOn) return;
  try{
    const now=new Date(); const dk=dkey(now); const nm=now.getHours()*60+now.getMinutes();
    const days=planWeek(tasks, satOf(now), settings, family, shiftCfg);
    const day=days[satIdx(now)]; if(!day) return;
    let changed=false;
    for(const b of day.blocks){
      if(b.kind!=="kid"||b.start<=nm||b.start>nm+30) continue;
      const key=dk+"|"+b.start+"|"+b.kid;
      if(notifFired[key]) continue;
      notifFired[key]=1; changed=true;
      notifToast("🔔 "+esc(b.kid)+" — "+esc(b.title)+" ساعت "+fmtT(b.start)+" ("+fmtDur(b.start-nm)+" دیگر)");
      if(typeof Notification!=="undefined" && Notification.permission==="granted"){
        try{ new Notification("کلاس "+b.kid, {body:b.title+" — "+fmtT(b.start)+" ("+fmtDur(b.start-nm)+" دیگر)"}); }catch(e){}
      }
    }
    const ks=Object.keys(notifFired);
    if(ks.length>300){ ks.slice(0,ks.length-150).forEach(function(k){ delete notifFired[k]; }); changed=true; }
    if(changed) store.set("wp2_notifFired", JSON.stringify(notifFired));
  }catch(e){}
}
if(typeof setInterval==="function"){ setInterval(checkNotifs, 20000); }

/* ── نمونه‌ها ── */'''

CSS_TMPL = '''/* ── اعلان‌ها ── */
.notifbar{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:12px;padding:8px 14px;font-size:12.5px;font-weight:700;margin-bottom:10px;line-height:1.9}
.toastwrap{position:fixed;inset-inline:0;__BOT__;display:flex;flex-direction:column;gap:8px;align-items:center;z-index:999;pointer-events:none}
.toast{background:#0f172a;color:#fff;border-radius:14px;padding:10px 18px;font-size:13px;font-weight:700;box-shadow:0 10px 26px rgba(15,23,42,.35);max-width:340px;pointer-events:auto;text-align:center;line-height:1.9}
</style>'''

STAT_DESK_OLD = '''    `<span class="chip">${faNum(n)} کار در این هفته</span><span class="chip">مجموع ${fmtDur(mins)}</span><span class="chip">🕗 امروز: ${SHIFT_FA[shiftTypeFor(TODAY(),shiftCfg)]||"—"}</span>`;'''
STAT_DESK_NEW = '''    `<span class="chip">${faNum(n)} کار در این هفته</span><span class="chip">مجموع ${fmtDur(mins)}</span><span class="chip">🕗 امروز: ${SHIFT_FA[shiftTypeFor(TODAY(),shiftCfg)]||"—"}</span><span class="chip" style="cursor:pointer" onclick="notifToggle()">🔔 اعلان کلاس‌ها: ${notifOn?"روشن":"خاموش"}</span>`;'''

STAT_MOB_OLD = '''    `<span class="chip">${faNum(n)} کار این هفته</span><span class="chip">مجموع ${fmtDur(mins)}</span><span class="chip">🕗 امروز: ${SHIFT_FA[shiftTypeFor(TODAY(),shiftCfg)]||"—"}</span>`;'''
STAT_MOB_NEW = '''    `<span class="chip">${faNum(n)} کار این هفته</span><span class="chip">مجموع ${fmtDur(mins)}</span><span class="chip">🕗 امروز: ${SHIFT_FA[shiftTypeFor(TODAY(),shiftCfg)]||"—"}</span><span class="chip" style="cursor:pointer" onclick="notifToggle()">🔔 اعلان کلاس‌ها: ${notifOn?"روشن":"خاموش"}</span>`;'''

DAY_DESK_OLD = '''    document.getElementById("main").innerHTML = remBannerHTML() + nightReviewHTML(focusDay) + briefHTML(focusDay) + dayCardHTML(focusDay, today, {big:true}) + dayRequestHTML(focusDay);'''
DAY_DESK_NEW = '''    document.getElementById("main").innerHTML = remBannerHTML() + nextClassHTML(focusDay) + nightReviewHTML(focusDay) + briefHTML(focusDay) + dayCardHTML(focusDay, today, {big:true}) + dayRequestHTML(focusDay);'''
DAY_MOB_OLD = '''    document.getElementById("mainDay").innerHTML = remBannerHTML() + nightReviewHTML(focusDay) + briefHTML(focusDay) + dayCardHTML(focusDay, today, {big:true}) + dayRequestHTML(focusDay);'''
DAY_MOB_NEW = '''    document.getElementById("mainDay").innerHTML = remBannerHTML() + nextClassHTML(focusDay) + nightReviewHTML(focusDay) + briefHTML(focusDay) + dayCardHTML(focusDay, today, {big:true}) + dayRequestHTML(focusDay);'''

KIDSEC_DESK_OLD = '''  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها (ثابت)</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)} تا ${fmtT(b.end)}</span></div>`).join("") + `</div>`;'''
KIDSEC_DESK_NEW = '''  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم (ثابت)</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)} تا ${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر — از کادر درخواست عوضش کن)</span>':""}</div>`).join("") + `</div>`;'''
KIDSEC_MOB_OLD = '''  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)}–${fmtT(b.end)}</span></div>`).join("") + `</div>`;'''
KIDSEC_MOB_NEW = '''  return `<div class="kidsec"><div class="kt">🎓 کلاس‌های بچه‌ها و خانمم</div>` +
    kids.map(b=>`<div class="kr"><b>${esc(b.kid)}</b> — ${esc(b.title)} <span style="color:#0d9488;font-weight:700">${fmtT(b.start)}–${fmtT(b.end)}</span>${b.varTime?' <span style="color:#b45309;font-weight:700">(ساعت متغیر)</span>':""}</div>`).join("") + `</div>`;'''

BRIEF_OLD = '''<div>🎓 بچه‌ها: ${kids.length?faNum(kids.length)+" کلاس — راننده: <b>"+(day.driver?esc(day.driver):"تعیین نشده!")+"</b>":"کلاس ندارند"}</div>'''
BRIEF_NEW = '''<div>🎓 کلاس‌های بچه‌ها و خانمم: ${kids.length?faNum(kids.length)+" کلاس — رانندهٔ بچه‌ها: <b>"+(day.driver?esc(day.driver):"تعیین نشده!")+"</b>":"کلاس ندارند"}</div>'''


def apply(path, reps):
    p = Path(path)
    t = p.read_text(encoding="utf-8")
    for i, (name, old, new, cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt:
            raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt}) — لنگر پیدا نشد یا تکراری است")
        t = t.replace(old, new)
    p.write_text(t, encoding="utf-8")
    print(f"OK {path} — {len(reps)} جایگزینی")


COMMON = [
    ("SEED_VER",        'const SEED_VER = "11";', 'const SEED_VER = "12";', 1),
    ("wife-window",     'inWin:[360,810], outWin:[390,810]', 'inWin:[480,810], outWin:[480,810]', 1),
    ("shiftver-mig",    SHIFTVER_OLD, SHIFTVER_NEW, 1),
    ("seedKids",        SEED_KIDS_OLD, SEED_KIDS_NEW, 1),
    ("seedNotes",       SEED_NOTES_OLD, SEED_NOTES_NEW, 1),
    ("ks-filter",       KS_OLD, KS_NEW, 1),
    ("night-python",    NIGHT_OLD, NIGHT_NEW, 1),
    ("clk-rule",        CLKRULE_OLD, CLKRULE_NEW, 1),
    ("placeholder",     PLACE_OLD, PLACE_NEW, 1),
    ("brief-label",     BRIEF_OLD, BRIEF_NEW, 1),
    ("init-notif",      INIT_OLD, INIT_NEW, 1),
    ("toastwrap",       TOAST_ANCHOR, TOAST_NEW, 1),
    ("notif-module",    '/* ── نمونه‌ها ── */', NOTIF_MODULE, 1),
]

apply(BASE/"app-template.html", COMMON + [
    ("css",             '</style>', CSS_TMPL.replace("__BOT__", "bottom:18px"), 1),
    ("stat-chips",      STAT_DESK_OLD, STAT_DESK_NEW, 1),
    ("day-nextclass",   DAY_DESK_OLD, DAY_DESK_NEW, 1),
    ("kidsec",          KIDSEC_DESK_OLD, KIDSEC_DESK_NEW, 1),
])

apply(BASE/"app-mobile-template.html", COMMON + [
    ("css",             '</style>', CSS_TMPL.replace("__BOT__", "bottom:calc(var(--nav-h) + env(safe-area-inset-bottom,0px) + 12px)"), 1),
    ("stat-chips",      STAT_MOB_OLD, STAT_MOB_NEW, 1),
    ("day-nextclass",   DAY_MOB_OLD, DAY_MOB_NEW, 1),
    ("kidsec",          KIDSEC_MOB_OLD, KIDSEC_MOB_NEW, 1),
])

print("پچ v12 کامل شد ✓")
