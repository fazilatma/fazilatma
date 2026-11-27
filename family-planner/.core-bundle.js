

"use strict";
/* ═══════════ عدد و تاریخ ═══════════ */
const FA_DIG = "۰۱۲۳۴۵۶۷۸۹";
const faNum = x => String(x).replace(/[0-9]/g, d => FA_DIG[+d]);
const enNum = s => String(s)
  .replace(/[۰-۹]/g, d => String(FA_DIG.indexOf(d)))
  .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const J_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const G_MONTHS = ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];
const PR_NAME = {1:"بالا",2:"متوسط",3:"پایین"};

function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); x.setHours(12,0,0,0); return x; }
function satOf(d){ return addDays(d, -((d.getDay()+1)%7)); }
function satIdx(d){ return (d.getDay()+1)%7; }
function dkey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function sameSat(a,b){ return sameDay(satOf(a), satOf(b)); }
function nextWeekday(today, idx){ return addDays(today, (idx - satIdx(today) + 7) % 7); }

function toJalali(gy,gm,gd){
  const g_dm=[0,31,59,90,120,151,181,212,243,273,304,334];
  const gy2 = gm>2 ? gy+1 : gy;
  let days = 355666 + 365*gy + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400) + gd + g_dm[gm-1];
  let jy = -1595 + 33*Math.floor(days/12053); days %= 12053;
  jy += 4*Math.floor(days/1461); days %= 1461;
  if(days > 365){ jy += Math.floor((days-1)/365); days = (days-1)%365; }
  let jm,jd;
  if(days < 186){ jm = 1+Math.floor(days/31); jd = 1+(days%31); }
  else { jm = 7+Math.floor((days-186)/30); jd = 1+((days-186)%30); }
  return [jy,jm,jd];
}
function jalaliStr(d, withDay){
  const [jy,jm,jd] = toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
  const s = faNum(jd)+" "+J_MONTHS[jm-1]+" "+faNum(jy);
  return withDay===false ? s : DAY_NAMES[satIdx(d)]+" "+s;
}
function gregStr(d, withDay){
  const s = faNum(d.getDate())+" "+G_MONTHS[d.getMonth()]+" "+faNum(d.getFullYear());
  return withDay===false ? s : DAY_NAMES[satIdx(d)]+" "+s;
}
function fmtT(min){ const h=Math.floor(min/60), m=min%60; return faNum(String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")); }
function fmtRange(s,e){ return fmtT(s)+" تا "+fmtT(e); }
function fmtDur(m){
  const h=Math.floor(m/60), mm=m%60;
  if(h&&mm) return faNum(h)+" ساعت و "+faNum(mm)+" دقیقه";
  if(h) return faNum(h)+" ساعت";
  return faNum(mm)+" دقیقه";
}

/* ═══════════ پارس ساعت و مدت ═══════════ */
const NUM_WORDS = {"یک":1,"یه":1,"دو":2,"سه":3,"چهار":4,"پنج":5,"شش":6,"هفت":7,"هشت":8,"نه":9,"ده":10,"یازده":11,"دوازده":12,"پانزده":15,"بیست":20,"سی":30,"چهل":40,"پنجاه":50};
const NB = "[\\u0600-\\u06FF]";                       // حرف فارسی
const wsrc = w => "(?<!"+NB+")"+w+"(?!"+NB+")";       // الگوی مرزکدار (رشته)
const MER = "(?:\\s*(صبح|ظهر|عصر|شب|بعدازظهر))?";

function parseClock(hStr, mStr, mer){
  let h = +hStr, m = mStr ? +mStr : 0;
  if(h>24 || m>59) return null;
  if(mer){
    if(mer==="صبح"){ if(h===12) h=0; }
    else if(mer==="ظهر"){ if(h<12) h+=12; }
    else { if(h<=7) h+=12; if(h===12&&mer==="شب") h=0; }
  } else if(h>=1 && h<=7) h+=12;                       // «ساعت ۵» → عصر
  return h*60+m;
}
function tryTimeRange(t){
  const re = new RegExp("(?:ساعت\\s*)?(\\d{1,2})(?::(\\d{2}))?"+MER+"\\s*(?:تا|–|—|-)\\s*(\\d{1,2})(?::(\\d{2}))?"+MER);
  const m = t.match(re);
  if(!m) return null;
  const mer1 = m[3]||m[6]||null, mer2 = m[6]||mer1||null;
  const a = parseClock(m[1], m[2], mer1), b = parseClock(m[4], m[5], mer2);
  if(a==null || b==null || b<=a) return null;
  return {start:a, end:b, text:m[0]};
}
function tryTimePoint(t){
  const re = new RegExp("(?:ساعت\\s*(\\d{1,2})(?::(\\d{2}))?|(\\d{1,2}):(\\d{2}))"+MER);
  const m = t.match(re);
  if(!m) return null;
  const v = parseClock(m[1] ?? m[3], m[2] ?? m[4], m[5]||null);
  if(v==null) return null;
  return {start:v, text:m[0]};
}
function tryDuration(t){
  let m;
  if(m = t.match(/نیم\s*ساعت/)) return {min:30, text:m[0]};
  if(m = t.match(/یک\s*و\s*نیم\s*ساعت/)) return {min:90, text:m[0]};
  if(m = t.match(new RegExp(wsrc("(?:یک\\s*)?ربع(?:\\s*ساعت)?")))) return {min:15, text:m[0]};
  if(m = t.match(/(یک|\d+(?:[.,]\d+)?)\s*ساعت\s*و\s*نیم/)){
    const n = /^\d/.test(m[1]) ? parseFloat(m[1].replace(",",".")) : 1;
    return {min:Math.round(n*60)+30, text:m[0]};
  }
  if(m = t.match(/(\d+(?:[.,]\d+)?)\s*ساعت(?!ی)/)) return {min:Math.round(parseFloat(m[1].replace(",","."))*60), text:m[0]};
  for(const [w,n] of Object.entries(NUM_WORDS)){
    if(m = t.match(new RegExp(wsrc(w)+"\\s*ساعت(?!ی)"))) return {min:n*60, text:m[0]};
  }
  if(m = t.match(/(\d+)\s*دقیقه/)) return {min:+m[1], text:m[0]};
  for(const [w,n] of Object.entries(NUM_WORDS)){
    if(n<60 && (m = t.match(new RegExp(wsrc(w)+"\\s*دقیقه")))) return {min:n, text:m[0]};
  }
  if(m = t.match(new RegExp(wsrc("ساعتی")))) return {min:60, text:m[0]};
  return null;
}
function tryCount(t){
  let m = t.match(/(\d+)\s*(?:بار|دفعه)/);
  if(m) return {n:+m[1], text:m[0]};
  for(const [w,n] of Object.entries(NUM_WORDS)){
    if(m = t.match(new RegExp(wsrc(w)+"\\s*(?:بار|دفعه)"))) return {n, text:m[0]};
  }
  return null;
}

/* ═══════════ پارس روز ═══════════ */
const ZWNJ = "\u200c";
function dayRe(name){
  const parts = name.split(ZWNJ).map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  return new RegExp("(?<!"+NB+")"+parts.join("[\\s"+ZWNJ+"]?")+"(?:\\s*"+ZWNJ+"?(ها(?:ی|i|ی)?))?(?!"+NB+")","g");
}
function findDays(t, today){
  const out = {dates:[], weekdays:[], everyDay:false, weekScope:null, rest:t};
  let work = t, m;

  // امروز/فردا/پس‌فردا
  for(const [pat,off] of [["پس\\s*فردا|پس"+ZWNJ+"فردا|پسفردا",2],["فردا",1],["امروز",0]]){
    const re = new RegExp("(?<!"+NB+")("+pat+")(?!"+NB+")");
    if(m = work.match(re)){ out.dates.push(addDays(today, off)); work = work.replace(m[0]," "); break; }
  }
  // هفتهٔ بعد / این هفته
  if(m = work.match(new RegExp("هفته[\\s"+ZWNJ+"]*(?:ی[\\s"+ZWNJ+"]*)?(?:بعد|دیگه|دیگر|آینده|بعدش)"))){
    out.weekScope="next"; work = work.replace(m[0]," ");
  } else if(m = work.match(new RegExp("(?:این|همین)\\s*هفته|هفته[\\s"+ZWNJ+"]*جاری"))){
    out.weekScope="this"; work = work.replace(m[0]," ");
  }
  // هر روز
  if(m = work.match(new RegExp("(?<!"+NB+")(?:هر\\s*روز|هر"+ZWNJ+"روز|روزانه|همه[\\s"+ZWNJ+"]*(?:ی[\\s"+ZWNJ+"]*)?روز(?:ها)?|تمام\\s*روز(?:ها)?)(?!"+NB+")"))){
    out.everyDay = true; work = work.replace(m[0]," ");
  }

  // اسم روزها (بدون هم‌پوشانی؛ بلندتر اولویت)
  const found = [];
  DAY_NAMES.forEach((nm,i)=>{
    const re = dayRe(nm); let mm;
    while((mm = re.exec(work)) !== null){
      if(mm[0]) found.push({i, idx:mm.index, len:mm[0].length, text:mm[0], plural:!!mm[1]});
    }
  });
  found.sort((a,b)=> b.len-a.len || a.idx-b.idx);
  const accepted = [];
  for(const f of found){
    if(accepted.some(a=> f.idx < a.idx+a.len && a.idx < f.idx+f.len)) continue;
    accepted.push(f);
  }
  accepted.sort((a,b)=>a.idx-b.idx);

  // بازهٔ «شنبه تا دوشنبه»
  const extraSpans = [];
  for(let k=0; k<accepted.length-1; k++){
    const a1 = accepted[k], a2 = accepted[k+1];
    const between = work.slice(a1.idx+a1.len, a2.idx);
    if(new RegExp("^[\\s"+ZWNJ+"]*تا[\\s"+ZWNJ+"]*$").test(between)){
      const i1=a1.i, i2=a2.i;
      for(let i=i1;; i=(i+1)%7){ pushDay(out, i, today, a1.plural||a2.plural); if(i===i2) break; }
      extraSpans.push({idx:a1.idx, len:a1.len, text:a1.text});
      extraSpans.push({idx:a2.idx, len:a2.len, text:a2.text});
      extraSpans.push({idx:a1.idx+a1.len, len:between.length, text:between});
      accepted.splice(k,2); k--;
    }
  }
  for(const f of accepted) pushDay(out, f.i, today, f.plural);

  // حذف از متن — فقط اسپن‌های پذیرفته‌شده و «تا»ی بازه‌ها (به‌ترتیب از آخر به اول)
  [...accepted, ...extraSpans].sort((a,b)=>b.idx-a.idx)
    .forEach(f=>{ work = work.slice(0,f.idx)+" "+work.slice(f.idx+f.len); });

  out.rest = work.replace(/[ ]+/g," ").trim();
  return out;
}
function pushDay(out, idx, today, plural){
  if(plural){ if(!out.weekdays.includes(idx)) out.weekdays.push(idx); }
  else out.dates.push(nextWeekday(today, idx));
}

/* ═══════════ پارس یک خط ═══════════ */
function parseLine(raw, today){
  let t = " " + enNum(raw)
    .replace(/[يﻱﻲ]/g,"ی").replace(/[كﻙﻛ]/g,"ک")
    .replace(/\s*بعد\s*از\s*ظهر\s*/g," بعدازظهر ")
    .replace(/[،,؛;]+/g," ") + " ";

  const r = {title:"", dates:null, weekdays:null, everyDay:false, weekOnly:null, scopeLabel:"",
             perWeek:null, fixStart:null, fixEnd:null, dur:null, window:null, priority:2, problems:[]};

  const fd = findDays(t, today);
  t = " " + fd.rest + " ";
  r.everyDay = fd.everyDay;

  let curSat = satOf(today);
  if(fd.weekScope==="next"){
    r.weekOnly = addDays(curSat,7).getTime();
    r.scopeLabel = "هفتهٔ بعد";
    if(fd.dates.length) fd.dates = fd.dates.map(d=> sameSat(d, curSat) ? addDays(d,7) : d);
  } else if(fd.weekScope==="this"){
    r.weekOnly = curSat.getTime();
    r.scopeLabel = "این هفته";
    if(fd.dates.length) fd.dates = fd.dates.map(d=> sameSat(d, curSat) ? d : addDays(d,-7));
  }
  if(fd.weekdays.length) r.weekdays = fd.weekdays;
  if(fd.dates.length){
    const seen = new Set();
    r.dates = fd.dates.filter(d=>{ const k=dkey(d); if(seen.has(k)) return false; seen.add(k); return true; });
  }

  // ساعت ثابت
  const tr = tryTimeRange(t);
  if(tr){ r.fixStart=tr.start; r.fixEnd=tr.end; t = t.replace(tr.text," "); }
  else {
    const tp = tryTimePoint(t);
    if(tp){ r.fixStart=tp.start; r.fixEnd=tp.start+60; r.problems.push("ساعت پایانی مشخص نبود؛ یک ساعت فرض شد."); t = t.replace(tp.text," "); }
  }
  // مدت
  const du = tryDuration(t);
  if(du){ r.dur=du.min; t = t.replace(du.text," "); }
  // تکرار
  const co = tryCount(t);
  if(co){ r.perWeek=co.n; t = t.replace(co.text," "); }
  // پنجرهٔ زمانی (با مرز کلمه)
  let m;
  const WIN_PATS = [
    ["صبح", "(?:صبحگاهی|صبح"+ZWNJ+"ها|صبحها|صبح|بامداد|سپیده)"],
    ["ظهر", "(?:بعدازظهر|ظهر"+ZWNJ+"ها|ظهرها|ظهر)"],
    ["عصر", "(?:عصر"+ZWNJ+"ها|عصرگاهی|عصر)"],
    ["شب",  "(?:شب"+ZWNJ+"ها|شبها|شبانه|شب)"]
  ];
  for(const [wname, wpat] of WIN_PATS){
    const wre = new RegExp("(?<!"+NB+")("+wpat+")(?!"+NB+")");
    if((m = t.match(wre)) && !r.window){ r.window = wname; t = t.replace(m[0]," "); }
  }
  // اولویت (با مرز کلمه)
  if(m = t.match(new RegExp(wsrc("(?:خیلی\\s*مهم|فوری|حیاتی|اولویت\\s*بالا|اولویت\\s*اول|مهم)")))){ r.priority=1; t=t.replace(m[0]," "); }
  else if(m = t.match(new RegExp(wsrc("(?:اگر\\s*شد|اگه\\s*شد|اختیاری|کم\\s*اهمیت|فرعی|اولویت\\s*پایین|اولویت\\s*آخر)")))){ r.priority=3; t=t.replace(m[0]," "); }
  else if(m = t.match(new RegExp(wsrc("اولویت\\s*متوسط")))){ r.priority=2; t=t.replace(m[0]," "); }
  // پاک‌سازی عنوان
  t = t
    .replace(/\s*(?:لطفا|می‌خوام|میخوام|خواستم|باید|قراره|قرار\s*است|بذار|بگذار|اضافه\s*کن|ثبت\s*کن|یادم\s*بنداز|یادم\s*باشه|برنامه\s*ریزی\s*کن|برنامه\s*بریز|برام|برای\s*من|هر\s*بار|هر\s*دفعه|در\s*هفته|هر\s*هفته)\s*/g," ")
    .replace(/\s*(?:برای)\s+/g," ")
    .replace(/["'«»(){}\[\]]/g," ")
    .replace(/\s+/g," ").trim()
    .replace(/^(?:و\s+)+/,"").replace(/(?:\s+و)+$/,"");
  if(!t){ t="کار جدید"; r.problems.push("عنوانی پیدا نشد؛ «کار جدید» ثبت شد — از بخش «کارها» حذفش کن."); }
  r.title = t.replace(/[0-9]/g, d=>"۰۱۲۳۴۵۶۷۸۹"[+d]);
  return r;
}

/* ═══════════ زمان‌بند ═══════════ */
const WINDOWS = {"صبح":[360,720],"ظهر":[720,1020],"عصر":[1020,1260],"شب":[1260,1440]};

function freeSlots(blocks, ws, we){
  const busy = blocks.map(b=>[Math.max(b.start,ws), Math.min(b.end,we)]).filter(([s,e])=>s<e).sort((a,b)=>a[0]-b[0]);
  const free=[]; let cur=ws;
  for(const [s,e] of busy){ if(s>cur) free.push([cur,s]); cur=Math.max(cur,e); }
  if(cur<we) free.push([cur,we]);
  return free;
}
function earliestSlot(free, dur, win){
  if(win){
    const [w1,w2]=WINDOWS[win];
    const inWin = free.map(([s,e])=>[Math.max(s,w1),Math.min(e,w2)]).filter(([s,e])=>e-s>=dur);
    if(inWin.length) return {slot:inWin.reduce((a,b)=>a[0]<=b[0]?a:b), forced:false};
  }
  const cands = free.filter(([s,e])=>e-s>=dur);
  if(cands.length) return {slot:cands.reduce((a,b)=>a[0]<=b[0]?a:b), forced:!!win};
  return null;
}
function freeMinutes(blocks, ws, we, win){
  const free = freeSlots(blocks, ws, we);
  if(!win) return free.reduce((s,[a,b])=>s+(b-a),0);
  const [w1,w2]=WINDOWS[win];
  return free.reduce((s,[a,b])=>s+Math.max(0,Math.min(b,w2)-Math.max(a,w1)),0);
}

/* ================= خانواده: بچه‌ها و راننده ================= */
function escRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function effDriver(family, idx, dateK){
  if(!family) return null;
  const byDate = family.driverByDate && family.driverByDate[dateK];
  if(byDate) return byDate;
  return (family.driverWeekly && family.driverWeekly[idx]) || null;
}
function kidBlocksFor(family, idx, dateK){
  const out = [];
  if(!family || !family.kids) return out;
  for(const k of family.kids){
    for(const c of (k.classes||[])){
      const days = c.weekdays || [], dts = c.dates || [];
      if(days.includes(idx) || dts.includes(dateK))
        out.push({start:c.start, end:c.end, title:c.title||"کلاس", kid:k.name, travel:(c.travel!=null?c.travel:null), ret:c.ret||null, retNote:c.retNote||null, online:c.online||null, nodrv:c.nodrv||null, varTime:c.varTime||null});
    }
  }
  return out;
}
function mergeIV(list){
  const iv = list.slice().sort((a,b)=>a[0]-b[0]); const out=[];
  for(const [s,e] of iv){
    if(out.length && s<=out[out.length-1][1]) out[out.length-1][1]=Math.max(out[out.length-1][1], e);
    else out.push([s,e]);
  }
  return out;
}
/* خط «راننده …» — خروجی: {driver, dates, allWeek} یا null */
function parseDriverLine(raw, today, family){
  if(!family) return null;
  const t = " " + enNum(raw).replace(/[يﻱﻲ]/g,"ی").replace(/[كﻙﻛ]/g,"ک") + " ";
  if(!/راننده/.test(t)) return null;
  const res = {driver:null, dates:[], allWeek:false};
  const names = (family.drivers||[]).slice().sort((a,b)=>b.length-a.length);
  for(const n of names){
    const m = t.match(new RegExp("(?<![\u0600-\u06FF])"+escRe(n)+"(?![\u0600-\u06FF])"));
    if(m){ res.driver = n; break; }
  }
  const rePasFarda = new RegExp("پس\\s*فردا|پس"+ZWNJ+"فردا");
  if(rePasFarda.test(t)) res.dates.push(addDays(today,2));
  else if(/فردا/.test(t)) res.dates.push(addDays(today,1));
  else if(/امروز/.test(t)) res.dates.push(addDays(today,0));
  else {
    const found = [];
    DAY_NAMES.forEach((nm,i)=>{
      const re = dayRe(nm); let mm;
      while((mm = re.exec(t)) !== null){ if(mm[0]) found.push({i, idx:mm.index, len:mm[0].length}); if(mm.index===re.lastIndex) re.lastIndex++; }
    });
    found.sort((a,b)=> b.len-a.len || a.idx-b.idx);
    const accepted = [];
    for(const f of found){
      if(accepted.some(a=> f.idx < a.idx+a.len && a.idx < f.idx+f.len)) continue;
      accepted.push(f);
    }
    const seen = new Set();
    for(const f of accepted){ const d = nextWeekday(today, f.i); if(!seen.has(dkey(d))){ seen.add(dkey(d)); res.dates.push(d); } }
  }
  if(!res.dates.length && new RegExp("(این|همین)[\\s"+ZWNJ+"]*هفته").test(t)) res.allWeek = true;
  return res;
}

/* ================= شیفت کار (خرمشهر) ================= */
const SHIFT_ORDER = ["day","night","rest","rest"];
const SHIFT_FA = {day:"روزکار", night:"شبکار", rest:"استراحت", ot:"شبکار + اضافه‌کار"};
function atNoon(d){ const x=new Date(d); x.setHours(12,0,0,0); return x; }
function DK2(k){ const [y,m,dd]=k.split("-").map(Number); return new Date(y,m-1,dd,12); }
function shiftTypeFor(dt, shift){
  if(!shift) return null;
  const k = dkey(dt);
  if(shift.overrides && shift.overrides[k]!=null) return shift.overrides[k];
  if(!shift.anchor) return null;
  const a = DK2(shift.anchor);
  const base = Math.max(0, SHIFT_ORDER.indexOf(shift.anchorType||"day"));
  const d = Math.round((atNoon(dt) - a)/86400000);
  return SHIFT_ORDER[((base + d)%4+4)%4];
}
function wifeWindowFor(dt, wf){
  if(!wf) return null;
  const [jy,jm,jd] = toJalali(dt.getFullYear(), dt.getMonth()+1, dt.getDate());
  const f = (wf.fromDM||"15/03").split("/").map(Number);
  const t = (wf.toDM||"15/06").split("/").map(Number);
  const inSeason = (jm>f[1] && jm<t[1]) || (jm===f[1] && jd>=f[0]) || (jm===t[1] && jd<=t[0]);
  return inSeason ? wf.inWin : wf.outWin;
}
function remOccurrences(rem){
  const lead=Math.max(0, rem.lead||0), times=Math.max(1, rem.times||1), gap=Math.max(1, rem.gapDays||1);
  if(!lead) return [{off:0}];
  const out=[];
  for(let i=0;i<times;i++){ const off=lead-i*gap; if(off<0) break; out.push({off}); }
  return out.length?out:[{off:0}];
}
function remsForDay(rems, dk){
  const out=[];
  for(const r of (rems||[])){
    if(!r || !r.date) continue;
    for(const o of remOccurrences(r)){
      if(dkey(addDays(DK2(r.date), -o.off))===dk) out.push({r, off:o.off, total:remOccurrences(r).length});
    }
  }
  return out;
}
function parseShiftLine(raw, today){
  const t = " " + enNum(raw).replace(/[يﻱﻲ]/g,"ی").replace(/[كﻙﻛ]/g,"ک") + " ";
  let type=null;
  if(new RegExp("اضافه[\\s"+ZWNJ+"]*کار").test(t)) type="ot";
  else if(/شب\s*کار|شبکار/.test(t)) type="night";
  else if(/روز\s*کار|روزکار/.test(t)) type="day";
  else if(/استراحت|مرخصی/.test(t)) type="rest";
  if(!type) return null;
  const dates=[]; let allWeek=false;
  if(new RegExp("پس[\\s"+ZWNJ+"]*فردا").test(t)) dates.push(addDays(today,2));
  else if(/فردا/.test(t)) dates.push(addDays(today,1));
  else if(/امروز/.test(t)) dates.push(addDays(today,0));
  else {
    const found=[];
    DAY_NAMES.forEach((nm,i)=>{
      const re = dayRe(nm); let mm;
      while((mm = re.exec(t)) !== null){ if(mm[0]) found.push({i, idx:mm.index, len:mm[0].length}); if(mm.index===re.lastIndex) re.lastIndex++; }
    });
    found.sort((a,b)=> b.len-a.len || a.idx-b.idx);
    const acc=[];
    for(const f of found){ if(acc.some(a=> f.idx < a.idx+a.len && a.idx < f.idx+f.len)) continue; acc.push(f); }
    for(const f of acc) dates.push(nextWeekday(today, f.i));
    if(!dates.length && new RegExp("(این|همین)[\\s"+ZWNJ+"]*هفته").test(t)) allWeek=true;
  }
  return {type, dates, allWeek};
}
function genWorkBlocks(t, shift, isOT, ownCar){
  const cm = (shift&&shift.commuteMin!=null)?shift.commuteMin:120;
  const ret = Math.max(0, cm - (ownCar?30:0));
  const ds=(shift&&shift.dayStart!=null)?shift.dayStart:420, de=(shift&&shift.dayEnd!=null)?shift.dayEnd:1140;
  const ns=(shift&&shift.nightStart!=null)?shift.nightStart:1140, ne=(shift&&shift.nightEnd!=null)?shift.nightEnd:420;
  const out=[];
  if(t==="day"){
    const a=ds-cm, b=de+ret;
    if(b>a) out.push([{start:a,end:b,title:"روزکار + تردد خرمشهر",kind:"work",priority:1,
      notes:"کار ۷:۰۰ تا ۱۹:۰۰ • رفتن "+fmtT(a)+" • رسیدن "+fmtT(b)+(ownCar?" (ماشین خودم — برگشت زودتر)":"")}, 0]);
  } else {
    const a=ns-cm, b=1440;
    if(b>a) out.push([{start:a,end:b,title:(isOT?"شبکار (اضافه‌کار) + تردد":"شبکار + تردد خرمشهر"),kind:"work",priority:1,
      notes:"کار ۱۹:۰۰ تا ۷:۰۰ • رفتن "+fmtT(a)}, 0]);
    const c=0, d=ne+ret;
    if(d>c) out.push([{start:c,end:d,title:"🌙 بازگشت از شیفت شب — رسیدن "+fmtT(d),kind:"work",priority:1,
      notes:"این کلاس نیست؛ دُم شیفت دیشب است"+(ownCar?" (ماشین خودم — برگشت زودتر)":"")}, 1]);
  }
  return out;
}

function planWeek(tasks, weekSat, settings, family, shift){
  const activeSet = new Set(settings.active);
  const ws = settings.dayStart, we = settings.dayEnd;
  const days = [];
  for(let i=0;i<7;i++){
    const d = addDays(weekSat, i);
    const day = {idx:i, date:d, active:activeSet.has(i), blocks:[], unplaced:[]};
    day.driver = effDriver(family, i, dkey(d));
    const kids = kidBlocksFor(family, i, dkey(d));
    for(const kb of kids)
      day.blocks.push({start:kb.start, end:kb.end, title:kb.title, kind:"kid", kid:kb.kid, priority:2, notes:"", travel:kb.travel, ret:kb.ret||null, retNote:kb.retNote||null, online:kb.online||null, nodrv:kb.nodrv||null, varTime:kb.varTime||null});
    day.wifeWin = wifeWindowFor(d, family && family.wife);
    const self2 = family && family.blockSelf !== false;
    const kdvAll = family && family.driverByKidDate;
    for(const kb of kids){
      const kdv = (kdvAll && kdvAll[dkey(d)] && kdvAll[dkey(d)][kb.kid]) || {};
      const goDrv = kdv.go!=null ? kdv.go : day.driver;
      const retDrv = kdv.ret!=null ? kdv.ret : goDrv;
      const bef = kb.travel!=null ? kb.travel : (family.pickupMin||0);
      const aft = (kb.ret==="var" && kdv.ret==null) ? 0 : (kb.travel!=null ? kb.travel : (family.dropoffMin||0));
      const p1 = Math.max(ws, kb.start - bef), p2 = kb.start;
      if(p2>p1 && goDrv)
        day.blocks.push({start:p1, end:p2, title:"بردن "+kb.kid+" — "+goDrv, kind:"duty", kid:kb.kid, dir:"go", priority:1, nobusy: !(self2 && goDrv===family.selfName), notes:""});
      const q1 = kb.end, q2 = Math.min(we, kb.end + aft);
      if(q2>q1 && retDrv && (kb.ret!=="var" || kdv.ret!=null))
        day.blocks.push({start:q1, end:q2, title:"آوردن "+kb.kid+" — "+retDrv, kind:"duty", kid:kb.kid, dir:"ret", priority:1, nobusy: !(self2 && retDrv===family.selfName), notes:""});
    }
    days.push(day);
  }
  /* بلاک‌های شیفت کاری (شب‌کاری از نیمه‌شب می‌گذرد) */
  for(let off=-1; off<=6; off++){
    const dt = addDays(weekSat, off);
    const t = shiftTypeFor(dt, shift);
    if(off>=0 && off<=6){ days[off].shift = t; days[off].carOwn = !!(shift && shift.carDays && shift.carDays[dkey(dt)]); }
    if(t==="day"||t==="night"||t==="ot"){
      const oc = !!(shift && shift.carDays && shift.carDays[dkey(dt)]);
      for(const [wb, nextDay] of genWorkBlocks(t, shift, t==="ot", oc)){
        const target = off + nextDay;
        if(target>=0 && target<=6) days[target].blocks.push(wb);
      }
    }
  }
  const inWeek = d => sameSat(d, weekSat);
  const flex = [];

  for(const t of tasks){
    if(t.weekOnly!=null && !sameSat(new Date(t.weekOnly), weekSat)) continue;
    if(t.fixStart!=null){
      let targets = [];
      if(t.weekdays && t.weekdays.length)
        targets = days.filter(d=>d.active && t.weekdays.includes(d.idx)).map(d=>d.date);
      else if(t.dates && t.dates.length)
        targets = t.dates.filter(inWeek);
      for(const d of targets){
        const day = days.find(x=>sameDay(x.date,d));
        if(day) day.blocks.push({start:t.fixStart, end:t.fixEnd, title:t.title, kind:"fixed", priority:t.priority, notes:t.notes||""});
      }
    } else flex.push(t);
  }

  flex.sort((a,b)=>(a.priority-b.priority)||((b.dur||60)-(a.dur||60))||(a.createdAt-b.createdAt));
  for(const t of flex){
    let occs = [];
    if(t.weekdays && t.weekdays.length){
      occs = days.filter(d=>d.active && t.weekdays.includes(d.idx)).map(d=>({day:d}));
    } else if(t.dates && t.dates.length){
      occs = t.dates.filter(inWeek)
        .map(d=>({day:days.find(x=>sameDay(x.date,d)), pinned:true}))
        .filter(o=>o.day);
    } else if(t.everyDay){
      occs = days.filter(d=>d.active).map(d=>({day:d}));
    } else {
      const n = Math.max(1, Math.min(t.perWeek||1, Math.max(1,settings.active.length)));
      for(let k=0;k<n;k++) occs.push({day:null});
    }
    const used = new Set();
    for(const o of occs){
      const cands = o.day ? [o.day] : days.filter(d=>d.active && !used.has(d.idx));
      let best = null;
      for(const day of cands){
        const r = earliestSlot(freeSlots(day.blocks.filter(b=>b.kind!=="kid" && !b.nobusy), ws, we), t.dur||60, t.window);
        if(!r) continue;
        const score = freeMinutes(day.blocks, ws, we, t.window) - day.idx*0.01;
        if(!best || score>best.score) best = {day, r, score};
      }
      if(best){
        best.day.blocks.push({start:best.r.slot[0], end:best.r.slot[0]+(t.dur||60), title:t.title,
          kind:"flex", priority:t.priority, notes:t.notes||"", window:t.window, forced:best.r.forced});
        used.add(best.day.idx);
      } else {
        days[0].unplaced.push({title:t.title, dur:t.dur||60, window:t.window});
      }
    }
  }
  days.forEach(d=>d.blocks.sort((a,b)=>a.start-b.start));
  return days;
}

/* ═══════════ توضیح تفسیر ═══════════ */
function describeParsed(r){
  const parts = [];
  if(r.fixStart!=null) parts.push("🔒 "+fmtRange(r.fixStart,r.fixEnd));
  else parts.push("⏱ "+fmtDur(r.dur||60)+(r.window?" — "+r.window:""));
  if(r.weekdays && r.weekdays.length) parts.push("📅 هر هفته: "+r.weekdays.map(i=>DAY_NAMES[i]).join("، "));
  else if(r.dates && r.dates.length) parts.push("📅 "+r.dates.map(d=>jalaliStr(d,false)).join(" و "));
  else if(r.everyDay) parts.push("📅 هر روز");
  else if(r.weekOnly!=null) parts.push("📅 فقط "+r.scopeLabel);
  else if(r.perWeek) parts.push("📅 هر هفته "+faNum(r.perWeek)+" بار");
  else parts.push("📅 هر هفته یک بار");
  parts.push("اولویت "+PR_NAME[r.priority]);
  return parts.join(" • ");
}


;module.exports = {faNum,enNum,DAY_NAMES,addDays,satOf,satIdx,dkey,sameDay,sameSat,nextWeekday,toJalali,jalaliStr,gregStr,fmtT,fmtRange,fmtDur,parseClock,tryTimeRange,tryTimePoint,tryDuration,tryCount,findDays,parseLine,planWeek,freeSlots,describeParsed,WINDOWS,parseDriverLine,effDriver,kidBlocksFor,mergeIV,shiftTypeFor,wifeWindowFor,parseShiftLine,SHIFT_FA,remOccurrences,remsForDay};
