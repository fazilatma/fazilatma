module.exports=[98649,65893,a=>{"use strict";var b=a.i(87924);function c(a){if(!a?.storedName)return"";let b=a.id||a.storedName;return`/api/product-image?name=${encodeURIComponent(a.storedName)}&v=${encodeURIComponent(b)}`}a.s(["productImageUrl",0,c],65893),a.s(["ProductImageStrip",0,function({images:a,title:d,label:e="عکس‌های محصول",emptyText:f}){return a&&0!==a.length?(0,b.jsxs)("div",{className:"mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4",children:[(0,b.jsxs)("div",{className:"mb-3 flex items-center justify-between gap-3",children:[(0,b.jsx)("h3",{className:"font-bold text-gray-900",children:e}),(0,b.jsxs)("span",{className:"rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500",children:[a.length.toLocaleString("fa-IR")," عکس"]})]}),(0,b.jsx)("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",children:a.map(a=>(0,b.jsxs)("a",{href:c(a),target:"_blank",rel:"noreferrer",className:"group overflow-hidden rounded-2xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",children:[(0,b.jsx)("div",{className:"aspect-square overflow-hidden bg-gray-100",children:(0,b.jsx)("img",{src:c(a),alt:`${d} - ${a.originalName}`,className:"h-full w-full object-cover transition duration-300 group-hover:scale-105",loading:"lazy"})}),(0,b.jsxs)("p",{className:"truncate px-3 py-2 text-xs text-gray-500",children:["seller"===a.uploadedByRole?"فروشنده":"buyer"===a.uploadedByRole?"خریدار":"محصول"," ","· ",a.originalName]})]},a.id||a.storedName))})]}):f?(0,b.jsx)("div",{className:"rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500",children:f}):null},"ProductThumb",0,function({images:a,title:d,className:e="h-20 w-20"}){let f=a?.[0];return(0,b.jsx)("div",{className:`shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${e}`,children:f?(0,b.jsx)("img",{src:c(f),alt:`عکس محصول ${d}`,className:"h-full w-full object-cover",loading:"lazy"}):(0,b.jsx)("div",{className:"grid h-full w-full place-items-center bg-gradient-to-br from-gray-50 to-gray-200 text-2xl text-gray-400",children:"📦"})})}],98649)},38136,a=>{"use strict";var b=a.i(87924);let c={sm:"text-sm",md:"text-lg",lg:"text-2xl"};a.s(["default",0,function({score:a,size:d="md",showLabel:e=!0,light:f=!1,className:g=""}){let h=Math.max(0,Math.min(5,a/20)),i=Math.round(h);return(0,b.jsxs)("div",{className:`inline-flex items-center gap-1.5 ${g}`,"aria-label":`امتیاز ${h.toFixed(1)} از ۵`,children:[(0,b.jsx)("span",{className:`tracking-tight text-amber-400 ${c[d]}`,"aria-hidden":"true",children:Array.from({length:5},(a,b)=>b<i?"★":"☆").join("")}),e&&(0,b.jsxs)("span",{className:`font-bold ${f?"text-white":"text-[#003b5c]"}`,children:[h.toLocaleString("fa-IR",{minimumFractionDigits:1,maximumFractionDigits:1}),(0,b.jsx)("span",{className:`mr-0.5 text-xs font-normal ${f?"text-blue-100":"text-gray-500"}`,children:"از ۵"})]})]})}])},8826,a=>{"use strict";var b=a.i(87924),c=a.i(72131);let d={buyer:[["quality","کیفیت و سلامت کالا"],["match","تطابق کالا با پیشنهاد"],["shipping","سرعت و تعهد در ارسال"],["packaging","بسته‌بندی و تحویل"],["communication","پاسخ‌گویی و رفتار فروشنده"]],seller:[["clarity","شفافیت و دقت درخواست"],["cooperation","همکاری در فرایند معامله"],["communication","ارتباط و پاسخ‌گویی خریدار"],["receipt","سرعت بررسی و تایید دریافت"],["conduct","رفتار حرفه‌ای در معامله"]]};function e({value:a,onChange:c}){return(0,b.jsx)("div",{className:"flex gap-1",dir:"ltr",children:[1,2,3,4,5].map(d=>{let e=d<=a;return(0,b.jsx)("button",{type:"button",onClick:()=>c(d),className:`text-3xl transition hover:scale-110 ${e?"text-amber-400":"text-gray-300 hover:text-amber-300"}`,"aria-label":`${d} ستاره`,children:e?"★":"☆"},d)})})}a.s(["default",0,function({role:a,reviewerId:f,order:g,onSaved:h}){let i=d[a],[j,k]=(0,c.useState)(Object.fromEntries(i.map(([a])=>[a,0]))),[l,m]=(0,c.useState)(""),[n,o]=(0,c.useState)(!1),p=Object.values(j).filter(a=>a>0),q=p.length===i.length,r=q?Math.round(p.reduce((a,b)=>a+b,0)/p.length):0,s="buyer"===a?g.sellerName:g.buyerName,t=async()=>{if(!q)return void alert("لطفاً برای همه معیارهای نظرسنجی امتیاز ستاره‌ای ثبت کنید.");o(!0);try{let a=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:g.id,reviewerId:f,overall:r,scores:j,comment:l})}),b=await a.json();if(!b.success)throw Error(b.message);alert(b.message),await h()}catch(a){alert(a instanceof Error?a.message:"ثبت نظرسنجی ناموفق بود.")}finally{o(!1)}};return(0,b.jsxs)("article",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,b.jsxs)("div",{className:"mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center",children:[(0,b.jsxs)("div",{children:[(0,b.jsxs)("p",{className:"text-xs font-bold text-[#00a8e8]",children:["سفارش ",g.id]}),(0,b.jsxs)("h3",{className:"mt-1 text-lg font-bold text-[#003b5c]",children:["ارزیابی ",s]}),(0,b.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:g.title})]}),(0,b.jsxs)("div",{className:"rounded-xl bg-amber-50 px-4 py-2 text-center",children:[(0,b.jsxs)("p",{className:"text-2xl text-amber-400",children:["★".repeat(r),"☆".repeat(5-r)]}),(0,b.jsx)("p",{className:"text-xs font-bold text-amber-800",children:q?`امتیاز نهایی ${r} از ۵`:"هنوز امتیازی ثبت نشده"})]})]}),(0,b.jsx)("div",{className:"space-y-3 border-y border-gray-100 py-5",children:i.map(([a,c])=>(0,b.jsxs)("div",{className:"flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center",children:[(0,b.jsx)("span",{className:"text-sm font-bold text-gray-700",children:c}),(0,b.jsx)(e,{value:j[a],onChange:b=>k({...j,[a]:b})})]},a))}),(0,b.jsx)("label",{className:"mt-5 block text-sm font-bold text-gray-700",children:"توضیحات شما (اختیاری)"}),(0,b.jsx)("textarea",{value:l,onChange:a=>m(a.target.value),placeholder:"تجربه واقعی خود از این معامله را بنویسید...",className:"mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#00a8e8]"}),(0,b.jsx)("p",{className:"mt-2 text-xs leading-6 text-gray-500",children:"متن این بخش دقیقاً در قسمت «دیدگاه‌ها» صفحه طرف مقابل نمایش داده می‌شود."}),(0,b.jsx)("button",{type:"button",disabled:n||!q,onClick:t,className:"mt-4 rounded-xl bg-[#003b5c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d46] disabled:bg-gray-400",children:n?"در حال ثبت...":"ثبت نهایی امتیاز و نظر"})]})}])},73767,a=>{"use strict";var b=a.i(65365);function c(a){return"number"==typeof a?Math.max(0,Math.round(a)):Math.max(0,Number(String(a||"").replace(/[۰-۹]/g,a=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(a))).replace(/[٠-٩]/g,a=>String("٠١٢٣٤٥٦٧٨٩".indexOf(a))).replace(/\D/g,""))||0)}function d(a){let b=c(a);return b?`${b.toLocaleString("fa-IR")} تومان`:"۰ تومان"}function e(a){return String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function f(a,b){return b?`<div class="spec-row"><span>${e(a)}</span><b>${e(b)}</b></div>`:""}a.s(["generateInvoiceHTML",0,a=>{var g;let h=(0,b.getCachedLiveContent)(),i=a.id||a.orderId||`INV-${Date.now()}`,j=a.date||new Date().toLocaleDateString("fa-IR"),k=a.sellerName||a.seller||"فروشنده OptiBid",l=a.buyerName||a.buyer||"خریدار OptiBid",m=a.product||a.title||"کالای مورد معامله",n=a.description||a.productDescription||"",o=a.category||"کالا / خدمات",p=Math.max(1,Number(a.quantity||1)||1),q=c(a.totalAmount??a.amount),r=c(a.unitAmount)||Math.round(q/p),s=c(a.platformFee),t=c(a.sellerAmount)||Math.max(0,q-s),u=c(a.taxAmount),v=c(a.shippingAmount),w=q+u+v,x=a.productSpecs||{},y=`https://optibid.fazilat-ma.workers.dev/verify/${encodeURIComponent(i)}`,z=x.brand||a.brand||"—",A=[x.exactModel,x.cpu,x.ram,x.storage].filter(Boolean).join(" · "),B=[f("برند",x.brand),f("مدل دقیق",x.exactModel),f("کد مدل / کانفیگ",x.serialOrConfig),f("پردازنده",x.cpu),f("رم",x.ram),f("حافظه",x.storage),f("گرافیک",x.gpu),f("نمایشگر",x.display),f("سال ساخت",x.manufactureYear),f("وضعیت کالا",x.productCondition),f("گارانتی",x.warrantyStatus),f("سلامت کلی قطعات",x.partsHealth),f("سلامت باتری",x.batteryHealthPercent?`${x.batteryHealthPercent}%`:""),f("گرید ظاهری",x.appearanceGrade),f("سابقه تعمیر",x.repairHistory),f("مهلت تست",x.testDeadlineDays?`${x.testDeadlineDays} روز`:"")].filter(Boolean).join("");return`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>فاکتور رسمی معامله - ${e(i)}</title>
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
          <div class="meta-row"><span>شماره سند / Document No.</span><b>${e(i)}</b></div>
          <div class="meta-row"><span>تاریخ / Date</span><b>${e(j)}</b></div>
          <div class="meta-row"><span>وضعیت / Status</span><b>${e({pending_payment:"در انتظار پرداخت",paid:"پرداخت‌شده و آماده ارسال",shipped:"ارسال‌شده",completed:"تکمیل‌شده",cancelled:"لغوشده",returned:"مرجوع‌شده"}[(g=a.status)||""]||g||"ثبت‌شده")}</b></div>
          <div class="meta-row"><span>اعتبار سند / Validity</span><b>15 Days</b></div>
        </div>
      </header>

      <section class="party-grid">
        <article class="party-card">
          <div class="section-title"><span>اطلاعات فروشنده</span><small>Seller Information</small></div>
          <div class="info-row"><span>نام فروشنده</span><b>${e(k)}</b></div>
          <div class="info-row"><span>آدرس</span><b>${e(h.invoiceCompanyAddressFa)}</b></div>
          <div class="info-row"><span>تلفن</span><b dir="ltr">021-12345678</b></div>
          <div class="info-row"><span>ایمیل</span><b dir="ltr">seller@optibid.ir</b></div>
          <div class="info-row"><span>شناسه مالیاتی</span><b dir="ltr">123456789012</b></div>
        </article>
        <article class="party-card">
          <div class="section-title"><span>اطلاعات خریدار</span><small>Customer Information</small></div>
          <div class="info-row"><span>نام خریدار</span><b>${e(l)}</b></div>
          <div class="info-row"><span>آدرس تحویل</span><b>${e(a.shippingAddress||h.invoiceShippingAddressFa)}</b></div>
          <div class="info-row"><span>شماره سفارش</span><b dir="ltr">${e(i)}</b></div>
          <div class="info-row"><span>روش پرداخت</span><b>${e("wallet"===a.paymentMethod?"کیف پول":"gateway"===a.paymentMethod?"درگاه پرداخت":"پرداخت امانی OptiBid")}</b></div>
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
                <b>${e(m)}</b>
                ${A?`<small>${e(A)}</small>`:""}
                ${n?`<div style="font-size:10px;color:#64748b;margin-top:5px">${e(n).slice(0,180)}</div>`:""}
                <div style="margin-top:7px"><span class="status-pill">🔒 پرداخت امانی / Escrow</span></div>
              </td>
              <td>${e("—"===z?o:z)}</td>
              <td><b>${p.toLocaleString("fa-IR")}</b></td>
              <td>${d(r)}</td>
              <td>${u?d(u):"۰٪"}</td>
              <td><b>${d(q)}</b></td>
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
          <div class="total-row"><span>جمع مبلغ کالا</span><b>${d(q)}</b></div>
          <div class="total-row"><span>مالیات / عوارض</span><b>${u?d(u):"۰ تومان"}</b></div>
          <div class="total-row"><span>هزینه حمل</span><b>${v?d(v):"طبق توافق / رایگان"}</b></div>
          <div class="total-row highlight"><span>جمع کل قابل پرداخت</span><b>${d(w)}</b></div>
          <div class="total-row"><span>کمیسیون پلتفرم</span><b>${d(s)}</b></div>
          <div class="total-row payable"><span>سهم خالص فروشنده پس از کمیسیون</span><b>${d(t)}</b></div>
        </article>
      </section>

      ${B?`<section class="specs"><h3>مشخصات کالای تاییدشده قبل از پرداخت</h3><div class="spec-grid">${B}</div>${x.returnPolicy?`<div style="margin-top:10px;border-radius:12px;background:#ecfdf5;padding:10px;font-size:11px;color:#166534"><b>شرایط مرجوعی:</b> ${e(x.returnPolicy)}</div>`:""}</section>`:""}

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
              <div dir="ltr" style="margin-top:8px;color:#003b5c;font-weight:800">${e(i)}</div>
            </div>
            <div class="qr"><img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(y)}" /></div>
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
</html>`}])}];

//# sourceMappingURL=src_1g4z8kf._.js.map