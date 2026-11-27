// تست منطق هستهٔ برنامه‌ریز (node)
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/planner-app.html", "utf-8");
const core = html.split("/*CORE-START*/")[1].split("/*CORE-END*/")[0];
const bundle = __dirname + "/.core-bundle.js";
fs.writeFileSync(bundle, core + `
;module.exports = {faNum,enNum,DAY_NAMES,addDays,satOf,satIdx,dkey,sameDay,sameSat,nextWeekday,toJalali,jalaliStr,gregStr,fmtT,fmtRange,fmtDur,parseClock,tryTimeRange,tryTimePoint,tryDuration,tryCount,findDays,parseLine,planWeek,freeSlots,describeParsed,WINDOWS,parseDriverLine,effDriver,kidBlocksFor,mergeIV,shiftTypeFor,wifeWindowFor,parseShiftLine,SHIFT_FA,remOccurrences,remsForDay};
`);
const {faNum,enNum,DAY_NAMES,addDays,satOf,satIdx,dkey,sameDay,sameSat,nextWeekday,toJalali,jalaliStr,gregStr,fmtT,fmtRange,fmtDur,parseClock,tryTimeRange,tryTimePoint,tryDuration,tryCount,findDays,parseLine,planWeek,freeSlots,describeParsed,parseDriverLine,effDriver,kidBlocksFor,shiftTypeFor,wifeWindowFor,parseShiftLine,SHIFT_FA,remOccurrences,remsForDay} = require(bundle);

let pass = 0, fail = 0;
function eq(name, actual, expected){
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if(a === e){ pass++; console.log("  ✓ " + name); }
  else { fail++; console.log(`  ✗ ${name}\n      expected: ${e}\n      actual:   ${a}`); }
}
function ok(name, cond){ cond ? (pass++, console.log("  ✓ "+name)) : (fail++, console.log("  ✗ "+name)); }

const TODAY = (()=>{ const t=new Date(2026,8,12,12); return t; })(); // شنبه ۲۱ شهریور ۱۴۰۵

console.log("— تاریخ —");
eq("jalali 2026-09-12", toJalali(2026,9,12), [1405,6,21]);
eq("jalali 2026-03-21", toJalali(2026,3,21), [1405,1,1]);
eq("satIdx شنبه", satIdx(TODAY), 0);
eq("satIdx جمعه", satIdx(new Date(2026,8,18,12)), 6);
ok("satOf(TODAY)=خودش", sameDay(satOf(TODAY), TODAY));

console.log("— پارس خطوط —");
let r = parseLine("فردا ساعت ۱۰ تا ۱۲ کلاس ریاضی", TODAY);
eq("فردا: تاریخ", r.dates && r.dates.map(dkey), [dkey(addDays(TODAY,1))]);
eq("فردا: ساعت ثابت", [r.fixStart, r.fixEnd], [600, 720]);
eq("فردا: عنوان", r.title, "کلاس ریاضی");

r = parseLine("این هفته ۳ بار ورزش هر بار یک ساعت", TODAY);
eq("ورزش: هفتهٔ جاری", r.weekOnly, satOf(TODAY).getTime());
eq("ورزش: تعداد", r.perWeek, 3);
eq("ورزش: مدت", r.dur, 60);
eq("ورزش: عنوان", r.title, "ورزش");

r = parseLine("سه‌شنبه عصر دو ساعت مطالعه فصل ۳", TODAY);
eq("مطالعه: روز", r.dates && r.dates.map(dkey), [dkey(nextWeekday(TODAY,3))]);
eq("مطالعه: پنجره", r.window, "عصر");
eq("مطالعه: مدت", r.dur, 120);
eq("مطالعه: عنوان", r.title, "مطالعه فصل ۳");
eq("مطالعه: بدون ساعت ثابت", r.fixStart, null);

r = parseLine("هر روز نیم ساعت مرور لغت", TODAY);
eq("لغت: هر روز", r.everyDay, true);
eq("لغت: مدت", r.dur, 30);
eq("لغت: عنوان", r.title, "مرور لغت");

