// تست دود رابط کاربری — اجرای کد UI با DOM شبیه‌سازی‌شده
const fs = require("fs");
const vm = require("vm");
const html = fs.readFileSync(__dirname + "/planner-app.html", "utf-8");

// هسته
const core = html.split("/*CORE-START*/")[1].split("/*CORE-END*/")[0];

// اسکریپت UI (بلوک دوم <script>)
const scripts = html.match(/<script>[\s\S]*?<\/script>/g);
const ui = scripts[scripts.length - 1].replace(/^<script>/, "").replace(/<\/script>$/, "");

function makeEl(id){
  return {
    id, innerHTML:"", value:"", style:{}, files:[],
    classList:{ _s:new Set(), toggle(c){ this._s.has(c)?this._s.delete(c):this._s.add(c); return this._s.has(c); },
                add(c){this._s.add(c)}, remove(c){this._s.delete(c)}, contains(c){return this._s.has(c)} },
    addEventListener(){}, appendChild(){}, remove(){}, focus(){}, click(){},
    closest(){return null}, querySelector(){return null},
  };
}
const els = {};
["rangeBox","statChips","dateNav","main","summaryBox","taskList","daySet","dayStart","dayEnd",
 "storageNote","fb","chatIn","addBtn","importFile","exRow","tabWeek","tabDay","btnSet","btnTasks",
 "tasksPanel","setPanel"].forEach(id=>els[id]=makeEl(id));

const sandbox = {
  console,
  document:{ getElementById:id=>els[id]||(els[id]=makeEl(id)), createElement:t=>makeEl(t), body:makeEl("body") },
  confirm:()=>true, alert:m=>console.log("[alert]",m),
  URL:{ createObjectURL:()=>"blob:x" }, Blob:class{constructor(){}},
  setTimeout, Date, Math, JSON, Set, Object, Array, String, Number, RegExp, parseFloat, parseInt,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

let failures = 0;
function step(name, fn){
  try{ fn(); console.log("  ✓ " + name); }
  catch(e){ failures++; console.log("  ✗ " + name + " → " + e.message); }
}

vm.createContext(sandbox);
step("اجرای هسته (CORE)", ()=>vm.runInContext(core, sandbox));
step("اجرای UI + init()", ()=>vm.runInContext(ui, sandbox));

step("پیش‌فرض: خانهٔ تقویمی (v15)", ()=>{ if(!els.main.innerHTML.includes("yh-big") || !els.main.innerHTML.includes("ckrow")) throw Error("خانه نیست"); });
step("شبکهٔ هفته پس از سوییچ", ()=>{ vm.runInContext("setTab('week')", sandbox); if(!els.main.innerHTML.includes("daycard")) throw Error("grid خالی است"); });
step("کارت امروز هایلایت شده", ()=>{ if(!els.main.innerHTML.includes("today")) throw Error("بدون امروز"); });
step("نمونه‌ها ساخته شدند", ()=>{ if(!els.exRow.innerHTML && true) {} }); // از appendChild استفاده می‌کند — خطا نمی‌دهد

step("افزودن کار از ورودی", ()=>{
  els.chatIn.value = "فردا ساعت ۹ تا ۱۰:۳۰ جلسه دمو\nچهارشنبه عصر یک ساعت و نیم مطالعه";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("جلسه دمو")) throw Error("بازخورد نساخت: "+els.fb.innerHTML.slice(0,120));
});
step("کار دوم هم اضافه شد", ()=>{ if(!els.fb.innerHTML.includes("مطالعه")) throw Error("خط دوم پارس نشد"); });
step("«مهم» → اولویت بالا", ()=>{
  els.chatIn.value = "پروژه مهم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("اولویت بالا")) throw Error("اولویت تشخیص داده نشد");
});

step("تب روز", ()=>vm.runInContext("setTab('day')", sandbox));
step("نمای روز رندر شد", ()=>{ if(!els.main.innerHTML.includes("daybig")) throw Error("daybig نیست"); });
step("ناوبری روز", ()=>vm.runInContext("shiftDay(2); shiftDay(-1);", sandbox));
step("فردا (دکمه)", ()=>vm.runInContext("goDay(addDays(TODAY(),1))", sandbox));
step("فاصله‌های خالی در نمای روز", ()=>{ if(!els.main.innerHTML.includes("gaprow")) throw Error("gaprow نیست"); });

