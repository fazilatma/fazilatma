#!/usr/bin/env node
// تولید «برنامه-این-هفته.html» — اسنپ‌شات هفتهٔ جاریِ واقعی از هستهٔ اپ (v13)
const fs = require("fs");
const { dirname, resolve } = require("path");
const BASE = resolve(__dirname, "..");
const core = fs.readFileSync(BASE + "/core.js", "utf-8");
fs.writeFileSync(BASE + "/.t.cjs", core + "\nmodule.exports={satOf,addDays,dkey,jalaliStr,gregStr,fmtT,planWeek,satIdx,DAY_NAMES};");
const {satOf, addDays, dkey, jalaliStr, gregStr, fmtT, planWeek, satIdx, DAY_NAMES} = require(BASE + "/.t.cjs");

const WEEK_SAT = satOf(new Date()); // هفتهٔ همین امروز
const WEEK_END = addDays(WEEK_SAT, 6);

const family = {
  selfName:"من", wifeName:"خانمم", drivers:["من","خانمم","خانم انصاری","اسنپ"],
  kids:[
    {name:"پارسا", classes:[
      {title:"مدرسه", weekdays:[0,1,2,3], start:480, end:810, travel:0, nodrv:true},
      {title:"پایتون", weekdays:[5], start:900, end:990, varTime:true},
      {title:"والیبال (پرورده)", weekdays:[0,2,4], start:1080, end:1170, travel:30, ret:"var"},
      {title:"والیبال (ابوالمعصومی)", weekdays:[1], start:870, end:960, travel:0, ret:"var"},
      {title:"زبان (آنلاین)", weekdays:[1,3], start:990, end:1050, travel:0, online:true},
      {title:"رباتیک", weekdays:[3], start:1110, end:1200},
      {title:"والیبال (ابوالمعصومی)", weekdays:[4], start:900, end:1020, travel:30}
    ]},
    {name:"مهرسا", classes:[
      {title:"مدرسه", weekdays:[0,1,2,3], start:480, end:810, travel:0, nodrv:true},
      {title:"شنا", weekdays:[0,2,4], start:900, end:1020, travel:30, ret:"var"},
      {title:"موسیقی", weekdays:[0], start:1170, end:1200},
      {title:"زبان (آنلاین)", weekdays:[1,3], start:930, end:990, travel:0, online:true},
      {title:"فیروزه انفرادی", weekdays:[2], start:1140, end:1200, travel:30},
      {title:"تکواندو", weekdays:[1,3,5], start:1140, end:1230},
      {title:"کارگاه حل مسئله (فیروزه)", weekdays:[5], start:960, end:1020, travel:30}
    ]},
    {name:"خانمم", classes:[
      {title:"شنا", weekdays:[0,2,4], start:900, end:1020, travel:0, nodrv:true},
      {title:"کلاس گروهی مادران (با فیروزه)", weekdays:[3], start:960, end:1050, travel:0, nodrv:true}
    ]}
  ],
  driverWeekly:[null,null,null,null,null,null,null],
  driverByKidDate:{}, driverByDate:{}, pickupMin:15, dropoffMin:15, blockSelf:true
};

const shiftCfg = {anchor:"2026-09-19", anchorType:"day", commuteMin:120,
  dayStart:420, dayEnd:1140, nightStart:1140, nightEnd:420,
  overrides:{}, carDays:{}, wife:{fromDM:"15/03", toDM:"15/06", inWin:[480,810], outWin:[480,810]}};

const settings = {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]};

/* یادداشت‌های ثابت هر روز (مستقل از شیفت) */
const NOTES = {
  0:[
    "🏫 مدرسهٔ بچه‌ها و کار خانمم: ۸ تا ۱۳:۳۰",
    "🏊 شنا مهرسا + خانمم ۱۵–۱۷ — خانمم خودش می‌رود و برمی‌گردد • 🎹 موسیقی مهرسا ۱۹:۳۰–۲۰ — راننده‌ها را در اپ تنظیم کن"
  ],
  1:[
    "🕐 پارسا ابوالمعصومی ۱۴:۳۰–۱۶ (خودش می‌رود) • 🗣 زبان آنلاین: مهرسا ۱۵:۳۰، پارسا ۱۶:۳۰ • 🥋 تکواندو مهرسا ۱۹–۲۰:۳۰",
    "❌ کونگ‌فو پارسا تا اطلاع ثانوی کنسل است"
  ],
  2:[
    "📞 ساعت فیروزهٔ انفرادی پارسا را بگیر (دوشنبه‌ها متغیر) • 🎹 فیروزهٔ مهرسا ۱۹–۲۰ • 🏊 شنا مهرسا + خانمم ۱۵–۱۷"
  ],
  3:[
    "🗣 زبان آنلاین: مهرسا ۱۵:۳۰، پارسا ۱۶:۳۰ • 👩‍👧 کلاس گروهی مادران با فیروزه ۱۶–۱۷:۳۰ (خانمم) • 🥋 تکواندو مهرسا ۱۹–۲۰:۳۰"
  ],
  4:[
    "🏊 شنا مهرسا + خانمم ۱۵–۱۷ • 🏐 پارسا ابوالمعصومی ۱۵–۱۷ و پرورده ۱۸–۱۹:۳۰",
    "🐍 امشب موقع مرور شبانه، ساعت پایتون فردای پارسا را در اپ وارد کن"
  ],
  5:[
    "🐍 پایتون پارسا: ساعت متغیر — از کادر درخواست روز در اپ بگذار (پیش‌فرض ۱۵–۱۶:۳۰) • 🎨 کارگاه فیروزهٔ مهرسا ۱۶–۱۷ • 🥋 تکواندو ۱۹–۲۰:۳۰"
  ],
  6:[
    "🎯 جمعه: بچه‌ها هیچ کلاسی ندارند — روز آزاد"
  ]
};