r = parseLine("پنجشنبه ساعت ۱۷ جلسه تیم", TODAY);
eq("جلسه: روز", r.dates && r.dates.map(dkey), [dkey(nextWeekday(TODAY,5))]);
eq("جلسه: ساعت ثابت (پایان فرضی)", [r.fixStart, r.fixEnd], [1020, 1080]);
eq("جلسه: عنوان", r.title, "جلسه تیم");
ok("جلسه: هشدار پایان فرضی", r.problems.length===1);

r = parseLine("شنبه‌ها ساعت ۱۶ جلسه", TODAY);
eq("شنبه‌ها: روزهای تکراری", r.weekdays, [0]);
eq("شنبه‌ها: ساعت", r.fixStart, 960);
eq("شنبه‌ها: عنوان", r.title, "جلسه");

r = parseLine("جمعه صبح یک ساعت و نیم خرید", TODAY);
eq("خرید: روز", r.dates && r.dates.map(dkey), [dkey(nextWeekday(TODAY,6))]);
eq("خرید: پنجره", r.window, "صبح");
eq("خرید: مدت", r.dur, 90);
eq("خرید: عنوان", r.title, "خرید");

r = parseLine("هفته بعد دوشنبه ساعت ۹ صبح یوگا", TODAY);
eq("یوگا: فقط هفتهٔ بعد", new Date(r.weekOnly).toDateString(), addDays(satOf(TODAY),7).toDateString());
eq("یوگا: دوشنبهٔ هفتهٔ بعد", r.dates && r.dates.map(dkey), [dkey(addDays(nextWeekday(TODAY,2),7))]);
eq("یوگا: ساعت ۹ صبح", r.fixStart, 540);
eq("یوگا: عنوان", r.title, "یوگا");

r = parseLine("چهارشنبه و پنجشنبه تمرین برنامه‌نویسی", TODAY);
eq("تمرین: دو روز", r.dates && r.dates.map(dkey), [dkey(nextWeekday(TODAY,4)), dkey(nextWeekday(TODAY,5))]);
eq("تمرین: مدت پیش‌فرض", r.dur, null);
eq("تمرین: عنوان", r.title, "تمرین برنامه‌نویسی");

r = parseLine("شنبه تا دوشنبه مطالعه درس", TODAY);
eq("بازهٔ روزی: ۳ روز", r.dates && r.dates.map(dkey),
   [dkey(nextWeekday(TODAY,0)), dkey(nextWeekday(TODAY,1)), dkey(nextWeekday(TODAY,2))]);
eq("بازهٔ روزی: عنوان", r.title, "مطالعه درس");

r = parseLine("مهمانی خواهرم جمعه ساعت ۷ شب", TODAY);
eq("مهمانی: ۷ شب = ۱۹:۰۰", [r.fixStart, r.fixEnd], [1140, 1200]);
eq("مهمانی: عنوان", r.title, "مهمانی خواهرم");

r = parseLine("تماس با دکتر اگر شد پنجشنبه ۴۵ دقیقه", TODAY);
eq("دکتر: اولویت پایین", r.priority, 3);
eq("دکتر: مدت", r.dur, 45);
eq("دکتر: روز", r.dates && r.dates.map(dkey), [dkey(nextWeekday(TODAY,5))]);
eq("دکتر: عنوان", r.title, "تماس با دکتر");