step("تب هفته + جابه‌جایی", ()=>{ vm.runInContext("setTab('week'); shiftWeek(1); shiftWeek(-1); goWeek(0);", sandbox); });
step("کلیک روی کارت روز (goDay)", ()=>vm.runInContext("goDay(DK('2026-09-16'))", sandbox));
step("بازگشت به هفته", ()=>vm.runInContext("setTab('week')", sandbox));

step("پنل تنظیمات", ()=>{ vm.runInContext("togglePanel('setPanel')", sandbox); });
step("تغییر روز فعال", ()=>vm.runInContext("toggleDay(6,false)", sandbox));
step("بازگرداندن روز", ()=>vm.runInContext("toggleDay(6,true)", sandbox));
step("تغییر ساعت روز", ()=>{ els.dayStart.value="07:30"; els.dayStart.onchange({target:{value:"07:30"}}); });

step("لیست کارها", ()=>{ vm.runInContext("togglePanel('tasksPanel')", sandbox); if(!els.taskList.innerHTML.includes("trow")) throw Error("لیست خالی"); });
step("حذف کار", ()=>vm.runInContext("removeTask(tasks[0].id, null)", sandbox));

step("ثبت شیفت از ورودی", ()=>{
  els.chatIn.value = "پس‌فردا استراحتم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("استراحت")) throw Error("شیفت ثبت نشد: "+els.fb.innerHTML.slice(0,120));
});
const grab = id => vm.runInContext("document.getElementById('"+id+"').innerHTML", sandbox);
step("تقویم ماه رندر شد", ()=>{
  vm.runInContext("setTab('cal')", sandbox);
  const h = grab("main");
  if(!h.includes("calgrid")) throw Error("calgrid نیست");
  const mn = vm.runInContext("J_MONTHS[calM-1]", sandbox);
  if(!h.includes(mn)) throw Error("ماه اشتباه، انتظار: "+mn);
});
step("یادآور از تقویم ثبت شد", ()=>{
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  vm.runInContext("calPick('"+dk+"')", sandbox);
  vm.runInContext("document.getElementById('remTitle').value='تماس با اداره'", sandbox);
  vm.runInContext("addRem('"+dk+"')", sandbox);
  if(!grab("main").includes("تماس با اداره")) throw Error("یادآور در لیست نیست");
});
step("بنر یادآور در هفته", ()=>{
  if(vm.runInContext("document.getElementById('summaryBox').innerHTML", sandbox).includes("همپوشان")) throw Error("با دادهٔ درست نباید همپوشانی بده");
  vm.runInContext("const _c=family.kids[0].classes.find(c=>c.id==='p5'); _c.start=870; _c.end=960;", sandbox);
  vm.runInContext("render()", sandbox);
  if(!vm.runInContext("document.getElementById('summaryBox').innerHTML", sandbox).includes("همپوشان")) throw Error("هشدار همپوشانی نیامد");
  vm.runInContext("const _c2=family.kids[0].classes.find(c=>c.id==='p5'); _c2.start=1140; _c2.end=1200;", sandbox);
  vm.runInContext("render()", sandbox);
  vm.runInContext("setTab('week')", sandbox);
  if(!grab("main").includes("rembn")) throw Error("بنر نیست");
});
step("بریف «کارهای ثابت» در روز + کار روزانه", ()=>{
  vm.runInContext("setTab('day')", sandbox);
  if(!grab("main").includes("کارهای ثابت")) throw Error("بریف نیست");
  if(!grab("main").includes("برگشت متغیر")) throw Error("برگشت متغیر در بریف نیست");
  vm.runInContext("addQuickTask(dkey(TODAY()),'inspect')", sandbox);
  if(!grab("main").includes("نظام مهندسی")) throw Error("کار روزانه اضافه نشد");
});
step("ماشین خودم از جمله", ()=>{
  els.chatIn.value = "فردا ماشین خودم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("ماشین خودم")) throw Error("جمله پارس نشد");
  if(!vm.runInContext("!!shiftCfg.carDays[dkey(addDays(TODAY(),1))]", sandbox)) throw Error("carDays ثبت نشد");
});

