(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,56722,e=>{"use strict";var t=e.i(19614);function i(e){return"number"==typeof e?Math.max(0,Math.round(e)):Math.max(0,Number(String(e||"").replace(/[۰-۹]/g,e=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(e))).replace(/[٠-٩]/g,e=>String("٠١٢٣٤٥٦٧٨٩".indexOf(e))).replace(/\D/g,""))||0)}function a(e){let t=i(e);return t?`${t.toLocaleString("fa-IR")} تومان`:"۰ تومان"}function r(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function s(e,t){return t?`<div class="spec-row"><span>${r(e)}</span><b>${r(t)}</b></div>`:""}e.s(["generateInvoiceHTML",0,e=>{var o;let l=(0,t.getCachedLiveContent)(),n=e.id||e.orderId||`INV-${Date.now()}`,d=e.date||new Date().toLocaleDateString("fa-IR"),p=e.sellerName||e.seller||"فروشنده OptiBid",c=e.buyerName||e.buyer||"خریدار OptiBid",b=e.product||e.title||"کالای مورد معامله",x=e.description||e.productDescription||"",g=e.category||"کالا / خدمات",m=Math.max(1,Number(e.quantity||1)||1),h=i(e.totalAmount??e.amount),f=i(e.unitAmount)||Math.round(h/m),u=i(e.platformFee),v=i(e.sellerAmount)||Math.max(0,h-u),y=i(e.taxAmount),w=i(e.shippingAmount),j=h+y+w,k=e.productSpecs||{},N=`https://optibid.fazilat-ma.workers.dev/verify/${encodeURIComponent(n)}`,z=k.brand||e.brand||"—",$=[k.exactModel,k.cpu,k.ram,k.storage].filter(Boolean).join(" · "),A=[s("برند",k.brand),s("مدل دقیق",k.exactModel),s("کد مدل / کانفیگ",k.serialOrConfig),s("پردازنده",k.cpu),s("رم",k.ram),s("حافظه",k.storage),s("گرافیک",k.gpu),s("نمایشگر",k.display),s("سال ساخت",k.manufactureYear),s("وضعیت کالا",k.productCondition),s("گارانتی",k.warrantyStatus),s("سلامت کلی قطعات",k.partsHealth),s("سلامت باتری",k.batteryHealthPercent?`${k.batteryHealthPercent}%`:""),s("گرید ظاهری",k.appearanceGrade),s("سابقه تعمیر",k.repairHistory),s("مهلت تست",k.testDeadlineDays?`${k.testDeadlineDays} روز`:"")].filter(Boolean).join("");return`<!DOCTYPE html>
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
          <div class="meta-row"><span>وضعیت / Status</span><b>${r({pending_payment:"در انتظار پرداخت",paid:"پرداخت‌شده و آماده ارسال",shipped:"ارسال‌شده",completed:"تکمیل‌شده",cancelled:"لغوشده",returned:"مرجوع‌شده"}[(o=e.status)||""]||o||"ثبت‌شده")}</b></div>
          <div class="meta-row"><span>اعتبار سند / Validity</span><b>15 Days</b></div>
        </div>
      </header>

      <section class="party-grid">
        <article class="party-card">
          <div class="section-title"><span>اطلاعات فروشنده</span><small>Seller Information</small></div>
          <div class="info-row"><span>نام فروشنده</span><b>${r(p)}</b></div>
          <div class="info-row"><span>آدرس</span><b>${r(l.invoiceCompanyAddressFa)}</b></div>
          <div class="info-row"><span>تلفن</span><b dir="ltr">021-12345678</b></div>
          <div class="info-row"><span>ایمیل</span><b dir="ltr">seller@optibid.ir</b></div>
          <div class="info-row"><span>شناسه مالیاتی</span><b dir="ltr">123456789012</b></div>
        </article>
        <article class="party-card">
          <div class="section-title"><span>اطلاعات خریدار</span><small>Customer Information</small></div>
          <div class="info-row"><span>نام خریدار</span><b>${r(c)}</b></div>
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
                <b>${r(b)}</b>
                ${$?`<small>${r($)}</small>`:""}
                ${x?`<div style="font-size:10px;color:#64748b;margin-top:5px">${r(x).slice(0,180)}</div>`:""}
                <div style="margin-top:7px"><span class="status-pill">🔒 پرداخت امانی / Escrow</span></div>
              </td>
              <td>${r("—"===z?g:z)}</td>
              <td><b>${m.toLocaleString("fa-IR")}</b></td>
              <td>${a(f)}</td>
              <td>${y?a(y):"۰٪"}</td>
              <td><b>${a(h)}</b></td>
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
          <div class="total-row"><span>جمع مبلغ کالا</span><b>${a(h)}</b></div>
          <div class="total-row"><span>مالیات / عوارض</span><b>${y?a(y):"۰ تومان"}</b></div>
          <div class="total-row"><span>هزینه حمل</span><b>${w?a(w):"طبق توافق / رایگان"}</b></div>
          <div class="total-row highlight"><span>جمع کل قابل پرداخت</span><b>${a(j)}</b></div>
          <div class="total-row"><span>کمیسیون پلتفرم</span><b>${a(u)}</b></div>
          <div class="total-row payable"><span>سهم خالص فروشنده پس از کمیسیون</span><b>${a(v)}</b></div>
        </article>
      </section>

      ${A?`<section class="specs"><h3>مشخصات کالای تاییدشده قبل از پرداخت</h3><div class="spec-grid">${A}</div>${k.returnPolicy?`<div style="margin-top:10px;border-radius:12px;background:#ecfdf5;padding:10px;font-size:11px;color:#166534"><b>شرایط مرجوعی:</b> ${r(k.returnPolicy)}</div>`:""}</section>`:""}

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
            <div class="qr"><img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(N)}" /></div>
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
</html>`}])},98585,e=>{"use strict";var t=e.i(43476),i=e.i(22016),a=e.i(71645),r=e.i(56722);e.s(["default",0,function(){let[e,s]=(0,a.useState)("all"),o=[{id:"ORD-1403-001",buyer:"شرکت فناوران نوین",product:"لپ‌تاپ استوک Lenovo ThinkPad T480 × 5 عدد",totalAmount:"۱۴۰,۰۰۰,۰۰۰ تومان",feeAmount:"۷,۰۰۰,۰۰۰ تومان (۵٪ کمیسیون)",sellerReceives:"۱۳۳,۰۰۰,۰۰۰ تومان",status:"delivered",statusLabel:"در انتظار تایید نهایی خریدار",statusColor:"bg-orange-100 text-orange-700",paidAt:"۱۴۰۳/۰۸/۱۵",needShipment:!1,canGetPaid:!0},{id:"ORD-1403-002",buyer:"رستوران سنتی بهارستان",product:"تجهیزات آشپزخانه صنعتی × ۱ ست",totalAmount:"۸۰,۰۰۰,۰۰۰ تومان",feeAmount:"۴,۰۰۰,۰۰۰ تومان",sellerReceives:"۷۶,۰۰۰,۰۰۰ تومان",status:"paid",statusLabel:"پرداخت شده - آماده ارسال",statusColor:"bg-blue-100 text-blue-700",paidAt:"۱۴۰۳/۰۸/۱۸",needShipment:!0,canGetPaid:!1},{id:"ORD-1403-003",buyer:"سارا احمدی",product:"آیپد پرو ۲۰۲۲ × ۱ عدد",totalAmount:"۴۲,۰۰۰,۰۰۰ تومان",feeAmount:"۲,۱۰۰,۰۰۰ تومان",sellerReceives:"۳۹,۹۰۰,۰۰۰ تومان",status:"completed",statusLabel:"تکمیل شده - مبلغ واریز شد",statusColor:"bg-green-100 text-green-700",paidAt:"۱۴۰۳/۰۷/۱۰",needShipment:!1,canGetPaid:!1}],l="all"===e?o:o.filter(t=>t.status===e);return(0,t.jsx)("div",{dir:"rtl",className:"min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto",children:[(0,t.jsxs)("div",{className:"mb-8",children:[(0,t.jsx)("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:"فروش‌های من"}),(0,t.jsx)("p",{className:"text-gray-600",children:"مدیریت معاملات، ارسال کالا و پیگیری تسویه حساب کمیسیون."})]}),(0,t.jsxs)("div",{className:"bg-gradient-to-l from-green-50 to-blue-50 border border-green-200 rounded-xl p-5 mb-6",children:[(0,t.jsx)("h3",{className:"font-bold text-green-800 mb-2",children:"🔒 نحوه تسویه حساب با فروشنده:"}),(0,t.jsxs)("ul",{className:"text-sm text-green-700 space-y-1 mr-5 list-disc",children:[(0,t.jsx)("li",{children:"وجه توسط خریدار به حساب امانی پلتفرم واریز می‌شود."}),(0,t.jsx)("li",{children:"شما کالا را ارسال کرده و کد رهگیری را ثبت می‌کنید."}),(0,t.jsx)("li",{children:"پس از تایید نهایی تحویل توسط خریدار، مبلغ نهایی (با کسر ۵٪ کمیسیون پلتفرم) به کیف پول شما واریز می‌گردد."})]})]}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2 mb-6 bg-white rounded-xl p-2 border border-gray-200",children:[{id:"all",label:"همه فروش‌ها"},{id:"paid",label:"پرداخت شده / در انتظار ارسال"},{id:"shipped",label:"ارسال شده"},{id:"delivered",label:"در انتظار تایید خریدار"},{id:"completed",label:"تکمیل شده (وجه واریز شده)"}].map(i=>(0,t.jsx)("button",{onClick:()=>s(i.id),className:`px-4 py-2 rounded-lg text-sm font-bold transition ${e===i.id?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-100"}`,children:i.label},i.id))}),(0,t.jsx)("div",{className:"space-y-4",children:0===l.length?(0,t.jsxs)("div",{className:"bg-white rounded-2xl p-16 text-center border border-gray-100",children:[(0,t.jsx)("div",{className:"text-5xl mb-4",children:"💼"}),(0,t.jsx)("h3",{className:"font-bold text-gray-800 mb-2",children:"هنوز فروشی در این بخش ندارید"}),(0,t.jsx)(i.default,{href:"/requests",className:"text-blue-600 font-bold hover:underline",children:"مشاهده درخواست‌های خرید جدید"})]}):l.map(e=>(0,t.jsxs)("div",{className:"bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",children:[(0,t.jsx)("div",{className:"bg-gray-50 p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3",children:(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[(0,t.jsx)("span",{className:"font-mono font-bold text-gray-800",dir:"ltr",children:e.id}),(0,t.jsx)("span",{className:`px-3 py-1 rounded-full text-xs font-bold ${e.statusColor}`,children:e.statusLabel}),(0,t.jsxs)("span",{className:"text-sm text-gray-500",children:["خریدار: ",e.buyer]})]})}),(0,t.jsxs)("div",{className:"p-5",children:[(0,t.jsx)("p",{className:"font-bold text-gray-800 mb-4",children:e.product}),(0,t.jsxs)("div",{className:"grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-gray-50 rounded-xl",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"text-gray-500 block",children:"مبلغ کل پرداختی خریدار:"}),(0,t.jsx)("span",{className:"font-bold text-green-700",children:e.totalAmount})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"text-gray-500 block",children:"کمیسیون پلتفرم (۵٪):"}),(0,t.jsx)("span",{className:"font-bold text-red-600 line-through",children:e.feeAmount})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"text-gray-500 block",children:"مبلغ قابل دریافت شما:"}),(0,t.jsx)("span",{className:"font-bold text-green-700 text-lg",children:e.sellerReceives})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"text-gray-500 block",children:"تاریخ پرداخت:"}),(0,t.jsx)("span",{className:"font-medium",children:e.paidAt})]})]}),(0,t.jsxs)("div",{className:"flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100",children:[(0,t.jsxs)("button",{onClick:()=>{let t=new Blob([(0,r.generateInvoiceHTML)({id:e.id,date:e.paidAt,totalAmount:e.totalAmount,sellerName:"شما",buyerName:e.buyer,product:e.product,status:e.status,sellerAmount:e.sellerReceives,platformFee:e.feeAmount})],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(t);window.open(i,"_blank")},className:"border border-[#00a8e8] text-[#00a8e8] px-5 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition text-center flex items-center justify-center gap-2",children:[(0,t.jsx)("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})}),"چاپ پیش‌فاکتور"]}),(0,t.jsx)(i.default,{href:"#",className:"border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition text-center",children:"جزئیات"}),e.needShipment&&(0,t.jsx)("button",{className:"bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition flex-1 sm:flex-none",children:"ثبت کد رهگیری و ارسال کالا"}),e.canGetPaid&&(0,t.jsx)("div",{className:"text-sm text-orange-700 bg-orange-50 px-4 py-2.5 rounded-lg flex-1 flex items-center justify-center",children:"پس از تایید نهایی خریدار، مبلغ به کیف پول شما واریز می‌شود."}),"completed"===e.status&&(0,t.jsxs)("button",{className:"bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold flex-1 sm:flex-none flex items-center justify-center gap-2",children:[(0,t.jsx)("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 13l4 4L19 7"})}),"مبلغ به کیف پول واریز شد"]})]})]})]},e.id))})]})})}])}]);