// تاریخِ ثابت برای تست‌ها: شنبه ۲۸ نوامبر ۲۰۲۶ (۷ آذر ۱۴۰۵)
// چرا؟ بعضی تست‌های UI به فصلی از سال وابسته‌اند (بازهٔ کاری خانمم، کلاس‌های روز جاری).
// با این فایل همهٔ تست‌ها در هر روزی از سال نتیجهٔ یکسان می‌دهند:
//   node -r ./tests/fixed-date.js test-ui.js
const RealDate = Date;
const FIXED = new RealDate(2026, 10, 28, 10, 0, 0).getTime();
class FixedDate extends RealDate {
  constructor(...args){ if(args.length === 0) super(FIXED); else super(...args); }
  static now(){ return FIXED; }
}
globalThis.Date = FixedDate;
module.exports = { FIXED };