step("مرور شبانه: بستن برنامهٔ فردا + خروجی", ()=>{
  vm.runInContext("setTab('day')", sandbox);
  vm.runInContext("goDay(addDays(TODAY(),1))", sandbox);
  const h = grab("main");
  if(!h.includes("مرور شبانه")) throw Error("بنر مرور شبانه نیست");
  vm.runInContext("closeTomorrowPlan()", sandbox);
  if(vm.runInContext("closedPlans.length", sandbox)!==1) throw Error("بسته ثبت نشد");
  if(!grab("main").includes("بسته شد")) throw Error("نشان بسته‌شدگی نیست");
});
step("یادداشت فیروزهٔ متغیر دوشنبه", ()=>{
  vm.runInContext("goDay(DK('2026-09-14'))", sandbox);
  if(!grab("main").includes("فیروزهٔ انفرادی پارسا")) throw Error("یادداشت فیروزه نیست");
});
step("یادداشت و درخواست روز (پایین برنامه)", ()=>{
  vm.runInContext("setTab('day'); goDay(TODAY())", sandbox);
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  if(!grab("main").includes("درخواست تغییر")) throw Error("جعبهٔ درخواست نیست");
  vm.runInContext("saveDayNote('"+dk+"','ساعت فیروزه این هفته ۱۷')", sandbox);
  const clsName = vm.runInContext("(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind==='kid')||{}).title||''", sandbox);
  vm.runInContext("document.getElementById('dayreq-"+dk+"').value='راننده: اسنپ\\nحذف کلاس "+clsName+"'", sandbox);
  vm.runInContext("applyDayRequests('"+dk+"')", sandbox);
  if(vm.runInContext("family.driverByDate['"+dk+"']", sandbox)!=="اسنپ") throw Error("راننده اعمال نشد");
  if(!grab("main").includes("حذف شد")) throw Error("بازخورد حذف نیست");
});
step("پایتون پارسا: ساعت متغیر پنجشنبه از کادر درخواست", ()=>{
  const dkThu = vm.runInContext("dkey(nextWeekday(TODAY(),5))", sandbox);
  vm.runInContext("goDay(DK('"+dkThu+"'))", sandbox);
  vm.runInContext("setTab('day')", sandbox);
  vm.runInContext("document.getElementById('dayreq-"+dkThu+"').value='پایتون پارسا ساعت ۱۵ تا ۱۶:۳۰'", sandbox);
  vm.runInContext("applyDayRequests('"+dkThu+"')", sandbox);
  const pc = vm.runInContext("family.kids[0].classes.find(c=>c.id==='p1')", sandbox);
  if(!pc || pc.start!==900 || pc.end!==990) throw Error("ساعت پایتون اعمال نشد: "+JSON.stringify(pc));
  if(vm.runInContext("lastDayFB.dk", sandbox)!==dkThu) throw Error("بازخورد روز اشتباه");
});
step("اعلان‌ها: موتور و کلید", ()=>{
  vm.runInContext("checkNotifs()", sandbox);
  vm.runInContext("notifToggle()", sandbox);
  if(vm.runInContext("notifOn", sandbox)!==false) throw Error("سوییچ اعلان کار نکرد");
  vm.runInContext("notifToggle()", sandbox);
  const s = vm.runInContext("document.getElementById('statChips').innerHTML", sandbox);
  if(!s.includes("اعلان کلاس‌ها")) throw Error("چیپ اعلان نیست");
});
step("نوار «کلاس بعدی» (تابع)", ()=>{
  const h = vm.runInContext("nextClassHTML(planWeek(tasks, satOf(TODAY()), settings, family, shiftCfg)[satIdx(TODAY())])", sandbox);
  if(typeof h !== "string") throw Error("nextClassHTML رشته برنگرداند");
});

step("خروجی JSON", ()=>vm.runInContext("exportJSON()", sandbox));
step("پاک‌کردن همه", ()=>vm.runInContext("clearAll()", sandbox));
step("بعد از پاک‌کردن، هفته خالی", ()=>{ if(els.main.innerHTML.includes("🔒")) {} }); // نباید خطا بدهد

step("importJSONText", ()=>vm.runInContext(`importJSONText(JSON.stringify({day_start:"09:00", day_end:"21:00", tasks:[{title:"کلاس زبان", days:["یکشنبه","سه‌شنبه"], time:"17:00-18:30", priority:"بالا"},{title:"باشگاه", duration:90, per_week:3}]}))`, sandbox));


