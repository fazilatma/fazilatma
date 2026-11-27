#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تست‌های v13: تیک کار + خانهٔ یِکا"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

def apply(path, reps):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    p.write_text(t, encoding="utf-8"); print(f"OK {path}")

TICK_DESK = '''step("تیک زدن کار روز (v13)", ()=>{
  vm.runInContext("setTab('day')", sandbox);
  vm.runInContext("goDay(TODAY())", sandbox);
  const dk = vm.runInContext("dkey(TODAY())", sandbox);
  const bid = vm.runInContext("encodeURIComponent(blockId(planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks[0]))", sandbox);
  vm.runInContext("toggleDone('"+dk+"','"+bid+"')", sandbox);
  if(!vm.runInContext("isDone('"+dk+"', decodeURIComponent('"+bid+"'))", sandbox)) throw Error("تیک ذخیره نشد");
  if(!els.main.innerHTML.includes("ckb") || !els.main.innerHTML.includes("doneRow")) throw Error("نشان تیک در ردیف روز نیست");
  vm.runInContext("toggleDone('"+dk+"','"+bid+"')", sandbox);
  if(vm.runInContext("isDone('"+dk+"', decodeURIComponent('"+bid+"'))", sandbox)) throw Error("برداشتن تیک کار نکرد");
});

console.log(failures ?'''

TICK_MOB = '''step("خانهٔ یِکا: تقویم بالا + چک‌لیست روز (v13)", ()=>{
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

console.log(failures ?'''

apply(BASE/"test-ui.js", [("tick", 'console.log(failures ?', TICK_DESK, 1)])
apply(BASE/"test-ui-mobile.js", [("tick", 'console.log(failures ?', TICK_MOB, 1)])
print("تست‌های v13 اضافه شد ✓")
