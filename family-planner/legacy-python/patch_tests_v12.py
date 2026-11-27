#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ارتقای تست‌ها برای v12: nodrv/varTime + قاعدهٔ پایتون + اعلان‌ها"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

def apply(path, reps):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    p.write_text(t, encoding="utf-8"); print(f"OK {path} — {len(reps)}")

CORE_ADD = '''console.log("— v12: nodrv و varTime —");
const FAMN = {selfName:"من", drivers:["من","خانمم"], kids:[
  {name:"خانمم", classes:[{title:"شنا", weekdays:[0], start:900, end:1080, travel:0, nodrv:true}]},
  {name:"پارسا", classes:[{title:"پایتون", weekdays:[5], start:900, end:990, varTime:true}]}],
  driverWeekly:["من","من","من","من","من","من","من"], driverByDate:{}, pickupMin:15, dropoffMin:15, blockSelf:true};
const planN12 = planWeek([], weekSat, {dayStart:480, dayEnd:1380, active:[0,1,2,3,4,5,6]}, FAMN);
eq("کلاس خانمم (travel:0): حتی با رانندهٔ من هیچ وظیفه‌ای ساخته نمی‌شود", planN12[0].blocks.filter(b=>b.kind==="duty").map(b=>[b.start,b.end]), []);
ok("nodrv در بلاک کلاس حفظ می‌شود", planN12[0].blocks.some(b=>b.kind==="kid"&&b.kid==="خانمم"&&b.nodrv===true));
ok("varTime در بلاک کلاس حفظ می‌شود (پایتون پنجشنبه)", planN12[5].blocks.some(b=>b.kind==="kid"&&b.varTime===true&&b.start===900&&b.end===990));

console.log("— شیفت کاری —");'''

apply(BASE/"test-core.js", [
    ("v12-core", 'console.log("— شیفت کاری —");', CORE_ADD, 1),
])

PY_STEP_DESK = '''step("پایتون پارسا: ساعت متغیر پنجشنبه از کادر درخواست", ()=>{
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

step("خروجی JSON", ()=>vm.runInContext("exportJSON()", sandbox));'''

apply(BASE/"test-ui.js", [
    ("py+notif", 'step("خروجی JSON", ()=>vm.runInContext("exportJSON()", sandbox));', PY_STEP_DESK, 1),
])

PY_STEP_MOB = '''step("پایتون پارسا: ساعت متغیر پنجشنبه از کادر درخواست", ()=>{
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

step("خروجی JSON", ()=>vm.runInContext("exportJSON()", sandbox));'''

apply(BASE/"test-ui-mobile.js", [
    ("py+notif", 'step("خروجی JSON", ()=>vm.runInContext("exportJSON()", sandbox));', PY_STEP_MOB, 1),
])
print("تست‌ها ارتقا یافت ✓")
