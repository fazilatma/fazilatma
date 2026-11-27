// تست دود رابط کاربری موبایل
const fs = require("fs");
const vm = require("vm");
const html = fs.readFileSync(__dirname + "/../planner-mobile.html", "utf-8");

const core = html.split("/*CORE-START*/")[1].split("/*CORE-END*/")[0];
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
["rangeBox","statChips","navWeek","navDay","mainWeek","mainDay","summaryBox","taskList","daySet","dayStart","dayEnd",
 "storageNote","fb","chatIn","addBtn","importFile","exRow","newDrv","drvChips","wkDrv","kidsBox","blockSelf",
 "pickupMin","dropoffMin","storageNote"].forEach(id=>els[id]=makeEl(id));
["v-week","v-day","v-fam","v-tasks","b-week","b-day","b-fam","b-tasks"].forEach(id=>els[id]=makeEl(id));

const sandbox = {
  console,
  document:{ getElementById:id=>els[id]||(els[id]=makeEl(id)), createElement:t=>makeEl(t), body:makeEl("body") },
  confirm:()=>true, alert:m=>console.log("[alert]",m),
  URL:{ createObjectURL:()=>"blob:x" }, Blob:class{constructor(){}},
  setTimeout, Date, Math, JSON, Set, Object, Array, String, Number, RegExp, parseFloat, parseInt,
};
sandbox.window = sandbox;
sandbox.window.scrollTo = ()=>{};
sandbox.globalThis = sandbox;

let failures = 0;
function step(name, fn){
  try{ fn(); console.log("  ✓ " + name); }
  catch(e){ failures++; console.log("  ✗ " + name + " → " + e.message); }
}