console.log("— زمان‌بند —");
const settings = {dayStart:480, dayEnd:1320, active:[0,1,2,3,4,5,6]};
const weekSat = satOf(TODAY);
const T = [
  {id:"a", title:"کلاس ریاضی", dates:[addDays(weekSat,0),addDays(weekSat,2),addDays(weekSat,3)], fixStart:600, fixEnd:720, dur:120, priority:1, window:null, notes:"", createdAt:1, weekdays:null, everyDay:false, weekOnly:null, perWeek:null},
  {id:"b", title:"ورزش", dates:null, perWeek:3, dur:90, priority:2, window:null, notes:"", createdAt:2, fixStart:null, fixEnd:null, weekdays:null, everyDay:false, weekOnly:null},
  {id:"c", title:"مرور شب", dates:null, perWeek:2, dur:45, priority:3, window:"شب", notes:"", createdAt:3, fixStart:null, fixEnd:null, weekdays:null, everyDay:false, weekOnly:null},
];
const plan = planWeek(T, weekSat, settings);
eq("شنبه: ۲ کار (کلاس+ورزش)", plan[0].blocks.length, 2);
eq("شنبه: کلاس قفل در ۱۰:۰۰", plan[0].blocks.find(b=>b.title==="کلاس ریاضی").start, 600);
ok("ورزش: ۳ روز جدا", plan.filter(d=>d.blocks.some(b=>b.title==="ورزش")).length===3);
const gymDays = plan.filter(d=>d.blocks.some(b=>b.title==="ورزش")).map(d=>d.idx);
ok("ورزش: در روز کلاس‌دار هم چیده شده (بعد از کلاس)", plan[0].blocks.some(b=>b.title==="ورزش") ? plan[0].blocks.find(b=>b.title==="ورزش").start>=720 : true);
const reviewBlocks = plan.flatMap(d=>d.blocks).filter(b=>b.title==="مرور شب");
ok("مرور شب: ۲ بار", reviewBlocks.length===2);
ok("مرور شب: داخل پنجرهٔ شب", reviewBlocks.every(b=>b.start>=1260 && b.end<=1320));
ok("بدون هم‌پوشانی", plan.every(d=>{
  for(let i=1;i<d.blocks.length;i++) if(d.blocks[i].start < d.blocks[i-1].end) return false;
  return true;
}));

// ظرفیت پر → جا نشدن
const busyT = Array.from({length:7},(_,i)=>({id:"x"+i, title:"پرکار", dates:[addDays(weekSat,i)], fixStart:480, fixEnd:1320, dur:840, priority:1, window:null, notes:"", createdAt:i, weekdays:null, everyDay:false, weekOnly:null, perWeek:null}));
const plan2 = planWeek([...busyT, {id:"y", title:"جا نمی‌شود", dates:null, perWeek:1, dur:60, priority:2, window:null, notes:"", createdAt:9, fixStart:null, fixEnd:null, weekdays:null, everyDay:false, weekOnly:null}], weekSat, settings);
ok("کار بدون جا → unplaced", plan2.some(d=>d.unplaced.some(u=>u.title==="جا نمی‌شود")));

// روز غیرفعال
const plan3 = planWeek([{id:"z", title:"تنها", dates:null, perWeek:2, dur:60, priority:2, window:null, notes:"", createdAt:1, fixStart:null, fixEnd:null, weekdays:null, everyDay:false, weekOnly:null}],
  weekSat, {dayStart:480, dayEnd:1320, active:[0,2]});
eq("فقط شنبه و دوشنبه فعال: ۲ قرار", plan3.filter(d=>d.active).reduce((s,d)=>s+d.blocks.length,0), 2);


console.log("— خانواده: خط راننده —");
const FAM0 = {selfName:"من", drivers:["من","خانمم","اسنپ","خانم انصاری"], kids:[],
  driverWeekly:[null,null,null,null,null,null,null], driverByDate:{}, pickupMin:30, dropoffMin:20, blockSelf:true};
let dl = parseDriverLine("راننده فردا اسنپ", TODAY, FAM0);
eq("راننده فردا: اسم", dl.driver, "اسنپ");
eq("راننده فردا: روز", dl.dates.map(dkey), [dkey(addDays(TODAY,1))]);
dl = parseDriverLine("راننده سه‌شنبه خانم انصاری", TODAY, FAM0);
eq("راننده سه‌شنبه (نه شنبه!)", dl.dates.map(dkey), [dkey(nextWeekday(TODAY,3))]);
eq("راننده: اسم دوکلمه‌ای", dl.driver, "خانم انصاری");
dl = parseDriverLine("راننده این هفته خانمم", TODAY, FAM0);
eq("راننده کل هفته", dl.allWeek, true);
dl = parseDriverLine("راننده شنبه و یکشنبه: من", TODAY, FAM0);
eq("راننده دو روز", dl.dates.length, 2);
eq("خط عادی، راننده نیست", parseLine("جلسه با مشتری ساعت ۱۰", TODAY).fixStart, 600);