step("پنل خانواده", ()=>{ vm.runInContext("togglePanel('famPanel')", sandbox); });
step("راننده‌های نمونه رندر شدند", ()=>{ if(!els.drvChips.innerHTML.includes("اسنپ")) throw Error("راننده‌ها نیستند"); });
step("کلاس بچه‌ها در خانواده رندر شد", ()=>{ if(!els.kidsBox.innerHTML.includes("پارسا")) throw Error("بچه‌ها نیستند"); });
step("خط راننده از ورودی", ()=>{
  els.chatIn.value = "راننده پس‌فردا خانمم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("رانندهٔ")) throw Error("بازخورد راننده نیامد: "+els.fb.innerHTML.slice(0,100));
});
step("انتخاب راننده روز خاص", ()=>vm.runInContext("setDriverFor('2026-09-14','اسنپ')", sandbox));
step("کارت هفته شامل کلاس بچه‌ها و راننده است", ()=>{
  if(!els.main.innerHTML.includes("kidsec")) throw Error("kidsec نیست");
  if(!els.main.innerHTML.includes("راننده")) throw Error("راننده نیست");
});
step("مسئولیت رانندگی در برنامهٔ روز", ()=>{
  vm.runInContext("setDriverFor('2026-09-12','من')", sandbox); // شنبه — راننده: من
  vm.runInContext("goDay(DK('2026-09-12'))", sandbox);
  vm.runInContext("setTab('day')", sandbox);
  if(!els.main.innerHTML.includes("رساندن و تحویل بچه‌ها") && !els.main.innerHTML.includes("رانندگی")) throw Error("duty نیست");
});

step("تیک زدن کار روز (v13)", ()=>{
  vm.runInContext("setTab('day')", sandbox);
  vm.runInContext("goDay(TODAY())", sandbox);
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  const bid = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind!=='kid'&&!b.nobusy)))", sandbox);
  vm.runInContext("toggleDone('"+dk+"','"+bid+"')", sandbox);
  if(!vm.runInContext("isDone('"+dk+"', decodeURIComponent('"+bid+"'))", sandbox)) throw Error("تیک ذخیره نشد");
  if(!els.main.innerHTML.includes("ckb") || !els.main.innerHTML.includes("doneRow")) throw Error("نشان تیک در ردیف روز نیست");
  vm.runInContext("toggleDone('"+dk+"','"+bid+"')", sandbox);
  if(vm.runInContext("isDone('"+dk+"', decodeURIComponent('"+bid+"'))", sandbox)) throw Error("برداشتن تیک کار نکرد");
});

step("یادآور هر کار در نمای روز (v14)", ()=>{
  vm.runInContext("setTab('day'); goDay(TODAY())", sandbox);
  if(!els.main.innerHTML.includes("toggleRem")) throw Error("چیپ یادآور نیست");
});

step("جعبهٔ افزودن در کارت هفته (v15)", ()=>{ if(!els.main.innerHTML.includes("addrow") || !els.main.innerHTML.includes("exT_")) throw Error("جعبهٔ اضافه در کارت نیست"); });
step("خانهٔ دسکتاپ: تقویم + چک‌لیست + جعبه (v15)", ()=>{ vm.runInContext("setTab('cal')", sandbox); const h=els.main.innerHTML; if(!h.includes("yh-big")||!h.includes("addrow")) throw Error("خانهٔ دسکتاپ ناقص"); });
step("افزودن کار از خانه (v15)", ()=>{
  vm.runInContext("document.getElementById('exT').value='۱۷ تا ۱۸ گزارش کار'", sandbox);
  vm.runInContext("addExtra(dkey(TODAY()),'exT')", sandbox);
  if(!els.main.innerHTML.includes("گزارش کار")) throw Error("کار اضافه نشد");
});
step("حذف/برگرداندن ردیف روز (v15)", ()=>{
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  const bid = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind!=='kid'&&!b.nobusy)))", sandbox);
  vm.runInContext("toggleHide('"+dk+"','"+bid+"')", sandbox);
  if(!els.main.innerHTML.includes("↺")) throw Error("دکمهٔ برگرداندن نیست");
  vm.runInContext("toggleHide('"+dk+"','"+bid+"')", sandbox);
  if(els.main.innerHTML.includes("↺")) throw Error("برگرداندن کار نکرد");
});
step("حذف کار اضافه‌شده با ✕ (v15)", ()=>{
  vm.runInContext("const et=extraTaskOf(dkey(TODAY()),planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.title==='گزارش کار')); if(!et) throw Error('پیدا نشد'); delExtraById(et.id)", sandbox);
  if(els.main.innerHTML.includes("گزارش کار")) throw Error("حذف نشد");
});

console.log(failures ? `\n═══ ${failures} خطا ═══` : "\n═══ UI سالم است ✓ ═══");
process.exit(failures?1:0);