vm.createContext(sandbox);
step("اجرای هسته", ()=>vm.runInContext(core, sandbox));
step("اجرای UI موبایل + init()", ()=>vm.runInContext(ui, sandbox));
step("نمای هفته رندر شد", ()=>{ if(!els.mainWeek.innerHTML.includes("daycard")) throw Error("خالی"); });
step("کارت‌ها شامل انتخاب راننده", ()=>{ if(!els.mainWeek.innerHTML.includes("drvs")) throw Error("select راننده نیست"); });
step("کارت‌ها شامل کلاس بچه‌ها", ()=>{ if(!els.mainWeek.innerHTML.includes("kidsec")) throw Error("kidsec نیست"); });
step("تب روز", ()=>vm.runInContext("setMode('day')", sandbox));
step("نمای روز با فاصله‌های خالی", ()=>{ if(!els.mainDay.innerHTML.includes("daycard")) throw Error("خالی"); });
step("دکمه‌های سریع راننده در روز", ()=>vm.runInContext("setMode('day'); if(!document.getElementById('mainDay').innerHTML.includes('drvquick')) throw Error('نیست');", sandbox));
step("تغییر راننده از دکمه سریع", ()=>vm.runInContext("const mm=document.getElementById('mainDay').innerHTML.match(/setDriverFor..(\\d{4}-\\d{2}-\\d{2})/); setDriverFor(mm[1],'من')", sandbox));
step("تب خانواده", ()=>vm.runInContext("setMode('fam')", sandbox));
step("راننده‌ها رندر شدند", ()=>{ if(!els.drvChips.innerHTML.includes("اسنپ")) throw Error("نیستند"); });
step("بچه‌ها رندر شدند", ()=>{ if(!els.kidsBox.innerHTML.includes("مهرسا")) throw Error("نیستند"); });
step("افزودن راننده", ()=>{ els.newDrv.value="عمه مریم"; vm.runInContext("addDriver()", sandbox); if(!els.drvChips.innerHTML.includes("عمه مریم")) throw Error("اضافه نشد"); });
step("افزودن کار + خط راننده", ()=>{
  els.chatIn.value = "فردا ساعت ۹ تا ۱۰ جلسه کاری\nراننده فردا: اسنپ";
  vm.runInContext("setMode('week'); addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("جلسه کاری")) throw Error("کار ثبت نشد");
  if(!els.fb.innerHTML.includes("رانندهٔ")) throw Error("راننده ثبت نشد");
});
step("تب کارها", ()=>vm.runInContext("setMode('tasks')", sandbox));
step("لیست کارها", ()=>{ if(!els.taskList.innerHTML.includes("trow")) throw Error("خالی"); });
step("ثبت شیفت از ورودی", ()=>{
  els.chatIn.value = "پس‌فردا استراحتم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("استراحت")) throw Error("شیفت ثبت نشد: "+els.fb.innerHTML.slice(0,120));
});
const MAINOF = {cal:"mainCal", week:"mainWeek", day:"mainDay"};
const mainMode = ()=>vm.runInContext("mode", sandbox);
const grab = id => vm.runInContext("document.getElementById('"+id+"').innerHTML", sandbox);
step("تقویم ماه رندر شد", ()=>{
  vm.runInContext("setMode('cal')", sandbox);
  const h = grab(MAINOF[mainMode()]);
  if(!h.includes("calgrid")) throw Error("calgrid نیست");
  const mn = vm.runInContext("J_MONTHS[calM-1]", sandbox);
  if(!h.includes(mn)) throw Error("ماه اشتباه، انتظار: "+mn);
});
step("یادآور از تقویم ثبت شد", ()=>{
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  vm.runInContext("calPick('"+dk+"')", sandbox);
  vm.runInContext("document.getElementById('remTitle').value='تماس با اداره'", sandbox);
  vm.runInContext("addRem('"+dk+"')", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("تماس با اداره")) throw Error("یادآور در لیست نیست");
});
step("بنر یادآور در هفته", ()=>{
  if(vm.runInContext("document.getElementById('summaryBox').innerHTML", sandbox).includes("همپوشان")) throw Error("با دادهٔ درست نباید همپوشانی بده");
  vm.runInContext("const _c=family.kids[0].classes.find(c=>c.id==='p5'); _c.start=870; _c.end=960;", sandbox);
  vm.runInContext("render()", sandbox);
  if(!vm.runInContext("document.getElementById('summaryBox').innerHTML", sandbox).includes("همپوشان")) throw Error("هشدار همپوشانی نیامد");
  vm.runInContext("const _c2=family.kids[0].classes.find(c=>c.id==='p5'); _c2.start=1140; _c2.end=1200;", sandbox);
  vm.runInContext("render()", sandbox);
  vm.runInContext("setMode('week')", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("rembn")) throw Error("بنر نیست");
});
step("بریف «کارهای ثابت» در روز + کار روزانه", ()=>{
  vm.runInContext("setMode('day'); goDay(TODAY())", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("کارهای ثابت")) throw Error("بریف نیست");
  if(!grab(MAINOF[mainMode()]).includes("برگشت متغیر")) throw Error("برگشت متغیر در بریف نیست");
  vm.runInContext("addQuickTask(dkey(TODAY()),'inspect')", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("نظام مهندسی")) throw Error("کار روزانه اضافه نشد");
});
step("ماشین خودم از جمله", ()=>{
  els.chatIn.value = "فردا ماشین خودم";
  vm.runInContext("addFromInput()", sandbox);
  if(!els.fb.innerHTML.includes("ماشین خودم")) throw Error("جمله پارس نشد");
  if(!vm.runInContext("!!shiftCfg.carDays[dkey(addDays(TODAY(),1))]", sandbox)) throw Error("carDays ثبت نشد");
});

step("مرور شبانه: بستن برنامهٔ فردا + خروجی", ()=>{
  vm.runInContext("setMode('day')", sandbox);
  vm.runInContext("goDay(addDays(TODAY(),1))", sandbox);
  const h = grab(MAINOF[mainMode()]);
  if(!h.includes("مرور شبانه")) throw Error("بنر مرور شبانه نیست");
  vm.runInContext("closeTomorrowPlan()", sandbox);
  if(vm.runInContext("closedPlans.length", sandbox)!==1) throw Error("بسته ثبت نشد");
  if(!grab(MAINOF[mainMode()]).includes("بسته شد")) throw Error("نشان بسته‌شدگی نیست");
});
step("یادداشت فیروزهٔ متغیر دوشنبه", ()=>{
  vm.runInContext("goDay(DK('2026-09-14'))", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("فیروزهٔ انفرادی پارسا")) throw Error("یادداشت فیروزه نیست");
});
step("یادداشت و درخواست روز (پایین برنامه)", ()=>{
  vm.runInContext("setMode('day'); goDay(TODAY())", sandbox);
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("درخواست تغییر")) throw Error("جعبهٔ درخواست نیست");
  vm.runInContext("saveDayNote('"+dk+"','ساعت فیروزه این هفته ۱۷')", sandbox);
  const clsName = vm.runInContext("(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind==='kid')||{}).title||''", sandbox);
  vm.runInContext("document.getElementById('dayreq-"+dk+"').value='راننده: اسنپ\\nحذف کلاس "+clsName+"'", sandbox);
  vm.runInContext("applyDayRequests('"+dk+"')", sandbox);
  if(vm.runInContext("family.driverByDate['"+dk+"']", sandbox)!=="اسنپ") throw Error("راننده اعمال نشد");
  if(!grab(MAINOF[mainMode()]).includes("حذف شد")) throw Error("بازخورد حذف نیست");
});
step("پایتون پارسا: ساعت متغیر پنجشنبه از کادر درخواست", ()=>{
  const dkThu = vm.runInContext("dkey(nextWeekday(TODAY(),5))", sandbox);
  vm.runInContext("goDay(DK('"+dkThu+"'))", sandbox);
  vm.runInContext("setMode('day')", sandbox);
  vm.runInContext("document.getElementById('dayreq-"+dkThu+"').value='پایتون پارسا ساعت ۱۵ تا ۱۶:۳۰'", sandbox);
  vm.runInContext("applyDayRequests('"+dkThu+"')", sandbox);
  const pc = vm.runInContext("family.kids[0].classes.find(c=>c.id==='p1')", sandbox);
  if(!pc || pc.start!==900 || pc.end!==990) throw Error("ساعت پایتون اعمال نشد: "+JSON.stringify(pc));
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

step("خانهٔ یِکا: تقویم بالا + چک‌لیست روز (v13)", ()=>{
  vm.runInContext("setMode('cal')", sandbox);
  const h = grab(MAINOF[mainMode()]);
  if(!h.includes("calgrid")) throw Error("تقویم ماه نیست");
  if(!h.includes("ckrow")) throw Error("چک‌لیست روز نیست");
  if(!h.includes("calToday")) throw Error("دکمهٔ امروز نیست");
  if(!h.includes("انجام شد")) throw Error("شمارندهٔ انجام‌شده نیست");
});
step("تیک زدن کار در خانه + دوباره‌رندر (v13)", ()=>{
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  vm.runInContext("calPick('"+dk+"')", sandbox);
  const bid = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks[0]))", sandbox);
  vm.runInContext("toggleDone('"+dk+"','"+bid+"')", sandbox);
  if(!vm.runInContext("isDone('"+dk+"', decodeURIComponent('"+bid+"'))", sandbox)) throw Error("تیک ذخیره نشد");
  if(!grab(MAINOF[mainMode()]).includes("ckb on")) throw Error("دایرهٔ تیک‌خور رندر نشد");
});
step("پیش‌فرض باز شدن روی خانهٔ تقویم (v13)", ()=>{
  if(vm.runInContext("mode", sandbox)!=="cal") throw Error("mode پیش‌فرض cal نیست");
});