const days = planWeek([], WEEK_SAT, settings, family, shiftCfg);
const KIND_BG = {work:"#f8fafc;color:#334155", duty:"#fff7ed;color:#9a3412", kid:"#eff6ff;color:#1e40af"};
const KIND_IC = {work:"🕗", duty:"🚗", kid:"🎓"};
const SHN = {day:"☀️ روزکار", night:"🌙 شبکار", ot:"⚡ شبکار + اضافه‌کار", rest:"😴 استراحت"};
const shiftLine = days.map(d=>DAY_NAMES[d.idx]+": "+(SHN[d.shift]||"—").replace("☀️ ","").replace("🌙 ","").replace("⚡ ","").replace("😴 ","")).join(" • ");

let html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>برنامهٔ هفته — ${jalaliStr(WEEK_SAT,false)} تا ${jalaliStr(WEEK_END,false)}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:Vazirmatn,Tahoma,'Segoe UI',sans-serif;color:#0f172a">
<div style="max-width:680px;margin:0 auto;padding:16px 12px">
<div style="background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:16px;padding:16px 18px">
 <b style="font-size:17px">📅 برنامهٔ هفته: ${jalaliStr(WEEK_SAT,false)} تا ${jalaliStr(WEEK_END,false)}</b>
 <div style="font-size:12px;opacity:.85;margin-top:4px">${gregStr(WEEK_SAT,false)} — ${gregStr(WEEK_END,false)} • شیفت‌ها از چرخهٔ عادی: ${shiftLine}</div>
 <div style="font-size:12px;opacity:.85;margin-top:2px">🏫 مدرسهٔ بچه‌ها و کار خانمم: ۸–۱۳:۳۰ (ش تا چ) • 🏊 شنا مهرسا و خانمم: ش/د/چ ۱۵–۱۷ (خانمم خودش می‌رود) • 🎧 زبان‌ها آنلاین • ❌ کونگ‌فو کنسل • 🐍 پایتون پارسا پنجشنبه‌ها با ساعت متغیر</div>
 <div style="font-size:12px;opacity:.85;margin-top:2px">🔔 اپ نیم‌ساعت قبل هر کلاس اعلان می‌دهد و می‌توانی کارها را تیک بزنی — این فایل فقط اسنپ‌شات چاپی همین هفته است</div>
</div>
`;

for(const day of days){
  const d = day.date, i = day.idx;
  const sh = SHN[day.shift]||"—";
  const spanTxt = (day.blocks.filter(b=>b.kind==="work").map(b=>fmtT(b.start)+"–"+fmtT(b.end)).join(" و ")) || "";
  html += `<div style="background:#fff;border:1px solid ${i===0?"#a5b4fc":"#e2e8f0"};border-radius:14px;padding:12px 14px;margin:10px 0">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
     <b style="font-size:15px">${DAY_NAMES[i]} <span style="color:#64748b;font-weight:400;font-size:12px">${jalaliStr(d,false)}</span></b>
     <span style="background:${day.shift==="night"?"#e0e7ff;color:#3730a3":day.shift==="day"?"#fef3c7;color:#92400e":"#dcfce7;color:#14532d"};border-radius:8px;padding:3px 10px;font-size:12px;font-weight:800">${sh}${spanTxt?" • دور از خانه "+spanTxt:""}</span></div>
`;
  for(const b of day.blocks){
    const k = KIND_BG[b.kind]||"#fff;color:#0f172a";
    html += `<div style="display:flex;gap:8px;align-items:baseline;background:${k};border-radius:8px;padding:5px 9px;margin:3px 0">
      <b style="font-size:12.5px;min-width:86px">${fmtT(b.start)}–${fmtT(b.end)}</b>
      <span style="font-size:13px">${KIND_IC[b.kind]||""} ${b.kind==="duty"?b.kid+" — ":""}${b.title}${b.varTime?' <span style="font-size:10px;background:#fff;border:1px solid #f59e0b;color:#b45309;border-radius:6px;padding:1px 5px">🐍 ساعت متغیر</span>':""}${b.ret==="var"&&b.kind==="kid"?' <span style="font-size:10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:1px 5px">🎒 برگشت متغیر</span>':""}${b.online&&b.kind==="kid"?' <span style="font-size:10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:1px 5px">🎧 آنلاین</span>':""}</span>
      ${b.notes?`<span style="font-size:10.5px;opacity:.75">${b.notes}</span>`:""}</div>`;
  }
  for(const n of (NOTES[i]||[]))
    html += `<div style="font-size:11.5px;color:#92400e;background:#fffbeb;border-radius:8px;padding:4px 9px;margin:3px 0">📝 ${n}</div>`;
  html += `</div>`;
}
html += `<div style="font-size:11px;color:#64748b;text-align:center;margin:10px 0">🌙 هر شب نمای «فردا» را ببند و خروجی بگیر • تیک کارها و تغییرها در اپ: «برنامه‌ریز-خانواده.html»</div>
</div></body></html>`;

fs.writeFileSync(BASE + "/برنامه-این-هفته.html", html, "utf-8");
fs.unlinkSync(BASE + "/.t.cjs");
console.log("OK برنامه-این-هفته.html — هفتهٔ "+jalaliStr(WEEK_SAT,false)+" تا "+jalaliStr(WEEK_END,false));
console.log("شیفت‌ها:", days.map(d=>DAY_NAMES[d.idx][0]+":"+d.shift).join(" "));
console.log("شنبه:", days[0].blocks.map(b=>fmtT(b.start)+" "+b.title).join(" | "));