console.log("— خانواده: planWeek با بچه و راننده —");
const FAM = {selfName:"من", drivers:["من","خانمم","اسنپ","خانم انصاری"],
  kids:[
    {name:"پسرم", classes:[{title:"مدرسه", weekdays:[0,1,2,3,4], start:450, end:780}]},
    {name:"دخترم", classes:[{title:"مدرسه", weekdays:[0,1,2,3,4], start:480, end:750}]}
  ],
  driverWeekly:["من","خانمم","اسنپ","من","خانمم",null,null], driverByDate:{},
  pickupMin:30, dropoffMin:20, blockSelf:true};
const planF = planWeek([], weekSat, settings, FAM);
eq("شنبه: راننده من", planF[0].driver, "من");
const satBlocks = planF[0].blocks;
ok("شنبه: کلاس بچه‌ها ثبت شده", satBlocks.some(b=>b.kind==="kid" && b.kid==="پسرم" && b.start===450));
const duties = satBlocks.filter(b=>b.kind==="duty");
eq("شنبه: دو تحویل جدا (دخترم ۱۲:۳۰، پسرم ۱۳:۰۰)", duties.map(d=>[d.start,d.end]), [[750,770],[780,800]]);
eq("یکشنبه: راننده خانمم → وظایف ثبت ولی بدون بلاک", planF[1].blocks.filter(b=>b.kind==="duty").length, 2);
ok("یکشنبه: همهٔ وظایف بدون بلاک کردن وقت من", planF[1].blocks.filter(b=>b.kind==="duty").every(b=>b.nobusy));
ok("یکشنبه: کلاس بچه‌ها هست ولی بلاک نمی‌کند",
   planF[1].blocks.some(b=>b.kind==="kid") && planF[1].blocks.filter(b=>b.kind!=="kid").every(b=>b.nobusy));
const freeSatF = freeSlots(satBlocks.filter(b=>b.kind!=="kid"), 480, 1320);
eq("شنبه: کلاس بچه وقت مرا بلاک نمی‌کند (آزاد ۸ تا ۱۳)", freeSatF[0][0], 480);
eq("شنبه: بعد تحویل اول آزاد", freeSatF[1][0], 770);
eq("شنبه: بعد تحویل دوم آزاد", freeSatF[2][0], 800);
// اضافه‌کاری: ساعت ثابت روی ساعت تحویل → کار انعطافی نباید آنجا برود
const planG = planWeek([
  {id:"q", title:"تمرکز", dates:null, perWeek:1, dur:60, priority:2, window:null, notes:"", createdAt:1, fixStart:null, fixEnd:null, weekdays:null, everyDay:false, weekOnly:null}
], weekSat, settings, FAM);
const placed = planG.flatMap(d=>d.blocks).filter(b=>b.title==="تمرکز");
eq("کار انعطافی جایگذاری شد", placed.length, 1);
ok("کار انعطافی با مسئولیت رانندگی تداخل ندارد", planG.every(d=>
  d.blocks.filter(b=>b.kind==="duty").every(duty=>
    !placed.some(p=> d.blocks.includes(p) && p.start < duty.end && duty.start < p.end))));
// انتخاب روز خاص بر پیش‌فرض مقدم است
FAM.driverByDate[dkey(addDays(weekSat,1))] = "اسنپ";
eq("انتخاب روز خاص مقدم است", effDriver(FAM, 1, dkey(addDays(weekSat,1))), "اسنپ");
delete FAM.driverByDate[dkey(addDays(weekSat,1))];
eq("برگشت به پیش‌فرض هفتگی", effDriver(FAM, 1, dkey(addDays(weekSat,1))), "خانمم");