step("یادآور هر کار + هدر یِکا (v14)", ()=>{
  vm.runInContext("setMode('cal')", sandbox);
  const h = grab(MAINOF[mainMode()]);
  if(!h.includes("yh-big")) throw Error("هدر یِکا نیست");
  if(!h.includes("toggleRem")) throw Error("کلید یادآور هر کار نیست");
  const st = vm.runInContext("(function(){const dk=dkey(TODAY());const d=planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())];const kid=d.blocks.find(b=>b.kind==='kid');const wr=d.blocks.find(b=>b.kind!=='kid');return [remState(dk,kid),remState(dk,wr)];})()", sandbox);
  if(JSON.stringify(st)!=="[1,0]") throw Error("پیش‌فرض یادآور اشتباه: "+JSON.stringify(st));
  const id = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind==='kid')))", sandbox);
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  vm.runInContext("toggleRem('"+dk+"','"+id+"',1)", sandbox);
  const st2 = vm.runInContext("remState(dkey(TODAY()), planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind==='kid'))", sandbox);
  if(st2!==0) throw Error("سوییچ یادآور کار نکرد");
});

step("افزودن کار از خانهٔ موبایل (v15)", ()=>{
  vm.runInContext("setMode('cal')", sandbox);
  vm.runInContext("document.getElementById('exT').value='۹ تا ۱۰ تماس بانک'", sandbox);
  vm.runInContext("addExtra(dkey(TODAY()),'exT')", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("تماس بانک")) throw Error("اضافه نشد");
});
step("حذف/برگرداندن ردیف از خانهٔ موبایل (v15)", ()=>{
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  const bid = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.kind!=='kid'&&!b.nobusy)))", sandbox);
  vm.runInContext("toggleHide('"+dk+"','"+bid+"')", sandbox);
  if(!grab(MAINOF[mainMode()]).includes("↺")) throw Error("↺ نیست");
  vm.runInContext("toggleHide('"+dk+"','"+bid+"')", sandbox);
});

console.log(failures ? `\n═══ ${failures} خطا ═══` : "\n═══ موبایل سالم است ✓ ═══");
process.exit(failures?1:0);
