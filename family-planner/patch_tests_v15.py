#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تست‌های v15: خانهٔ دسکتاپ + جعبهٔ افزودن/حذف هر روز"""
from pathlib import Path
BASE = Path(__file__).resolve().parent

def apply(path, reps):
    p = Path(path); t = p.read_text(encoding="utf-8")
    for i,(name,old,new,cnt) in enumerate(reps):
        c = t.count(old)
        if c != cnt: raise SystemExit(f"[{path}] #{i} «{name}» تعداد {c} (انتظار {cnt})")
        t = t.replace(old, new)
    p.write_text(t, encoding="utf-8"); print(f"OK {path}")

DESK_FIRST_OLD = '''step("رندر اولیه: شبکهٔ هفته پر شده", ()=>{ if(!els.main.innerHTML.includes("daycard")) throw Error("grid خالی است"); });'''
DESK_FIRST_NEW = '''step("پیش‌فرض: خانهٔ تقویمی (v15)", ()=>{ if(!els.main.innerHTML.includes("yh-big") || !els.main.innerHTML.includes("ckrow")) throw Error("خانه نیست"); });
step("شبکهٔ هفته پس از سوییچ", ()=>{ vm.runInContext("setTab('week')", sandbox); if(!els.main.innerHTML.includes("daycard")) throw Error("grid خالی است"); });'''

DESK_V15 = '''step("جعبهٔ افزودن در کارت هفته (v15)", ()=>{ if(!els.main.innerHTML.includes("addrow") || !els.main.innerHTML.includes("exT_")) throw Error("جعبهٔ اضافه در کارت نیست"); });
step("خانهٔ دسکتاپ: تقویم + چک‌لیست + جعبه (v15)", ()=>{ vm.runInContext("setTab('cal')", sandbox); const h=els.main.innerHTML; if(!h.includes("yh-big")||!h.includes("addrow")) throw Error("خانهٔ دسکتاپ ناقص"); });
step("افزودن کار از خانه (v15)", ()=>{
  els.exT.value="۱۷ تا ۱۸ دکتر";
  vm.runInContext("addExtra(dkey(TODAY()),'exT')", sandbox);
  if(!els.main.innerHTML.includes("دکتر")) throw Error("کار اضافه نشد");
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
  vm.runInContext("const et=extraTaskOf(dkey(TODAY()),planWeek(tasks,satOf(TODAY()),settings,family,shiftCfg)[satIdx(TODAY())].blocks.find(b=>b.title==='دکتر')); if(!et) throw Error('پیدا نشد'); delExtraById(et.id)", sandbox);
  if(els.main.innerHTML.includes("دکتر")) throw Error("حذف نشد");
});

console.log(failures ?'''

MOB_V15 = '''step("افزودن کار از خانهٔ موبایل (v15)", ()=>{
  vm.runInContext("setMode('cal')", sandbox);
  els.exT.value="۹ تا ۱۰ تماس بانک";
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

console.log(failures ?'''

apply(BASE/"test-ui.js", [
    ("first", DESK_FIRST_OLD, DESK_FIRST_NEW, 1),
    ("v15", "console.log(failures ?", DESK_V15, 1),
])
apply(BASE/"test-ui-mobile.js", [
    ("v15", "console.log(failures ?", MOB_V15, 1),
])
print("تست‌های v15 اضافه شد ✓")