console.log("— برنامهٔ واقعی: پارسا یکشنبه با رانندگی من —");
const PF = {selfName:"من", drivers:["من","خانمم","خانم انصاری","اسنپ"], kids:[
   {name:"پارسا", classes:[
     {title:"والیبال (ابوالمعصومی)", weekdays:[1], start:870, end:960, travel:0, ret:"var"},
     {title:"والیبال (پرورده)", weekdays:[0,2,4], start:1080, end:1170, travel:30, ret:"var"},
     {title:"زبان (آنلاین)", weekdays:[1], start:1140, end:1200, travel:0, online:true},
     {title:"کونگ‌فو", weekdays:[1], start:1260, end:1350}
   ]}],
  driverWeekly:[null,"من",null,null,null,null,null], driverByDate:{}, pickupMin:15, dropoffMin:15, blockSelf:true};
const planP = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PF);
const sunDuties = planP[1].blocks.filter(b=>b.kind==="duty");
eq("یکشنبه: پارسا خودش میره ابوالمعصومی — بدون مسیر برای او",
   sunDuties.map(d=>[d.start,d.end]),
   [[1245,1260],[1350,1365]]);
ok("ابوالمعصومی ۱۴:۳۰–۱۶ ثبت است", planP[1].blocks.some(b=>b.kind==="kid"&&b.title.includes("ابوالمعصومی")&&b.start===870&&b.end===960));
ok("یکشنبه: کلاس‌های بچه ثبت‌اند", planP[1].blocks.filter(b=>b.kind==="kid").length===3);
ok("برگشت متغیر: پرورده یکشنبه اصلاً نیست (روز فرد)", !sunDuties.some(d=>d.start===1170));

const PF2 = {...PF, kids:[...PF.kids, {name:"مهرسا", classes:[{title:"فیروزه انفرادی", weekdays:[1], start:900, end:960, travel:30}]}],
  driverWeekly:["من","من","من","من","من","من","من"]};
const planF2 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PF2);
eq("فیروزه مهرسا یکشنبه ۱۵–۱۶ (مسیر ۱ ساعت)", planF2[1].blocks.filter(b=>b.kind==="kid"&&b.kid==="مهرسا").map(b=>[b.start,b.end]), [[900,960]]);
ok("مسیر فیروزه: خروج ۱۴:۳۰ (بعد زبان آنلاین) و برگشت ۱۶:۳۰", planF2[1].blocks.some(b=>b.kind==="duty"&&b.start<=870&&b.end>=900) && planF2[1].blocks.some(b=>b.kind==="duty"&&b.start===960&&b.end===990));

const PM = {...PF, kids:[{name:"مهرسا", classes:[
   {title:"کارگاه حل مسئله (فیروزه)", weekdays:[5], start:960, end:1020, travel:30},
   {title:"موسیقی", weekdays:[5], start:1170, end:1230}]}],
  driverWeekly:["من","من","من","من","من","من","من"]};
const planPM = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PM);
eq("پنجشنبه: کارگاه ۱۶–۱۷ با مسیر ۳۰ دقیقه", planPM[5].blocks.filter(b=>b.kind==="duty").map(d=>[d.start,d.end]).slice(0,2), [[930,960],[1020,1050]]);
eq("پنجشنبه: کلاس‌های مهرسا (کارگاه+موسیقی)", planPM[5].blocks.filter(b=>b.kind==="kid").map(b=>[b.start,b.end]), [[960,1020],[1170,1230]]);
eq("جمعه: هیچ کلاسی نیست", planPM[6].blocks.filter(b=>b.kind==="kid").length, 0);
const PP2 = {...PF, kids:[{name:"پارسا", classes:[{title:"والیبال (پرورده)", weekdays:[0,2,4,6], start:1080, end:1170, travel:30, ret:"var"}]}],
  driverWeekly:["من","من","من","من","من","من","من"]};
