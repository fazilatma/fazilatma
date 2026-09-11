(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,12682,65816,e=>{"use strict";var t=e.i(43476);function a(e){if(!e?.storedName)return"";let t=e.id||e.storedName;return`/api/product-image?name=${encodeURIComponent(e.storedName)}&v=${encodeURIComponent(t)}`}function i({title:e,category:a,compact:r=!1}){let o=function(e,t=""){let a=`${e} ${t}`.toLowerCase();return/لپ|لب تاب|لپتاپ|laptop|notebook|thinkpad|vostro|latitude|dell|lenovo|asus|rog|hp|macbook|acer/.test(a)?"laptop":/موبایل|گوشی|mobile|phone|iphone|samsung|xiaomi|tablet|تبلت/.test(a)?"phone":/خودرو|ماشین|موتور|car|auto/.test(a)?"car":/کتاب|تحریر|book|stationery/.test(a)?"book":/پوشاک|لباس|کفش|مد|clothes|fashion/.test(a)?"clothes":/خانه|آشپزخانه|home|kitchen/.test(a)?"home":/زیبایی|سلامت|آرایشی|health|beauty/.test(a)?"health":/ورزش|سفر|sport|travel/.test(a)?"sport":/اسباب|کودک|toy|baby/.test(a)?"toy":/صنعتی|اداری|industrial|office/.test(a)?"industrial":/دیجیتال|digital|ssd|ram|cpu|gpu|monitor/.test(a)?"laptop":"generic"}(e,a),s={laptop:"تصویر لپ‌تاپ",phone:"تصویر موبایل",car:"تصویر خودرو",book:"تصویر کتاب",clothes:"تصویر پوشاک",home:"تصویر کالای خانه",health:"تصویر سلامت",sport:"تصویر ورزشی",toy:"تصویر کودک",industrial:"تصویر صنعتی",generic:"تصویر کالا"};return"laptop"===o?(0,t.jsxs)("div",{className:"relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100",children:[(0,t.jsx)("div",{className:"absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#003b5c] shadow-sm",children:"Laptop"}),(0,t.jsx)("div",{className:"absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#00a8e8]/15"}),(0,t.jsx)("div",{className:"absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#0b9c56]/15"}),(0,t.jsxs)("div",{className:`${r?"w-4/5":"w-3/4 max-w-64"}`,children:[(0,t.jsx)("div",{className:"rounded-t-2xl border-[6px] border-slate-700 bg-slate-900 p-1 shadow-2xl",children:(0,t.jsx)("div",{className:"aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-sky-300 via-indigo-300 to-emerald-200",children:(0,t.jsx)("div",{className:"h-full w-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.85),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.35),transparent_45%)]"})})}),(0,t.jsx)("div",{className:"mx-auto h-3 w-[92%] rounded-b-2xl bg-slate-300 shadow-lg"}),(0,t.jsx)("div",{className:"mx-auto mt-1 h-2 w-[62%] rounded-b-full bg-slate-400/70"})]}),!r&&(0,t.jsx)("div",{className:"absolute bottom-3 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm",children:s[o]})]}):(0,t.jsxs)("div",{className:"relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-200",children:[(0,t.jsx)("div",{className:"absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#00a8e8]/10"}),(0,t.jsx)("div",{className:"absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#0b9c56]/10"}),(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("div",{className:r?"text-3xl":"text-6xl",children:{laptop:"💻",phone:"📱",car:"🚗",book:"📚",clothes:"👕",home:"🏠",health:"💄",sport:"⚽",toy:"🧸",industrial:"🏭",generic:"🛍️"}[o]}),!r&&(0,t.jsx)("p",{className:"mt-3 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-gray-600 shadow-sm",children:s[o]})]})]})}e.s(["productImageUrl",0,a],65816),e.s(["ProductHeroImage",0,function({images:e,title:r,category:o,className:s="h-52 w-full"}){let l=e?.[0];return(0,t.jsx)("div",{className:`overflow-hidden bg-gray-100 ${s}`,children:l?(0,t.jsx)("img",{src:a(l),alt:`عکس محصول ${r}`,className:"h-full w-full object-cover transition duration-300 group-hover:scale-105",loading:"lazy"}):(0,t.jsx)(i,{title:r,category:o})})},"ProductImageStrip",0,function({images:e,title:i,label:r="عکس‌های محصول",emptyText:o}){return e&&0!==e.length?(0,t.jsxs)("div",{className:"mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4",children:[(0,t.jsxs)("div",{className:"mb-3 flex items-center justify-between gap-3",children:[(0,t.jsx)("h3",{className:"font-bold text-gray-900",children:r}),(0,t.jsxs)("span",{className:"rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500",children:[e.length.toLocaleString("fa-IR")," عکس"]})]}),(0,t.jsx)("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",children:e.map(e=>(0,t.jsxs)("a",{href:a(e),target:"_blank",rel:"noreferrer",className:"group overflow-hidden rounded-2xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",children:[(0,t.jsx)("div",{className:"aspect-square overflow-hidden bg-gray-100",children:(0,t.jsx)("img",{src:a(e),alt:`${i} - ${e.originalName}`,className:"h-full w-full object-cover transition duration-300 group-hover:scale-105",loading:"lazy"})}),(0,t.jsxs)("p",{className:"truncate px-3 py-2 text-xs text-gray-500",children:["seller"===e.uploadedByRole?"فروشنده":"buyer"===e.uploadedByRole?"خریدار":"محصول"," ","· ",e.originalName]})]},e.id||e.storedName))})]}):o?(0,t.jsx)("div",{className:"rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500",children:o}):null},"ProductThumb",0,function({images:e,title:r,category:o,className:s="h-20 w-20"}){let l=e?.[0];return(0,t.jsx)("div",{className:`shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${s}`,children:l?(0,t.jsx)("img",{src:a(l),alt:`عکس محصول ${r}`,className:"h-full w-full object-cover",loading:"lazy"}):(0,t.jsx)(i,{title:r,category:o,compact:!0})})}],12682)},11777,e=>{"use strict";var t=e.i(43476);let a={sm:"text-sm",md:"text-lg",lg:"text-2xl"};e.s(["default",0,function({score:e,size:i="md",showLabel:r=!0,light:o=!1,className:s=""}){let l=Math.max(0,Math.min(5,e/20)),n=Math.round(l);return(0,t.jsxs)("div",{className:`inline-flex items-center gap-1.5 ${s}`,"aria-label":`امتیاز ${l.toFixed(1)} از ۵`,children:[(0,t.jsx)("span",{className:`tracking-tight text-amber-400 ${a[i]}`,"aria-hidden":"true",children:Array.from({length:5},(e,t)=>t<n?"★":"☆").join("")}),r&&(0,t.jsxs)("span",{className:`font-bold ${o?"text-white":"text-[#003b5c]"}`,children:[l.toLocaleString("fa-IR",{minimumFractionDigits:1,maximumFractionDigits:1}),(0,t.jsx)("span",{className:`mr-0.5 text-xs font-normal ${o?"text-blue-100":"text-gray-500"}`,children:"از ۵"})]})]})}])},59411,e=>{"use strict";var t=e.i(43476),a=e.i(71645);let i={buyer:[["quality","کیفیت و سلامت کالا"],["match","تطابق کالا با پیشنهاد"],["shipping","سرعت و تعهد در ارسال"],["packaging","بسته‌بندی و تحویل"],["communication","پاسخ‌گویی و رفتار فروشنده"]],seller:[["clarity","شفافیت و دقت درخواست"],["cooperation","همکاری در فرایند معامله"],["communication","ارتباط و پاسخ‌گویی خریدار"],["receipt","سرعت بررسی و تایید دریافت"],["conduct","رفتار حرفه‌ای در معامله"]]};function r({value:e,onChange:a}){return(0,t.jsx)("div",{className:"flex gap-1",dir:"ltr",children:[1,2,3,4,5].map(i=>{let r=i<=e;return(0,t.jsx)("button",{type:"button",onClick:()=>a(i),className:`text-3xl transition hover:scale-110 ${r?"text-amber-400":"text-gray-300 hover:text-amber-300"}`,"aria-label":`${i} ستاره`,children:r?"★":"☆"},i)})})}e.s(["default",0,function({role:e,reviewerId:o,order:s,onSaved:l}){let n=i[e],[d,c]=(0,a.useState)(Object.fromEntries(n.map(([e])=>[e,0]))),[p,m]=(0,a.useState)(""),[g,b]=(0,a.useState)(!1),x=Object.values(d).filter(e=>e>0),h=x.length===n.length,f=h?Math.round(x.reduce((e,t)=>e+t,0)/x.length):0,u="buyer"===e?s.sellerName:s.buyerName,v=async()=>{if(!h)return void alert("لطفاً برای همه معیارهای نظرسنجی امتیاز ستاره‌ای ثبت کنید.");b(!0);try{let e=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:s.id,reviewerId:o,overall:f,scores:d,comment:p})}),t=await e.json();if(!t.success)throw Error(t.message);alert(t.message),await l()}catch(e){alert(e instanceof Error?e.message:"ثبت نظرسنجی ناموفق بود.")}finally{b(!1)}};return(0,t.jsxs)("article",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsxs)("div",{className:"mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("p",{className:"text-xs font-bold text-[#00a8e8]",children:["سفارش ",s.id]}),(0,t.jsxs)("h3",{className:"mt-1 text-lg font-bold text-[#003b5c]",children:["ارزیابی ",u]}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:s.title})]}),(0,t.jsxs)("div",{className:"rounded-xl bg-amber-50 px-4 py-2 text-center",children:[(0,t.jsxs)("p",{className:"text-2xl text-amber-400",children:["★".repeat(f),"☆".repeat(5-f)]}),(0,t.jsx)("p",{className:"text-xs font-bold text-amber-800",children:h?`امتیاز نهایی ${f} از ۵`:"هنوز امتیازی ثبت نشده"})]})]}),(0,t.jsx)("div",{className:"space-y-3 border-y border-gray-100 py-5",children:n.map(([e,a])=>(0,t.jsxs)("div",{className:"flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center",children:[(0,t.jsx)("span",{className:"text-sm font-bold text-gray-700",children:a}),(0,t.jsx)(r,{value:d[e],onChange:t=>c({...d,[e]:t})})]},e))}),(0,t.jsx)("label",{className:"mt-5 block text-sm font-bold text-gray-700",children:"توضیحات شما (اختیاری)"}),(0,t.jsx)("textarea",{value:p,onChange:e=>m(e.target.value),placeholder:"تجربه واقعی خود از این معامله را بنویسید...",className:"mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#00a8e8]"}),(0,t.jsx)("p",{className:"mt-2 text-xs leading-6 text-gray-500",children:"متن این بخش دقیقاً در قسمت «دیدگاه‌ها» صفحه طرف مقابل نمایش داده می‌شود."}),(0,t.jsx)("button",{type:"button",disabled:g||!h,onClick:v,className:"mt-4 rounded-xl bg-[#003b5c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d46] disabled:bg-gray-400",children:g?"در حال ثبت...":"ثبت نهایی امتیاز و نظر"})]})}])},56722,e=>{"use strict";var t=e.i(19614);function a(e){return"number"==typeof e?Math.max(0,Math.round(e)):Math.max(0,Number(String(e||"").replace(/[۰-۹]/g,e=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(e))).replace(/[٠-٩]/g,e=>String("٠١٢٣٤٥٦٧٨٩".indexOf(e))).replace(/\D/g,""))||0)}function i(e){let t=a(e);return t?`${t.toLocaleString("fa-IR")} تومان`:"۰ تومان"}function r(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function o(e,t){return t?`<div class="spec-row"><span>${r(e)}</span><b>${r(t)}</b></div>`:""}e.s(["generateInvoiceHTML",0,e=>{var s;let l=(0,t.getCachedLiveContent)(),n=e.id||e.orderId||`INV-${Date.now()}`,d=e.date||new Date().toLocaleDateString("fa-IR"),c=e.sellerName||e.seller||"فروشنده OptiBid",p=e.buyerName||e.buyer||"خریدار OptiBid",m=e.product||e.title||"کالای مورد معامله",g=e.description||e.productDescription||"",b=e.category||"کالا / خدمات",x=Math.max(1,Number(e.quantity||1)||1),h=a(e.totalAmount??e.amount),f=a(e.unitAmount)||Math.round(h/x),u=a(e.platformFee),v=a(e.sellerAmount)||Math.max(0,h-u),w=a(e.taxAmount),y=a(e.shippingAmount),j=h+w+y,N=e.productSpecs||{},k=`https://optibid.fazilat-ma.workers.dev/verify/${encodeURIComponent(n)}`,$=N.brand||e.brand||"—",z=[N.exactModel,N.cpu,N.ram,N.storage].filter(Boolean).join(" · "),S=[o("برند",N.brand),o("مدل دقیق",N.exactModel),o("کد مدل / کانفیگ",N.serialOrConfig),o("پردازنده",N.cpu),o("رم",N.ram),o("حافظه",N.storage),o("گرافیک",N.gpu),o("نمایشگر",N.display),o("سال ساخت",N.manufactureYear),o("وضعیت کالا",N.productCondition),o("گارانتی",N.warrantyStatus),o("سلامت کلی قطعات",N.partsHealth),o("سلامت باتری",N.batteryHealthPercent?`${N.batteryHealthPercent}%`:""),o("گرید ظاهری",N.appearanceGrade),o("سابقه تعمیر",N.repairHistory),o("مهلت تست",N.testDeadlineDays?`${N.testDeadlineDays} روز`:"")].filter(Boolean).join("");return`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>فاکتور رسمی معامله - ${r(n)}</title>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #eaf1f8;
      color: #0f172a;
      font-family: Vazirmatn, Tahoma, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      background: rgba(234, 241, 248, 0.9);
      backdrop-filter: blur(10px);
    }
    .toolbar button {
      border: 0;
      border-radius: 14px;
      padding: 10px 18px;
      background: #003b5c;
      color: white;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(0, 59, 92, 0.22);
    }
    .toolbar button.secondary { background: white; color: #003b5c; border: 1px solid #cbd5e1; }
    .sheet {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 22px auto 40px;
      overflow: hidden;
      border-radius: 24px;
      background: white;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
    }
    .content { position: relative; z-index: 2; padding: 16mm; }
    .watermark {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      opacity: 0.035;
      z-index: 1;
      pointer-events: none;
    }
    .watermark .mark { width: 75mm; height: 75mm; border: 18px solid #003b5c; border-radius: 28px; transform: rotate(45deg); }
    .header {
      display: grid;
      grid-template-columns: 1.2fr 1.1fr 1.2fr;
      gap: 18px;
      align-items: start;
      padding-bottom: 16px;
      border-bottom: 2px solid #dbe6ef;
    }
    .brandbox { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, #003b5c, #00a8e8);
      display: grid;
      place-items: center;
      color: white;
      font-size: 30px;
      font-weight: 900;
    }
    .brand-title { font-size: 30px; font-weight: 950; letter-spacing: -1px; color: #0f172a; direction: ltr; text-align: left; }
    .brand-title span { color: #00a8e8; }
    .tagline-fa { margin-top: 6px; color: #0f2740; font-weight: 800; }
    .tagline-en { margin-top: 4px; color: #64748b; font-size: 11px; direction: ltr; text-align: left; }
    .title { text-align: center; padding-top: 8px; }
    .title h1 { margin: 0; font-size: 29px; font-weight: 950; color: #0f172a; }
    .title .line { width: 70px; height: 4px; margin: 13px auto; border-radius: 99px; background: linear-gradient(90deg, #003b5c, #00a8e8); }
    .title h2 { margin: 0; direction: ltr; color: #003b5c; font-size: 18px; }
    .meta { justify-self: end; width: 100%; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; }
    .meta-row { display: grid; grid-template-columns: 1fr 1.1fr; border-bottom: 1px solid #e2e8f0; }
    .meta-row:last-child { border-bottom: 0; }
    .meta-row span { padding: 9px 12px; background: #f8fafc; color: #475569; font-size: 11px; }
    .meta-row b { padding: 9px 12px; color: #003b5c; direction: ltr; text-align: left; font-size: 12px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
    .party-card { border: 1px solid #e2e8f0; border-radius: 22px; padding: 16px; background: rgba(248, 250, 252, 0.7); }
    .section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; padding-bottom: 8px; border-bottom: 2px solid #00a8e8; color: #003b5c; font-weight: 950; }
    .section-title small { color: #64748b; direction: ltr; font-size: 11px; }
    .info-row { display: grid; grid-template-columns: 105px 1fr; gap: 10px; padding: 7px 0; font-size: 12px; line-height: 1.8; }
    .info-row span { color: #64748b; }
    .info-row b { color: #0f172a; font-weight: 800; }
    .items { margin-top: 20px; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: linear-gradient(135deg, #003b5c, #004f86); color: white; }
    th { padding: 12px 8px; font-size: 11px; border-left: 1px solid rgba(255,255,255,.14); vertical-align: middle; }
    th small { display: block; margin-top: 4px; direction: ltr; color: #bfeaff; font-size: 9px; }
    td { padding: 14px 9px; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; vertical-align: middle; }
    td.item { text-align: right; line-height: 1.9; }
    td.item b { display: block; color: #0f2740; font-size: 13px; }
    td.item small { display: block; color: #64748b; direction: ltr; text-align: left; }
    .status-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 900; }
    .summary-grid { display: grid; grid-template-columns: 1fr 0.95fr; gap: 18px; margin-top: 20px; align-items: start; }
    .notes, .totals, .specs { border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,.92); overflow: hidden; }
    .notes { padding: 16px; min-height: 145px; }
    .notes h3, .specs h3 { margin: 0 0 10px; color: #003b5c; font-size: 14px; }
    .notes ul { margin: 0; padding-right: 18px; color: #334155; font-size: 11px; line-height: 2.15; }
    .total-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e2e8f0; }
    .total-row:last-child { border-bottom: 0; }
    .total-row span, .total-row b { padding: 12px 14px; font-size: 12px; }
    .total-row span { background: #f8fafc; color: #334155; }
    .total-row b { text-align: left; direction: ltr; }
    .total-row.highlight { background: #003b5c; color: white; }
    .total-row.highlight span { background: transparent; color: white; }
    .total-row.highlight b { font-size: 16px; color: white; }
    .total-row.payable { background: linear-gradient(135deg, #003b5c, #0b9c56); color: white; }
    .total-row.payable span { background: transparent; color: white; font-weight: 900; }
    .total-row.payable b { color: white; font-size: 18px; }
    .specs { margin-top: 18px; padding: 16px; }
    .spec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .spec-row { border-radius: 12px; background: #f8fafc; padding: 8px 10px; min-height: 56px; }
    .spec-row span { display: block; color: #64748b; font-size: 10px; }
    .spec-row b { display: block; margin-top: 5px; color: #0f172a; font-size: 11px; line-height: 1.5; }
    .verification { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
    .box { border: 1px solid #e2e8f0; border-radius: 22px; padding: 16px; background: #fff; min-height: 125px; }
    .signature-wrap { display: flex; align-items: center; justify-content: space-around; margin-top: 14px; }
    .signature { width: 140px; height: 48px; border-bottom: 2px solid #94a3b8; color: #003b5c; font-family: cursive; font-size: 34px; transform: rotate(-8deg); }
    .stamp { width: 96px; height: 96px; border: 4px solid #003b5c; border-radius: 999px; display: grid; place-items: center; color: #003b5c; font-weight: 950; text-align: center; transform: rotate(-10deg); opacity: .82; }
    .verify-inner { display: grid; grid-template-columns: 1fr 105px; gap: 14px; align-items: center; }
    .qr { width: 105px; height: 105px; border: 1px solid #94a3b8; border-radius: 12px; padding: 6px; background: white; }
    .qr img { width: 100%; height: 100%; display: block; }
    .footer { position: absolute; bottom: 0; right: 0; left: 0; display: flex; justify-content: space-between; align-items: center; padding: 14px 16mm; background: #082848; color: white; font-size: 12px; z-index: 3; }
    .footer b { font-size: 20px; direction: ltr; }
    .print-spacer { height: 58px; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .sheet { margin: 0; border-radius: 0; box-shadow: none; width: 210mm; min-height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">چاپ / ذخیره PDF</button>
    <button class="secondary" onclick="window.close()">بستن</button>
  </div>

  <main class="sheet">
    <div class="watermark"><div class="mark"></div></div>
    <section class="content">
      <header class="header">
        <div>
          <div class="brandbox">
            <div class="logo">◇</div>
            <div>
              <div class="brand-title">Opti<span>Bid</span></div>
              <div class="tagline-fa">تامین هوشمند، معامله امن</div>
              <div class="tagline-en">Smart Sourcing. Secure Escrow.</div>
            </div>
          </div>
        </div>
        <div class="title">
          <h1>فاکتور رسمی معامله</h1>
          <div class="line"></div>
          <h2>Official Transaction Invoice</h2>
        </div>
        <div class="meta">
          <div class="meta-row"><span>شماره سند / Document No.</span><b>${r(n)}</b></div>
          <div class="meta-row"><span>تاریخ / Date</span><b>${r(d)}</b></div>
          <div class="meta-row"><span>وضعیت / Status</span><b>${r({pending_payment:"در انتظار پرداخت",paid:"پرداخت‌شده و آماده ارسال",shipped:"ارسال‌شده",completed:"تکمیل‌شده",cancelled:"لغوشده",returned:"مرجوع‌شده"}[(s=e.status)||""]||s||"ثبت‌شده")}</b></div>
          <div class="meta-row"><span>اعتبار سند / Validity</span><b>15 Days</b></div>
        </div>
      </header>

      <section class="party-grid">
        <article class="party-card">
          <div class="section-title"><span>اطلاعات فروشنده</span><small>Seller Information</small></div>
          <div class="info-row"><span>نام فروشنده</span><b>${r(c)}</b></div>
          <div class="info-row"><span>آدرس</span><b>${r(l.invoiceCompanyAddressFa)}</b></div>
          <div class="info-row"><span>تلفن</span><b dir="ltr">021-12345678</b></div>
          <div class="info-row"><span>ایمیل</span><b dir="ltr">seller@optibid.ir</b></div>
          <div class="info-row"><span>شناسه مالیاتی</span><b dir="ltr">123456789012</b></div>
        </article>
        <article class="party-card">
          <div class="section-title"><span>اطلاعات خریدار</span><small>Customer Information</small></div>
          <div class="info-row"><span>نام خریدار</span><b>${r(p)}</b></div>
          <div class="info-row"><span>آدرس تحویل</span><b>${r(e.shippingAddress||l.invoiceShippingAddressFa)}</b></div>
          <div class="info-row"><span>شماره سفارش</span><b dir="ltr">${r(n)}</b></div>
          <div class="info-row"><span>روش پرداخت</span><b>${r("wallet"===e.paymentMethod?"کیف پول":"zarinpal"===e.paymentMethod?"زرین‌پال":"gateway"===e.paymentMethod?"درگاه پرداخت آزمایشی":"پرداخت امانی OptiBid")}</b></div>
          <div class="info-row"><span>حساب امانی</span><b>وجه تا تایید دریافت نزد OptiBid امانت است</b></div>
        </article>
      </section>

      <section class="items">
        <table>
          <thead>
            <tr>
              <th style="width:46px">ردیف<small>No.</small></th>
              <th>نام کالا<small>Item Name</small></th>
              <th style="width:92px">دسته / برند<small>Brand</small></th>
              <th style="width:64px">تعداد<small>Qty</small></th>
              <th style="width:120px">قیمت واحد<small>Unit Price</small></th>
              <th style="width:84px">مالیات<small>Tax</small></th>
              <th style="width:130px">قیمت کل<small>Total</small></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td class="item">
                <b>${r(m)}</b>
                ${z?`<small>${r(z)}</small>`:""}
                ${g?`<div style="font-size:10px;color:#64748b;margin-top:5px">${r(g).slice(0,180)}</div>`:""}
                <div style="margin-top:7px"><span class="status-pill">🔒 پرداخت امانی / Escrow</span></div>
              </td>
              <td>${r("—"===$?b:$)}</td>
              <td><b>${x.toLocaleString("fa-IR")}</b></td>
              <td>${i(f)}</td>
              <td>${w?i(w):"۰٪"}</td>
              <td><b>${i(h)}</b></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="summary-grid">
        <article class="notes">
          <h3>توضیحات / Notes</h3>
          <ul>
            <li>این سند بر اساس سفارش واقعی ثبت‌شده در OptiBid صادر شده است.</li>
            <li>وجه معامله تا تایید دریافت کالا توسط خریدار در حساب امانی نگهداری می‌شود.</li>
            <li>فروشنده متعهد است کالا را مطابق مشخصات تاییدشده توسط خریدار ارسال کند.</li>
            <li>در صورت مغایرت مشخصات، فرآیند رسیدگی و مرجوعی مطابق قوانین پلتفرم انجام می‌شود.</li>
          </ul>
        </article>
        <article class="totals">
          <div class="total-row"><span>جمع مبلغ کالا</span><b>${i(h)}</b></div>
          <div class="total-row"><span>مالیات / عوارض</span><b>${w?i(w):"۰ تومان"}</b></div>
          <div class="total-row"><span>هزینه حمل</span><b>${y?i(y):"طبق توافق / رایگان"}</b></div>
          <div class="total-row highlight"><span>جمع کل قابل پرداخت</span><b>${i(j)}</b></div>
          <div class="total-row"><span>کمیسیون پلتفرم</span><b>${i(u)}</b></div>
          <div class="total-row payable"><span>سهم خالص فروشنده پس از کمیسیون</span><b>${i(v)}</b></div>
        </article>
      </section>

      ${S?`<section class="specs"><h3>مشخصات کالای تاییدشده قبل از پرداخت</h3><div class="spec-grid">${S}</div>${N.returnPolicy?`<div style="margin-top:10px;border-radius:12px;background:#ecfdf5;padding:10px;font-size:11px;color:#166534"><b>شرایط مرجوعی:</b> ${r(N.returnPolicy)}</div>`:""}</section>`:""}

      <section class="verification">
        <article class="box">
          <div class="section-title"><span>امضا و مهر</span><small>Signature & Stamp</small></div>
          <div class="signature-wrap">
            <div>
              <div class="signature">OptiBid</div>
              <div style="margin-top:8px;font-size:11px;text-align:center;color:#334155">مدیر فروش / Sales Manager</div>
            </div>
            <div class="stamp">OptiBid<br/>Verified</div>
          </div>
        </article>
        <article class="box">
          <div class="section-title"><span>تایید و اعتبارسنجی</span><small>Verification</small></div>
          <div class="verify-inner">
            <div style="font-size:11px;line-height:2;color:#334155">
              برای بررسی اعتبار این فاکتور، کد QR را اسکن کنید یا شماره سند را در سامانه وارد کنید.
              <div dir="ltr" style="margin-top:8px;color:#003b5c;font-weight:800">${r(n)}</div>
            </div>
            <div class="qr"><img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(k)}" /></div>
          </div>
        </article>
      </section>
      <div class="print-spacer"></div>
    </section>
    <footer class="footer">
      <span dir="ltr">☎ 021-12345678</span>
      <span dir="ltr">✉ info@optibid.ir</span>
      <span dir="ltr">🌐 optibid.fazilat-ma.workers.dev</span>
      <b>OptiBid</b>
    </footer>
  </main>
</body>
</html>`}])}]);