const planPP2 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PP2);
eq("پرورده ش/د/چ (جمعه بدون کلاس): فقط مسیر رفت برای من", [0,2,4,5].map(i=>planPP2[i].blocks.filter(b=>b.kind==="duty").map(d=>[d.start,d.end])),
   [[[1050,1080]],[[1050,1080]],[[1050,1080]],[]]);
const planP2 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]},
   {...PF, driverWeekly:[null,null,null,null,null,null,null]});
eq("یکشنبه با رانندهٔ دیگر: بدون مسؤولیت", planP2[1].blocks.filter(b=>b.kind==="duty").length, 0);

const PRV = {...PF, kids:[{name:"پارسا", classes:[{title:"والیبال", weekdays:[0], start:1080, end:1170, travel:30, ret:"var"}]}],
  driverWeekly:["من",null,null,null,null,null,null]};
const planRV = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PRV);
eq("برگشت متغیر: فقط رفت بلاک می‌شود", planRV[0].blocks.filter(b=>b.kind==="duty").map(d=>[d.start,d.end]), [[1050,1080]]);
const PRS = {...PF, kids:[{name:"مهرسا", classes:[{title:"شنا", weekdays:[0], start:900, end:960, travel:30}]}],
  driverWeekly:["من",null,null,null,null,null,null]};
const planRS = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PRS);
eq("شنا: مسیر ۳۰ دقیقه هر طرف", planRS[0].blocks.filter(b=>b.kind==="duty").map(d=>[d.start,d.end]), [[870,900],[960,990]]);


console.log("— v12: nodrv و varTime —");
const FAMN = {selfName:"من", drivers:["من","خانمم"], kids:[
  {name:"خانمم", classes:[{title:"شنا", weekdays:[0], start:900, end:1080, travel:0, nodrv:true}]},
  {name:"پارسا", classes:[{title:"پایتون", weekdays:[5], start:900, end:990, varTime:true}]}],
  driverWeekly:["من","من","من","من","من","من","من"], driverByDate:{}, pickupMin:15, dropoffMin:15, blockSelf:true};
const planN12 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, FAMN);
eq("کلاس خانمم (travel:0): حتی با رانندهٔ من هیچ وظیفه‌ای ساخته نمی‌شود", planN12[0].blocks.filter(b=>b.kind==="duty").map(b=>[b.start,b.end]), []);
ok("nodrv در بلاک کلاس حفظ می‌شود", planN12[0].blocks.some(b=>b.kind==="kid"&&b.kid==="خانمم"&&b.nodrv===true));
ok("varTime در بلاک کلاس حفظ می‌شود (پایتون پنجشنبه)", planN12[5].blocks.some(b=>b.kind==="kid"&&b.varTime===true&&b.start===900&&b.end===990));
const PRV2 = {selfName:"من", drivers:["من","خانمم"], kids:[
  {name:"مهرسا", classes:[{title:"شنا", weekdays:[0], start:900, end:1080, travel:30, ret:"var"}]}],
  driverWeekly:[null,null,null,null,null,null,null], driverByKidDate:{"2026-09-12":{"مهرسا":{go:"من", ret:"خانمم"}}},
  driverByDate:{}, pickupMin:15, dropoffMin:15, blockSelf:true};
const planV2 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, PRV2);
eq("برگشت متغیر ولی «آوردن» ثبت‌شدهٔ روز: مسیر برگشت هم بلاک می‌شود",
   planV2[0].blocks.filter(b=>b.kind==="duty").map(b=>[b.start,b.end]), [[870,900],[1080,1110]]);
ok("بردن با من: وقت خودم بلاک می‌شود", planV2[0].blocks.some(b=>b.kind==="duty"&&b.dir==="go"&&b.title.includes("من")&&b.nobusy===false));
ok("آوردن شنا با خانمم: nobusy", planV2[0].blocks.some(b=>b.kind==="duty"&&b.dir==="ret"&&b.title.includes("خانمم")&&b.nobusy===true));

console.log("— شیفت کاری —");
const SH = {anchor:"2026-09-12", anchorType:"night", commuteMin:120, overrides:{"2026-09-13":"ot"},
  dayStart:420, dayEnd:1140, nightStart:1140, nightEnd:420,
  wife:{fromDM:"15/03", toDM:"15/06", inWin:[360,810], outWin:[390,810]}};
eq("چرخه: شنبه شبکار", shiftTypeFor(weekSat, SH), "night");
eq("چرخه: یکشنبه اضافه‌کار (override)", shiftTypeFor(addDays(weekSat,1), SH), "ot");
eq("چرخه: دوشنبه استراحت", shiftTypeFor(addDays(weekSat,2), SH), "rest");
eq("چرخه: سه‌شنبه روزکار", shiftTypeFor(addDays(weekSat,3), SH), "day");
const planS = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, null, SH);
eq("شبکار شنبه: ۱۷–۲۴", planS[0].blocks.filter(b=>b.kind==="work").map(b=>[b.start,b.end]), [[1020,1440]]);
eq("اضافه‌کار یکشنبه: بازگشت ۹:۰۰ + شب", planS[1].blocks.filter(b=>b.kind==="work").map(b=>[b.start,b.end]), [[0,540],[1020,1440]]);
eq("روزکار سه‌شنبه: ۵–۲۱ (تردد واقعی)", planS[3].blocks.filter(b=>b.kind==="work").map(b=>[b.start,b.end]), [[300,1260]]);
const SH2 = {...SH, carDays:{"2026-09-15":true}};
const planC = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, null, SH2);
eq("ماشین خودم: برگشت ۳۰ دقیقه زودتر", planC[3].blocks.filter(b=>b.kind==="work").map(b=>[b.start,b.end]), [[300,1230]]);
eq("carOwn روزِ ماشین خودم", planC[3].carOwn, true);
const SHN = {...SH, carDays:{"2026-09-12":true}};
const planN = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, null, SHN);
eq("شبکار با ماشین خودم: رسیدن ۸:۳۰ فردا صبح", planN[1].blocks.filter(b=>b.kind==="work")[0].end, 510);
eq("remOccurrences: ۲ روز قبل، ۳ بار، فاصله ۱", remOccurrences({date:"2026-11-10",lead:2,times:3,gapDays:1}).map(o=>o.off), [2,1,0]);
eq("remOccurrences: بدون پیش‌داده → خود روز", remOccurrences({date:"2026-11-10"}).map(o=>o.off), [0]);
eq("remsForDay: اولین یادآور ۸ آبان", remsForDay([{date:"2026-11-10",lead:2,times:3,gapDays:1,title:"تماس"}], "2026-11-08").map(x=>x.off), [2]);
eq("remsForDay: روز بی‌ربط خالی", remsForDay([{date:"2026-11-10",lead:2,times:3,gapDays:1}], "2026-11-05").length, 0);
const ww = wifeWindowFor(weekSat, SH.wife);
eq("خانمم (۲۱ شهریور): فعلاً خونه ۱۳:۳۰", ww, [390,810]);
const ww2 = wifeWindowFor(new Date(2026,5,10,12), SH.wife); // ≈۲۰ خرداد (وسط فصل)
eq("خانمم (۲۰ خرداد): ۶:۰۰–۱۳:۳۰", ww2, [360,810]);
const sl = parseShiftLine("اضافه‌کار یکشنبه", TODAY);
eq("پارس: اضافه‌کار یکشنبه", [sl.type, sl.dates.map(dkey)], ["ot", [dkey(addDays(weekSat,1))]]);
const sl2 = parseShiftLine("پس‌فردا استراحتم", TODAY);
eq("پارس: پس‌فردا استراحت", [sl2.type, sl2.dates.map(dkey)], ["rest", [dkey(addDays(weekSat,2))]]);
ok("خط کار عادی، شیفت نیست", parseLine("جلسه پروژه فردا ساعت ۱۰", TODAY).fixStart===600);

console.log(`\n═══ نتیجه: ${pass} ✓ / ${fail} ✗ ═══`);
process.exit(fail?1:0);
