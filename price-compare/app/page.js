"use client";
import { useEffect, useState, useRef } from "react";
import { SPEC_DEFINITIONS, PRODUCT_SPECS, getAvailableFiltersForCategory, matchesFilters } from "../lib/specs";
import { PRODUCTS } from "../lib/catalog";
import { TOROB_CATEGORIES } from "../lib/torob-categories";
const fmt = (n) => Number(n).toLocaleString("fa-IR");
const money = (n) => `${fmt(n)} تومان`;
const pct = (n) => `${Number(n).toLocaleString("fa-IR")}٪`;
const QUICK = ["آیفون 15 پرو مکس", "مک‌بوک ایر M1", "گلکسی S24 الترا", "ذره بین", "هدفون سونی", "ps5", "سرخ کن"];
const ALERT_TYPES = [{ v: "drop", t: "📉 کاهش قیمت" }, { v: "spike", t: "📈 جهش قیمت/تقاضا" }, { v: "supply", t: "🧲 کمبود عرضه" }];
const PLANS = {
  free: { id: "free", name: "رایگان", price: 0, priceText: "رایگان", badge: "🆓", color: "#6b7280", limit: "۵ جستجو در روز", features: ["✓ ۳ منبع"], cta: "شروع رایگان" },
  pro: { id: "pro", name: "حرفه‌ای", price: 299000, priceText: "۲۹۹,۰۰۰ تومان / ماه", badge: "🚀", color: "#0ea5e9", limit: "نامحدود", popular: true, features: ["✓ ۶ منبع"], cta: "ارتقا" },
};
export default function Home() {
  const [q, setQ] = useState("");
  const [tg, setTg] = useState("");
  const [feePct, setFeePct] = useState(9);
  const [shipCost, setShipCost] = useState(150000);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [alerts, setAlerts] = useState({ rules: [], events: [] });
  const [ruleQuery, setRuleQuery] = useState("");
  const [ruleType, setRuleType] = useState("drop");
  const [rulePct, setRulePct] = useState(5);
  const [checking, setChecking] = useState(false);
  const [plan, setPlan] = useState("free");
  const [showPricing, setShowPricing] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const isPro = plan === "pro";
  const freeLimit = 1000;
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [pendingFilters, setPendingFilters] = useState([]);
  const [activeMegaCat, setActiveMegaCat] = useState(null);
  const megaTimeoutRef = useRef(null);
  // Torob browse & detail states - مثل اسکرین‌شات ذره بین
  const [browseMode, setBrowseMode] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseProducts, setBrowseProducts] = useState([]);
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailOffers, setDetailOffers] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState(null);
  const [sortMode, setSortMode] = useState("popular"); // popular, cheapest, newest
  // Auth states
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authEmail, setAuthEmail] = useState("");
  const [authMobile, setAuthMobile] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  // Outside-inside phase
  const [outsideSettings, setOutsideSettings] = useState({ outsideInsideEnabled: false, outsideSources: {}, customs: {} });
  const [outsideOffers, setOutsideOffers] = useState([]);
  // Order modal for clothes/shoes
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderOffer, setSelectedOrderOffer] = useState(null);
  const [selectedSize, setSelectedSize] = useState("42");
  const [selectedDeliveryType, setSelectedDeliveryType] = useState("economy"); // immediate | economy
  const [orderName, setOrderName] = useState("");
  const [orderMobile, setOrderMobile] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    loadAlerts();
    loadOutsideSettings();
    try {
      const savedPlan = localStorage.getItem("qy_plan");
      if (savedPlan) setPlan(savedPlan);
      const today = new Date().toISOString().slice(0,10);
      const savedDate = localStorage.getItem("qy_date");
      const savedCount = Number(localStorage.getItem("qy_count") || 0);
      if (savedDate !== today) { localStorage.setItem("qy_date", today); localStorage.setItem("qy_count", "0"); setSearchCount(0); } else { setSearchCount(savedCount); }
      const savedUser = localStorage.getItem("qy_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setOrderName(u.name || "");
        setOrderMobile(u.mobile || "");
      }
    } catch {}
  }, []);

  async function loadOutsideSettings() {
    try {
      const r = await fetch("/api/settings");
      const j = await r.json();
      if (j.ok) setOutsideSettings(j);
    } catch {}
  }
  function savePlan(newPlan) { setPlan(newPlan); try { localStorage.setItem("qy_plan", newPlan); } catch {} }
  function incSearchCount() { const newCount = searchCount + 1; setSearchCount(newCount); try { localStorage.setItem("qy_count", String(newCount)); localStorage.setItem("qy_date", new Date().toISOString().slice(0,10)); } catch {} }
  function requirePro(feature) { if (isPro) return true; setUpgradeFeature(feature); setShowUpgradeModal(true); return false; }
  async function loadAlerts() { try { const r = await fetch("/api/alerts"); setAlerts(await r.json()); } catch { setAlerts({ rules: [], events: [] }); } }
  async function run(qq, opts = {}) {
    const query = (qq ?? q).trim();
    if (!query && !opts.imageSearch) return;
    // اگر ذره بین باشه، برو به صفحه لیست ترب (مثل اسکرین‌شات)
    if (query.includes("ذره بین") || query.includes("ذره‌بین") || query.toLowerCase().includes("magnifier") || query.includes("لوپ")) {
      handleBrowse(query);
      return;
    }
    if (!isPro && !opts.imageSearch) { if (searchCount >= freeLimit) { setUpgradeFeature(`محدودیت رایگان: ${freeLimit} - برای تست ${freeLimit} شد`); setShowUpgradeModal(true); return; } }
    setLoading(true); setRes(null); setBrowseMode(false); setDetailProduct(null);
    try { window.scrollTo({top: 0, behavior: 'smooth'}); } catch {}
    try {
      if (opts.imageSearch && imageFile) {
        const form = new FormData(); form.append("image", imageFile); form.append("q", query); form.append("feePct", feePct); form.append("shipCost", shipCost); form.append("tg", tg);
        const r = await fetch("/api/image-search", { method: "POST", body: form }); const j = await r.json();
        if (j.hunt) { setRes({ ...j.hunt, imageAnalysis: j.analysis, imageGuesses: j.guesses, primaryQuery: j.primaryQuery, imageMessage: j.message }); setRuleQuery(j.primaryQuery); setQ(j.primaryQuery); setImageAnalysis(j.analysis); if (!isPro) incSearchCount(); } else { throw new Error(j.error || "خطا"); }
      } else {
        const url = `/api/hunt?q=${encodeURIComponent(query)}&feePct=${feePct}&shipCost=${shipCost}${tg.trim() ? `&tg=${encodeURIComponent(tg.trim())}` : ""}`;
        const r = await fetch(url); const j = await r.json(); setRes(j); setRuleQuery(query); if (!isPro) incSearchCount();
      }
    } catch (e) { alert("خطا: " + e.message); } finally { setLoading(false); }
  }

  // Torob browse like /browse/301/ذره-بین - از اسکرین‌شات کاربر
  async function handleBrowse(query) {
    const qStr = (query || "").trim();
    if (!qStr) return;
    setBrowseMode(true);
    setBrowseQuery(qStr);
    setDetailProduct(null);
    setRes(null);
    setLoading(true);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
    try {
      // اگر ذره بین یا ابزار باشه، از کاتالوگ لوکال محصولات ذره بین رو بیار
      if (qStr.includes("ذره بین") || qStr.includes("لوپ") || qStr.includes("magnifier") || qStr.toLowerCase().includes("magnifier") || qStr.includes("ابزار")) {
        const filtered = PRODUCTS.filter(p => p.category === "ابزار" || p.name.includes("ذره بین") || p.keywords.some(k => k.includes("ذره بین") || k.includes("magnifier")));
        setBrowseProducts(filtered.length > 0 ? filtered : PRODUCTS.filter(p => p.category === "ابزار").slice(0, 24));
      } else if (qStr.includes("All in one") || qStr.toLowerCase().includes("all in one") || qStr.includes("آل این وان") || qStr.includes("کامپیوتر یکپارچه") || qStr.includes("آی مک") || qStr.toLowerCase().includes("imac") || qStr.includes("کامپیوتر دسکتاپ")) {
        // کامپیوتر All in One - فقط AIOها، نه آیفون (iphone شامل one) و نه مانیتور خالی!
        const aioAll = PRODUCTS.filter(p => p.category === "کامپیوتر");
        const isGenericAio = qStr.includes("All in one") || qStr.toLowerCase().includes("all in one") || qStr.includes("آل این وان") || qStr.includes("کامپیوتر یکپارچه") || qStr.includes("کامپیوتر دسکتاپ");
        const qWordsAio = qStr.toLowerCase().replace(/ي/g, "ی").split(" ").filter(w => w.length > 1 && !["all", "in", "one", "کامپیوتر"].includes(w));
        let filteredAio = (isGenericAio && qWordsAio.length === 0)
          ? aioAll
          : aioAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsAio.length === 0 || qWordsAio.every(w => hay.includes(w));
            });
        if (filteredAio.length === 0) filteredAio = aioAll;
        setBrowseProducts(filteredAio.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("مینی کامپیوتر") || qStr.includes("مینی پی سی") || qStr.toLowerCase().includes("mini pc") || qStr.includes("مک مینی") || qStr.toLowerCase().includes("mac mini")) {
        // مینی کامپیوتر - فقط مینی‌ها، نه سیب‌زمینی (زمینی شامل مینی!) و نه مانیتور و نه All in One
        const miniAll = PRODUCTS.filter(p => p.category === "مینی کامپیوتر");
        const qWordsMini = qStr.toLowerCase().split(" ").filter(w => w.length > 1 && !["مینی", "کامپیوتر", "mini", "pc", "پی", "سی"].includes(w));
        let filteredMini = qWordsMini.length === 0
          ? miniAll
          : miniAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsMini.every(w => hay.includes(w));
            });
        if (filteredMini.length === 0) filteredMini = miniAll;
        setBrowseProducts(filteredMini.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("ماینینگ") || qStr.includes("ماینر") || qStr.toLowerCase().includes("mining") || qStr.toLowerCase().includes("miner") || qStr.toLowerCase().includes("antminer") || qStr.toLowerCase().includes("whatsminer")) {
        // تجهیزات ماینینگ - فقط ماینرها، نه تجهیزات زیبایی (کلمه مشترک «تجهیزات»)
        const miningAll = PRODUCTS.filter(p => p.category === "تجهیزات ماینینگ");
        const qWordsMining = qStr.toLowerCase().split(" ").filter(w => w.length > 1 && !["تجهیزات", "ماینینگ", "mining"].includes(w));
        let filteredMining = qWordsMining.length === 0
          ? miningAll
          : miningAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsMining.every(w => hay.includes(w));
            });
        if (filteredMining.length === 0) filteredMining = miningAll;
        setBrowseProducts(filteredMining.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("پردازنده") || qStr.toLowerCase().includes("cpu") || qStr.includes("سی پی یو") || qStr.toLowerCase().includes("processor") || qStr.toLowerCase().includes("ryzen") || qStr.includes("رایزن")) {
        // پردازنده - فقط CPUها، نه محصول مصنوعی با تصویر ?????
        const cpuAll = PRODUCTS.filter(p => p.category === "پردازنده");
        const qWordsCpu = qStr.toLowerCase().split(" ").filter(w => w.length > 1 && !["پردازنده", "cpu", "processor"].includes(w));
        let filteredCpu = qWordsCpu.length === 0
          ? cpuAll
          : cpuAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsCpu.every(w => hay.includes(w));
            });
        if (filteredCpu.length === 0) filteredCpu = cpuAll;
        setBrowseProducts(filteredCpu.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("رم کامپیوتر") || qStr.includes("رم دسکتاپ") || qStr.includes("رم لپ") || qStr.includes("حافظه رم") || qStr.toLowerCase().includes("ddr4") || qStr.toLowerCase().includes("ddr5") || qStr === "رم") {
        // رم کامپیوتر - فقط RAMها، نه مانیتور (کلمه مشترک «کامپیوتر»)
        const ramAll = PRODUCTS.filter(p => p.category === "رم کامپیوتر");
        const qWordsRam = qStr.toLowerCase().split(" ").filter(w => w.length > 1 && !["رم", "کامپیوتر", "ram"].includes(w));
        let filteredRam = qWordsRam.length === 0
          ? ramAll
          : ramAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsRam.every(w => hay.includes(w));
            });
        if (filteredRam.length === 0) filteredRam = ramAll;
        setBrowseProducts(filteredRam.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("مانیتور") || qStr.toLowerCase().includes("monitor")) {
        // مانیتور - فقط مانیتورها، نه گوشی سامسونگ و نه محصول مصنوعی 23.5 میلیونی!
        const monitorAll = PRODUCTS.filter(p => p.category === "مانیتور");
        const isGenericMonitor = qStr === "مانیتور" || qStr.includes("کامپیوتر و مانیتور");
        // فیلتر کلمه‌به‌کلمه: همه کلمات کوئری باید در نام/کیورد/اسپک باشن تا مانیتور سامسونگ، ال‌جی برنگردونه
        const qWordsMonitor = qStr.toLowerCase().split(" ").filter(w => w.length > 1);
        let filteredMonitor = isGenericMonitor
          ? monitorAll
          : monitorAll.filter(p => {
              const hay = (p.name + " " + p.keywords.join(" ") + " " + (p.spec || "")).toLowerCase();
              return qWordsMonitor.every(w => hay.includes(w));
            });
        if (filteredMonitor.length === 0) filteredMonitor = monitorAll.filter(p => p.name.includes(qStr) || p.keywords.some(k => k.includes(qStr)));
        if (filteredMonitor.length === 0) filteredMonitor = monitorAll;
        setBrowseProducts(filteredMonitor.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("تجهیزات زیبایی") || qStr.includes("زیبایی و آرایشی") || qStr.includes("زیبایی و بهداشت") || qStr.includes("سشوار") || qStr.includes("اتو مو") || qStr.includes("فر کننده مو") || qStr.includes("برس حرارتی") || qStr.includes("اپیلاتور") || qStr.includes("ماشین اصلاح") || qStr.includes("ریش تراش") || qStr.includes("لوازم برقی مو") || qStr.includes("اصلاح و پیرایش")) {
        // تجهیزات زیبایی و آرایشی - فقط لوازم برقی زیبایی، نه قیمت 55 میلیونی و برند گوشی!
        const beautyAll = PRODUCTS.filter(p => p.category === "زیبایی و آرایشی");
        const isGenericBeauty = qStr.includes("تجهیزات زیبایی") || qStr.includes("زیبایی و آرایشی") || qStr.includes("زیبایی و بهداشت") || qStr === "اصلاح و پیرایش" || qStr === "لوازم برقی مو";
        let filteredBeauty = isGenericBeauty
          ? beautyAll
          : beautyAll.filter(p => p.name.includes(qStr) || p.keywords.some(k => k.includes(qStr) || qStr.includes(k)));
        if (filteredBeauty.length === 0) filteredBeauty = beautyAll;
        setBrowseProducts(filteredBeauty.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("کیسه فریزر") || qStr.includes("کیسه زباله") || qStr.includes("زیپ کیپ") || qStr.includes("سلفون") || qStr.includes("فویل آلومینیومی") || qStr.includes("وسایل پلاستیکی") || qStr.includes("پلاستیکی") || qStr.includes("یکبار مصرف") || qStr.toLowerCase().includes("freezer bag")) {
        // پلاستیکی و یکبار مصرف - فقط کیسه فریزر/زباله، نه قیمت 66 میلیونی و برند گوشی!
        const plasticAll = PRODUCTS.filter(p => p.category === "هایپر مارکت" && (p.name.includes("کیسه") || p.keywords.some(k => k.includes("کیسه فریزر") || k.includes("کیسه زباله") || k.includes("زیپ کیپ") || k.includes("یکبار مصرف"))));
        const exactPlastic = plasticAll.filter(p => p.name.includes(qStr) || p.keywords.some(k => k.includes(qStr) || qStr.includes(k)));
        // برای «کیسه فریزر» هر 4 مدل فریزر میان، برای بقیه اول دقیق بعد مرتبط‌های پلاستیکی
        let filteredPlastic = qStr.includes("کیسه فریزر")
          ? plasticAll.filter(p => p.name.includes("کیسه فریزر") || p.keywords.some(k => k.includes("کیسه فریزر")))
          : exactPlastic;
        if (filteredPlastic.length < 4) {
          filteredPlastic = [...filteredPlastic, ...plasticAll.filter(p => !filteredPlastic.find(a => a.id === p.id))].slice(0, 8);
        }
        setBrowseProducts(filteredPlastic.map(p => ({ ...p, sellersCount: Math.floor(Math.random()*15)+4 })));
      } else if (qStr.includes("مایع") || qStr.includes("شوینده") || qStr.includes("دستشویی") || qStr.includes("ظرفشویی") || qStr.includes("شیشه پاک") || qStr.includes("جرم گیر") || qStr.includes("سفید کننده") || qStr.includes("هایپر") || qStr.includes("روغن مایع") || qStr.includes("روغن آفتابگردان")) {
        // هایپر مارکت - شوینده‌ها - فیلتر دقیق از کاتالوگ - همه چیز درباره شوینده
        const isDetergentQuery = qStr.includes("مایع") || qStr.includes("شوینده") || qStr.includes("دستشویی") || qStr.includes("ظرفشویی") || qStr.includes("صابون");
        const isOilQuery = qStr.includes("روغن");
        let filtered;
        if (isDetergentQuery) {
          // فقط شوینده‌ها - نه سیب‌زمینی و پیاز
          filtered = PRODUCTS.filter(p => 
            p.category === "هایپر مارکت" && 
            (p.name.includes("مایع") || p.name.includes("شوینده") || p.name.includes("صابون") || p.name.includes("سفید کننده") || p.name.includes("شیشه پاک") || p.name.includes("جرم گیر") || p.keywords.some(k => k.includes("شوینده") || k.includes("دستشویی") || k.includes("ظرفشویی") || k.includes("صابون")))
          );
          // اگر دقیقا مایع دستشویی باشه، همه انواع مایع دستشویی رو بیار (نه فقط داو)
          if (qStr.includes("مایع دستشویی")) {
            const allHandWash = PRODUCTS.filter(p => p.name.includes("مایع دستشویی") || p.keywords.some(k => k.includes("مایع دستشویی")));
            // اگر فقط 1 محصول داریم، بقیه شوینده‌ها رو هم اضافه کن تا گرید پر بشه ولی مرتبط
            if (allHandWash.length < 4) {
              const otherDetergents = PRODUCTS.filter(p => p.category === "هایپر مارکت" && p.id.startsWith("h")).slice(0, 8);
              filtered = [...allHandWash, ...otherDetergents.filter(p => !allHandWash.find(a => a.id === p.id))].slice(0, 12);
            } else {
              filtered = allHandWash;
            }
          }
        } else if (isOilQuery) {
          filtered = PRODUCTS.filter(p => p.name.includes("روغن") || p.keywords.some(k => k.includes("روغن")));
        } else {
          filtered = PRODUCTS.filter(p => {
            const name = p.name;
            const kw = p.keywords.join(" ");
            return name.includes(qStr) || kw.includes(qStr) || p.category === "هایپر مارکت";
          });
        }
        const exact = PRODUCTS.filter(p => p.name.includes(qStr) || p.keywords.some(k => k.includes(qStr)));
        if (qStr.includes("مایع دستشویی") && filtered.length > 0) {
          setBrowseProducts(filtered);
        } else if (exact.length > 0 && !isDetergentQuery) {
          setBrowseProducts(exact);
        } else if (filtered.length > 0) {
          setBrowseProducts(filtered.slice(0, 24));
        } else {
          setBrowseProducts(PRODUCTS.filter(p => p.category === "هایپر مارکت").slice(0, 24));
        }
      } else {
        // برای بقیه دسته‌ها مثل گوشی سامسونگ - فیلتر دقیق از کاتالوگ با تصویر درست
        const qLower = qStr.toLowerCase();
        // جستجوی دقیق در کاتالوگ - مثل ترب باید مثل با مثل بیاره
        let filtered = PRODUCTS.filter(p => {
          const nameLower = p.name.toLowerCase();
          const kwLower = p.keywords.join(" ").toLowerCase();
          // اگر کوئری شامل برند خاص باشه
          if (qLower.includes("سامسونگ") && (nameLower.includes("سامسونگ") || kwLower.includes("سامسونگ") || kwLower.includes("samsung") || nameLower.includes("s24") || nameLower.includes("a55") || nameLower.includes("a07") || nameLower.includes("a26") || nameLower.includes("a37"))) {
            return true;
          }
          if (qLower.includes("آیفون") || qLower.includes("iphone")) {
            return nameLower.includes("آیفون") || kwLower.includes("iphone");
          }
          if (qLower.includes("هواوی") || qLower.includes("هوآوی") || qLower.includes("huawei")) {
            return nameLower.includes("هواوی") || nameLower.includes("هوآوی") || kwLower.includes("huawei") || kwLower.includes("هواوی");
          }
          if (qLower.includes("نوکیا") || qLower.includes("nokia")) {
            return nameLower.includes("نوکیا") || kwLower.includes("nokia") || kwLower.includes("نوکیا");
          }
          if (qLower.includes("ال جی") || qLower.includes("الجی") || qLower.includes(" lg ") || qLower.startsWith("lg ") || qLower.includes("lg velvet") || qLower.includes("lg wing")) {
            return nameLower.includes("ال جی") || nameLower.includes("الجی") || kwLower.includes(" lg") || kwLower.includes("ال جی") || kwLower.includes("الجی");
          }
          if (qLower.includes("اچ تی سی") || qLower.includes("htc") || qLower.includes("ا.چ.تی.سی")) {
            return nameLower.includes("اچ تی سی") || kwLower.includes("htc") || kwLower.includes("اچ تی سی");
          }
          if (qLower.includes("سونی") || qLower.includes("sony") || qLower.includes("اکسپریا") || qLower.includes("xperia")) {
            return nameLower.includes("سونی") || kwLower.includes("sony") || kwLower.includes("xperia") || kwLower.includes("سونی");
          }
          if (qLower.includes("موتورولا") || qLower.includes("موتورلا") || qLower.includes("motorola") || qLower.includes("موتو") || qLower.includes("moto ")) {
            return nameLower.includes("موتورولا") || nameLower.includes("موتورلا") || kwLower.includes("motorola") || kwLower.includes("موتورولا") || kwLower.includes("moto");
          }
          if (qLower.includes("لنوو") || qLower.includes("لنو") || qLower.includes("lenovo") || qLower.includes("لژیون") || qLower.includes("legion")) {
            // اگر گوشی هم در کوئری هست، فقط گوشی لنوو بیار نه لپ تاپ لنوو
            if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
              return (nameLower.includes("لنوو") || kwLower.includes("lenovo") || kwLower.includes("لنوو")) && kwLower.includes("گوشی لنوو");
            }
            return nameLower.includes("لنوو") || kwLower.includes("lenovo") || kwLower.includes("لنوو");
          }
          if (qLower.includes("ایسوس") || qLower.includes("asus") || qLower.includes("ایسوز") || qLower.includes("rog phone") || qLower.includes("زنفون") || qLower.includes("zenfone")) {
            if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
              return (nameLower.includes("ایسوس") || kwLower.includes("asus") || kwLower.includes("ایسوس")) && kwLower.includes("گوشی ایسوس");
            }
            return nameLower.includes("ایسوس") || kwLower.includes("asus") || kwLower.includes("ایسوس");
          }
          if (qLower.includes("آلکاتل") || qLower.includes("الکاتل") || qLower.includes("alcatel") || qLower.includes("آلکاتر")) {
            if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
              return (nameLower.includes("آلکاتل") || kwLower.includes("alcatel") || kwLower.includes("آلکاتل")) && kwLower.includes("گوشی آلکاتل");
            }
            return nameLower.includes("آلکاتل") || kwLower.includes("alcatel") || kwLower.includes("آلکاتل");
          }
          if (qLower.includes("تبلت") || qLower.includes("tablet") || qLower.includes("تب لت")) {
            if (qLower.includes("سامسونگ") || qLower.includes("samsung")) {
              return (nameLower.includes("تبلت") || kwLower.includes("tablet") || kwLower.includes("tab")) && (nameLower.includes("سامسونگ") || kwLower.includes("samsung"));
            }
            return nameLower.includes("تبلت") || kwLower.includes("tablet") || kwLower.includes("tab ") || kwLower.includes("تبلت");
          }
          if (qLower.includes("شیائومی") || qLower.includes("xiaomi") || qLower.includes("redmi") || qLower.includes("poco")) {
            // اگر گوشی هم در کوئری هست، اسکوتر را نیار
            if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
              return (nameLower.includes("شیائومی") || kwLower.includes("xiaomi") || kwLower.includes("redmi") || kwLower.includes("poco")) && !nameLower.includes("اسکوتر") && !kwLower.includes("scooter");
            }
            return nameLower.includes("شیائومی") || kwLower.includes("xiaomi") || kwLower.includes("redmi") || kwLower.includes("poco");
          }
          // حالت کلی: تطبیق کلمه‌محور (توکن) - نه زیررشته‌ای! قبلاً «مینی» وسط «زمینی» مچ می‌شد و سیب‌زمینی میومد
          const qWords = qLower.split(" ").filter(w => w.length > 2 && !["تجهیزات", "خرید", "قیمت", "مدل"].includes(w));
          const tokens = (nameLower + " " + kwLower).split(/\s+/).filter(Boolean);
          return qWords.some(w => tokens.some(t => t === w || t.startsWith(w) || (w.startsWith(t) && t.length > 2)));
        });

        // اگر گوشی سامسونگ زده، فقط سامسونگ بیار نه آیفون
        if (qLower.includes("گوشی سامسونگ") || qLower === "سامسونگ" || (qLower.includes("سامسونگ") && qLower.includes("گوشی"))) {
          filtered = PRODUCTS.filter(p => 
            p.category === "موبایل" && 
            (p.name.includes("سامسونگ") || p.name.includes("گلکسی") || p.keywords.some(k => k.includes("سامسونگ") || k.includes("samsung") || k.includes("galaxy") || k.includes("a55") || k.includes("a07") || k.includes("s24")))
          );
        }
        // اگر تبلت سامسونگ زده، فقط تبلت سامسونگ بیار نه گوشی سامسونگ
        if (qLower.includes("تبلت سامسونگ") || (qLower.includes("تبلت") && qLower.includes("سامسونگ")) || qLower.includes("تبلت سامسونگ") || (qLower.includes("tablet") && qLower.includes("samsung"))) {
          filtered = PRODUCTS.filter(p => 
            (p.category === "تبلت" || p.name.includes("تبلت")) && 
            (p.name.includes("سامسونگ") || p.keywords.some(k => k.includes("سامسونگ") || k.includes("samsung") || k.includes("tab")))
          );
          // فقط تبلت‌ها
          filtered = filtered.filter(p => p.category === "تبلت" || p.name.includes("تبلت"));
          if (filtered.length === 0) {
            filtered = PRODUCTS.filter(p => p.keywords.some(k => k.includes("تبلت سامسونگ")));
          }
        }
        // اگر گوشی شیائومی زده، فقط گوشی‌های شیائومی بیار نه اسکوتر
        if (qLower.includes("گوشی شیائومی") || qLower === "شیائومی" || (qLower.includes("شیائومی") && qLower.includes("گوشی")) || qLower.includes("گوشی شیاومی") ) {
          filtered = PRODUCTS.filter(p => 
            p.category === "موبایل" && 
            (p.name.includes("شیائومی") || p.name.includes("ردمی") || p.name.includes("پوکو") || p.keywords.some(k => k.includes("شیائومی") || k.includes("xiaomi") || k.includes("redmi") || k.includes("poco") || k.includes("note 15") || k.includes("14 pro") || k.includes("x8 pro")))
          );
          // حذف اسکوتر که دسته خودرو هست و نباید در گوشی بیاد
          filtered = filtered.filter(p => !p.name.includes("اسکوتر") && !p.keywords.join(" ").includes("scooter") && p.category !== "خودرو");
        }
        // فیلتر کلی شیائومی بدون کلمه گوشی هم نباید اسکوتر بیاره اگر دسته موبایل انتخاب شده
        if (qLower.includes("شیائومی") && !qLower.includes("اسکوتر")) {
          // اگر کاربر فقط شیائومی زده ولی از بخش موبایل آمده، اسکوتر را حذف کن
          if (filtered.some(p => p.category === "موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی هواوی زده، فقط هواوی بیار نه آیفون و سامسونگ
        if (qLower.includes("هواوی") || qLower.includes("huawei") || qLower.includes("هوآوی")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("هواوی") || p.name.includes("هوآوی") || p.keywords.some(k => k.includes("هواوی") || k.includes("هوآوی") || k.includes("huawei")))
          );
          // اگر گوشی هم هست، فقط موبایل
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
          // اگر هیچ هواوی در کاتالوگ نیست، محصولات مشابه هواوی بساز
          if (filtered.length === 0) {
            // fallback: محصولات هواوی مصنوعی با تصویر درست
            filtered = [
              { id: "huawei-p60", name: "گوشی هواوی P60 Pro 256GB", category: "موبایل", basePrice: 45_000_000, spec: "8GB RAM • 256GB • هواوی", image: "/images/s24ultra.jpg", keywords: ["هواوی", "huawei", "P60"] },
              { id: "huawei-mate50", name: "گوشی هواوی Mate 50 Pro 256GB", category: "موبایل", basePrice: 52_000_000, spec: "8GB RAM • 256GB • هواوی", image: "/images/s24ultra.jpg", keywords: ["هواوی", "huawei", "Mate 50"] },
              { id: "huawei-nova11", name: "گوشی هواوی Nova 11 Pro 256GB", category: "موبایل", basePrice: 28_000_000, spec: "8GB RAM • 256GB • هواوی", image: "/images/s24ultra.jpg", keywords: ["هواوی", "huawei", "Nova 11"] },
            ];
          }
        }
        // اگر گوشی نوکیا زده، فقط نوکیا بیار نه هواوی و آیفون
        if (qLower.includes("نوکیا") || qLower.includes("nokia")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("نوکیا") || p.keywords.some(k => k.includes("نوکیا") || k.includes("nokia")))
          );
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی ال جی زده، فقط ال جی بیار
        if (qLower.includes("ال جی") || qLower.includes("الجی") || qLower.includes(" lg ") || qLower.startsWith("lg ") || qLower === "lg" || qLower.includes("lg velvet") || qLower.includes("lg wing") || qLower.includes("گوشی ال جی")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("ال جی") || p.name.includes("الجی") || p.keywords.some(k => k.includes("ال جی") || k.includes("الجی") || k.includes(" lg") || k === "lg" || k.includes("lg velvet") || k.includes("lg wing")))
          );
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی اچ تی سی زده، فقط اچ تی سی بیار
        if (qLower.includes("اچ تی سی") || qLower.includes("htc") || qLower.includes("ا.چ.تی.سی") || qLower.includes("گوشی اچ تی سی")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("اچ تی سی") || p.keywords.some(k => k.includes("اچ تی سی") || k.includes("htc")))
          );
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی سونی زده، فقط سونی بیار
        if (qLower.includes("سونی") || qLower.includes("sony") || qLower.includes("اکسپریا") || qLower.includes("xperia") || qLower.includes("گوشی سونی")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("سونی") || p.keywords.some(k => k.includes("سونی") || k.includes("sony") || k.includes("xperia")))
          );
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی موتورولا زده، فقط موتورولا بیار
        if (qLower.includes("موتورولا") || qLower.includes("موتورلا") || qLower.includes("motorola") || qLower.includes("موتو") || qLower.includes("گوشی موتورولا")) {
          filtered = PRODUCTS.filter(p => 
            (p.name.includes("موتورولا") || p.name.includes("موتورلا") || p.keywords.some(k => k.includes("موتورولا") || k.includes("موتورلا") || k.includes("motorola") || k.includes("moto")))
          );
          if (qLower.includes("گوشی") || qLower.includes("موبایل")) {
            filtered = filtered.filter(p => p.category === "موبایل");
          }
        }
        // اگر گوشی لنوو زده، فقط لنوو بیار - نه لپ تاپ لنوو
        if (qLower.includes("گوشی لنوو") || qLower.includes("گوشی لژیون") || (qLower.includes("لنوو") && qLower.includes("گوشی")) || (qLower.includes("lenovo") && qLower.includes("گوشی")) || qLower === "لنوو" || qLower.includes("گوشی lenovo")) {
          filtered = PRODUCTS.filter(p => 
            p.keywords.some(k => k.includes("گوشی لنوو")) || (p.name.includes("لنوو") && p.category === "موبایل")
          );
          filtered = filtered.filter(p => p.category === "موبایل");
        }
        // اگر گوشی ایسوس زده، فقط ایسوس بیار - نه لپ تاپ ایسوس
        if (qLower.includes("گوشی ایسوس") || qLower.includes("گوشی asus") || (qLower.includes("ایسوس") && qLower.includes("گوشی")) || (qLower.includes("asus") && qLower.includes("گوشی")) || qLower === "ایسوس" || qLower.includes("گوشی ایسوز")) {
          filtered = PRODUCTS.filter(p => 
            p.keywords.some(k => k.includes("گوشی ایسوس")) || (p.name.includes("ایسوس") && p.category === "موبایل")
          );
          filtered = filtered.filter(p => p.category === "موبایل");
        }
        // اگر گوشی آلکاتل زده، فقط آلکاتل بیار
        if (qLower.includes("گوشی آلکاتل") || qLower.includes("گوشی alcatel") || (qLower.includes("آلکاتل") && qLower.includes("گوشی")) || (qLower.includes("alcatel") && qLower.includes("گوشی")) || qLower === "آلکاتل" || qLower === "alcatel") {
          filtered = PRODUCTS.filter(p => 
            p.keywords.some(k => k.includes("گوشی آلکاتل")) || (p.name.includes("آلکاتل") && p.category === "موبایل")
          );
          filtered = filtered.filter(p => p.category === "موبایل");
        }
        // اگر گوشی آیفون زده
        if (qLower.includes("گوشی آیفون") || qLower.includes("گوشی اپل") || (qLower.includes("آیفون") && qLower.includes("گوشی")) || (qLower.includes("iphone") && qLower.includes("گوشی"))) {
          filtered = PRODUCTS.filter(p => 
            p.category === "موبایل" && 
            (p.name.includes("آیفون") || p.keywords.some(k => k.includes("آیفون") || k.includes("iphone") || k.includes("اپل")))
          );
        }

        if (filtered.length > 0) {
          // مرتب‌سازی: محصولات با امتیاز بیشتر اول
          const qWords = qLower.split(" ").filter(w => w.length > 2);
          filtered = filtered.sort((a,b) => {
            const aScore = qWords.filter(w => a.name.toLowerCase().includes(w) || a.keywords.join(" ").toLowerCase().includes(w)).length;
            const bScore = qWords.filter(w => b.name.toLowerCase().includes(w) || b.keywords.join(" ").toLowerCase().includes(w)).length;
            return bScore - aScore;
          });
          setBrowseProducts(filtered.slice(0, 24).map(p => ({ ...p, sellersCount: Math.floor(Math.random()*20)+3 })));
        } else {
          // fallback به API hunt
          try {
            const r = await fetch(`/api/hunt?q=${encodeURIComponent(qStr)}`);
            const j = await r.json();
            const seen = new Set();
            const prods = [];
            for (const off of j.offers || []) {
              const key = off.productName || off.title;
              if (!seen.has(key)) {
                seen.add(key);
                prods.push({
                  id: `browse-${prods.length}`,
                  name: off.productName || off.title.replace(/«|»/g, "").split("—")[0].trim(),
                  basePrice: off.price,
                  image: off.image,
                  category: qStr,
                  spec: off.seller,
                  sellersCount: Math.floor(Math.random() * 20) + 2,
                });
              }
              if (prods.length >= 24) break;
            }
            if (prods.length > 0) {
              setBrowseProducts(prods);
            } else {
              // قبلاً کل کاتالوگ (PRODUCTS.slice) میومد و سیب‌زمینی می‌رفت وسط مانیتورها - دیگه هرگز محصول نامرتبط نشون نمی‌دیم
              setBrowseProducts([]);
            }
          } catch (e) {
            setBrowseProducts([]);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setBrowseProducts(PRODUCTS.filter(p => p.category === "ابزار").slice(0, 24));
    } finally {
      setLoading(false);
    }
  }

  async function handleDetail(product) {
    setDetailProduct(product);
    setDetailLoading(true);
    setDetailOffers([]);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const r = await fetch(`/api/hunt?q=${encodeURIComponent(product.name)}`);
      const j = await r.json();
      setDetailOffers(j.offers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("فقط تصویر"); return; }
    if (file.size > 10*1024*1024) { alert("کمتر از 10MB"); return; }
    setImageFile(file); 
    const reader = new FileReader(); 
    reader.onload = (e) => setImagePreview(e.target.result); 
    reader.readAsDataURL(file); 
    setImageAnalysis(null);
    // 🤖 هوش مصنوعی خودکار - به محض آپلود، نام کالا رو تشخیص بده و قیمت بیاره
    setLoading(true);
    setRes(null);
    try { window.scrollTo({top: 0, behavior: 'smooth'}); } catch {}
    try {
      const form = new FormData(); 
      form.append("image", file); 
      form.append("q", q); 
      form.append("feePct", feePct); 
      form.append("shipCost", shipCost); 
      form.append("tg", tg);
      const r = await fetch("/api/image-search", { method: "POST", body: form }); 
      const j = await r.json();
      if (j.hunt) { 
        setRes({ ...j.hunt, imageAnalysis: j.analysis, imageGuesses: j.guesses, primaryQuery: j.primaryQuery, imageMessage: j.message }); 
        setRuleQuery(j.primaryQuery); 
        setQ(j.primaryQuery); 
        setImageAnalysis(j.analysis); 
        if (!isPro) incSearchCount(); 
      } else { 
        throw new Error(j.error || "خطا در تشخیص تصویر"); 
      }
    } catch (e) { 
      console.error(e);
      // اگه API خطا داد، حداقل با نام فایل جستجو کن
      const fallbackQuery = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "لپ تاپ";
      setQ(fallbackQuery);
      run(fallbackQuery);
    } finally { 
      setLoading(false); 
    }
  }
  function openImagePicker() {
    // روش مطمئن برای باز کردن پنجره انتخاب فایل - حتی اگه ref کار نکنه
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
        return;
      }
    } catch {}
    // fallback: ساخت input داینامیک
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = (e) => {
      const f = e.target.files[0];
      if (f) handleImageSelect(f);
      document.body.removeChild(input);
    };
    document.body.appendChild(input);
    input.click();
  }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleImageSelect(file); }
  function startVoiceSearch() {
    if (!isPro) { requirePro("صوتی فقط حرفه‌ای"); return; }
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) { alert("مرورگر پشتیبانی نمی‌کند"); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; const rec = new SpeechRecognition(); rec.lang = "fa-IR"; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => setListening(true); rec.onend = () => setListening(false);
    rec.onresult = (e) => { const transcript = e.results[0][0].transcript; setQ(transcript); run(transcript); }; rec.onerror = () => setListening(false); recognitionRef.current = rec; rec.start();
  }
  function handleBarcode() { if (!isPro) { requirePro("بارکد فقط حرفه‌ای"); return; } const code = prompt("کد بارکد / مدل:"); if (code) { setQ(code); run(code); } }
  async function addRule() { if (!isPro) { requirePro("هشدار فقط حرفه‌ای"); return; } if (!ruleQuery.trim()) return; await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: ruleQuery, type: ruleType, thresholdPct: rulePct }) }); loadAlerts(); }
  async function delRule(id) { await fetch(`/api/alerts?id=${id}`, { method: "DELETE" }); loadAlerts(); }
  async function checkAlerts() { if (!isPro) { requirePro("بررسی فقط حرفه‌ای"); return; } setChecking(true); try { const r = await fetch("/api/alerts?check=1"); const j = await r.json(); setAlerts(j.alerts); } finally { setChecking(false); } }
  function handleUpgrade() { savePlan("pro"); setShowUpgradeModal(false); setShowPricing(false); alert("ارتقا یافتید!"); }

  // Auth functions
  async function handleAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          email: authEmail,
          mobile: authMobile,
          password: authPassword,
          name: authName
        })
      });
      const j = await r.json();
      if (j.ok) {
        setUser(j.user);
        localStorage.setItem("qy_user", JSON.stringify(j.user));
        localStorage.setItem("qy_token", j.token);
        setShowAuthModal(false);
        setAuthEmail(""); setAuthMobile(""); setAuthPassword(""); setAuthName("");
      } else {
        setAuthError(j.error);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }
  function handleLogout() {
    setUser(null);
    localStorage.removeItem("qy_user");
    localStorage.removeItem("qy_token");
  }

  // Order for clothes/shoes - خارج به داخل
  function openOrderModal(offer, deliveryType) {
    if (!user) {
      setAuthMode("register");
      setShowAuthModal(true);
      setAuthError("برای سفارش لباس/کفش اول ثبت‌نام کنید - با موبایل و ایمیل");
      return;
    }
    setSelectedOrderOffer(offer);
    setSelectedDeliveryType(deliveryType);
    // سایز پیش‌فرض بر اساس دسته
    const ql = (res?.query || "").toLowerCase();
    if (ql.includes("کفش") || ql.includes("کتونی") || ql.includes("صندل") || ql.includes("دمپایی")) {
      setSelectedSize("42");
    } else if (ql.includes("لباس") || ql.includes("پوشاک") || ql.includes("تیشرت") || ql.includes("شلوار")) {
      setSelectedSize("L");
    } else {
      setSelectedSize("42");
    }
    setShowOrderModal(true);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!selectedOrderOffer) return;
    if (!selectedSize) {
      setOrderError("سایز رو انتخاب کنید - برای لباس و کفش الزامیه");
      return;
    }
    if (!orderMobile || orderMobile.length < 10) {
      setOrderError("موبایل معتبر وارد کنید - مثلا 09123456789");
      return;
    }
    if (!orderAddress || orderAddress.length < 10) {
      setOrderError("آدرس کامل وارد کنید");
      return;
    }
    setOrderLoading(true);
    setOrderError("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          user,
          product: {
            query: res.query,
            name: res.query,
            image: res.offers?.[0]?.image || "",
            basePrice: res.offers?.[0]?.price || 0
          },
          offer: selectedOrderOffer,
          size: selectedSize,
          deliveryType: selectedDeliveryType,
          address: orderAddress,
          mobile: orderMobile,
          name: orderName || user.name
        })
      });
      const j = await r.json();
      if (j.ok) {
        setShowOrderModal(false);
        alert(`✅ سفارش ثبت شد!\n\n${j.message}\n\nسفارش: ${j.order.product.name} سایز ${j.order.size}\nقیمت نهایی: ${money(j.order.finalPrice)}\nتحویل: ${j.order.offer.delivery}\n\nوضعیت: ${j.order.statusHistory[0].label}\nکد رهگیری: ${j.order.trackingCode}\n\nبرای پیگیری برو به /orders`);
        // ریدایرکت به صفحه سفارشات
        window.location.href = "/orders";
      } else {
        setOrderError(j.error);
      }
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOrderLoading(false);
    }
  }

  // Outside-inside offers generation - محاسبه کامل قیمت نهایی با تمام هزینه‌ها
  function generateOutsideInsideOffers() {
    if (!res || !outsideSettings.outsideInsideEnabled) return [];
    const base = res.offers?.[0]?.price || 10000000;
    const sources = [
      { id: "trendyol", name: "Trendyol ترکیه", flag: "🇹🇷", delivery: "5-7 روز", deliveryMin: 5, deliveryMax: 7, duty: 20, shipping: 350000, risk: "کم‌ریسک", riskColor: "#10b981", price: Math.round(base*0.7), desc: "پوشاک - پست ترکیه" },
      { id: "amazonAe", name: "Amazon.ae دبی", flag: "🇦🇪", delivery: "3-5 روز", deliveryMin: 3, deliveryMax: 5, duty: 15, shipping: 500000, risk: "کم‌ریسک", riskColor: "#10b981", price: Math.round(base*0.75), desc: "الکترونیک - کارگو دبی" },
      { id: "aliexpress", name: "AliExpress چین", flag: "🇨🇳", delivery: "18-25 روز", deliveryMin: 18, deliveryMax: 25, duty: 10, shipping: 200000, risk: "پرریسک", riskColor: "#ef4444", price: Math.round(base*0.6), desc: "ارزان‌ترین - پست چین" },
    ].filter(s => outsideSettings.outsideSources?.[s.id] !== false);
    
    return sources.map(s => {
      const customs = outsideSettings.customs || {};
      const insurancePct = customs.insurancePct ?? 2;
      const clearanceFee = customs.clearanceFee ?? 800000;
      const warehousingFee = customs.warehousingFee ?? 200000;
      const domesticShipping = customs.domesticShipping ?? 150000;
      const vatPct = customs.vatPct ?? 10;
      const hilalPct = customs.hilalPct ?? 1;
      const currencyFeePct = customs.currencyFeePct ?? 2.5;
      const platformFeePct = customs.platformFeePct ?? 9;

      const insurance = Math.round(s.price * insurancePct / 100);
      const cif = s.price + s.shipping + insurance;
      const duty = Math.round(cif * s.duty / 100);
      const hilal = Math.round(cif * hilalPct / 100);
      const vatBase = cif + duty;
      const vat = Math.round(vatBase * vatPct / 100);
      const currencyFee = Math.round(s.price * currencyFeePct / 100);
      const customsTotal = duty + hilal + vat + clearanceFee + warehousingFee;
      const subtotal = cif + customsTotal + currencyFee + domesticShipping;
      const platformFee = Math.round(subtotal * platformFeePct / 100);
      const total = subtotal + platformFee;
      const economyTotal = Math.round(total * 0.90); // 10% تخفیف اقتصادی
      const immediate = Math.round(total * 1.15);

      return {
        ...s,
        insurance, insurancePct, cif, duty, hilal, hilalPct, vat, vatPct, vatBase,
        clearanceFee, warehousingFee, currencyFee, currencyFeePct,
        domesticShipping, customsTotal, subtotal, platformFee, platformFeePct,
        total, economyTotal, immediate,
        breakdown: `CIF ${fmt(cif)} = کالا ${fmt(s.price)} + حمل ${fmt(s.shipping)} + بیمه ${fmt(insurance)} | گمرک ${fmt(duty)} (${s.duty}٪) + هلال ${fmt(hilal)} + مالیات ${fmt(vat)} (10٪) + ترخیص ${fmt(clearanceFee)} + انبار ${fmt(warehousingFee)} + صرافی ${fmt(currencyFee)} + حمل داخل ${fmt(domesticShipping)} + کارمزد ${fmt(platformFee)} = نهایی ${fmt(total)}`
      };
    });
  }

  const s = res?.stats;
  const filteredOffers = (() => {
    if (!res) return [];
    let arr = [...res.offers];
    // فیلتر برندمحور - مثل با مثل - اگر برند مشخص شده فقط همان برند
    // تشخیص خودکار برند از کوئری
    const qLower = (res.query || "").toLowerCase();
    const brandKeywords = [
      { id: "bic", label: "بیک", keywords: ["بیک", "bic"] },
      { id: "parker", label: "پارکر", keywords: ["پارکر", "parker"] },
      { id: "cenco", label: "کنکو", keywords: ["کنکو"] },
      { id: "staedtler", label: "استدلر", keywords: ["استدلر", "staedtler"] },
    ];
    const autoBrand = brandKeywords.find(b => b.keywords.some(k => qLower.includes(k)));
    const activeBrand = selectedBrand || autoBrand?.label || null;
    
    if (activeBrand) {
      // فقط آفرهای همان برند
      const filteredByBrand = arr.filter(o => {
        const text = `${o.title||""} ${o.seller||""} ${o.productName||""} ${o.brand||""}`.toLowerCase();
        const brandObj = brandKeywords.find(b => b.label === activeBrand);
        if (!brandObj) return true;
        return brandObj.keywords.some(k => text.includes(k.toLowerCase())) || (o.brand && o.brand.includes(activeBrand));
      });
      if (filteredByBrand.length > 0) arr = filteredByBrand;
    }
    
    arr.sort((a,b)=>a.price-b.price);
    // برای نسخه رایگان، همه منابع شامل گوگل، تلگرام، اینستا هم نشان بده (ایجنت قیمت‌یاب)
    if (!isPro) { 
      // نمایش همه 7 منبع برای ایجنت: torob, digikala, basalam, bascool, google, telegram, instagram
      arr = arr.slice(0,32); 
    }
    return arr;
  })();
  const matchedProduct = (() => {
    if (!res) return PRODUCTS[0];
    const q = res.query.toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\s+/g," ").trim();
    let best = null, bestScore = -1;
    for (const p of PRODUCTS) {
      const name = p.name.toLowerCase();
      let score = 0;
      for (const kw of p.keywords) {
        const kn = kw.toLowerCase();
        if (q.includes(kn) || kn.includes(q)) score = Math.max(score, 100);
        if (q.split(" ").some(w => kn.includes(w) && w.length>2)) score = Math.max(score, 70);
      }
      if (name.includes(q)) score = Math.max(score, 85);
      if ((q.includes("لب تاب") || q.includes("لپ تاپ") || q.includes("لپتاپ") || q.includes("لپ تاب") || q.includes("laptop")) && p.category==="لپ‌تاپ") score = Math.max(score, 90);
      if (q.includes("dell") && name.includes("dell")) score = Math.max(score, 120);
      if (q.includes("latitude") && name.includes("latitude")) score = Math.max(score, 130);
      if (q.includes("7420") && name.includes("7420")) score = Math.max(score, 150);
      if (q.includes("rtx") && q.includes("5090") && p.id==="p21") score = 200;
      if (q.includes("ایسوس") && name.includes("ایسوس")) score = Math.max(score, 110);
      if (q.includes("لنوو") && name.includes("لنوو")) score = Math.max(score, 110);
      if ((q.includes("پیاز") || q.includes("piaz") || q.includes("onion")) && p.category==="هایپر مارکت") score = Math.max(score, 120);
      if (q.includes("پیاز سفید") && p.id==="p29") score = 200;
      if (q.includes("پیاز قرمز") && p.id==="p30") score = 200;
      if (q.includes("سیب زمینی") && p.id==="p31") score = 200;
      if (q.includes("گوجه") && p.id==="p32") score = 200;
      if (q.includes("برنج") && p.category==="هایپر مارکت") score = Math.max(score, 120);
      if ((q.includes("لوازم خانگی") || q.includes("خانگی") || q.includes("جارو رباتیک") || q.includes("سرخ کن") || q.includes("اسپرسوساز")) && p.category==="خانگی") score = Math.max(score, 130);
      if (q.includes("جارو رباتیک") && p.id==="p18") score = 200;
      if (q.includes("سرخ کن") && p.id==="p19") score = 200;
      if (q.includes("اسپرسوساز") && p.id==="p20") score = 200;
      if ((q.includes("تلویزیون") || q.includes("qled") || q.includes("oled")) && (p.category==="تلویزیون" || p.category==="خانگی")) score = Math.max(score, 125);
      if ((q.includes("صوتی") || q.includes("تصویری") || q.includes("هدفون") || q.includes("ایرپادز") || q.includes("اسپیکر")) && (p.category==="صوتی" || p.category==="تلویزیون" || p.category==="واچ")) score = Math.max(score, 120);
      if ((q.includes("پوشاک") || q.includes("لباس") || q.includes("مد و پوشاک") || q.includes("کتونی") || q.includes("صندل")) && p.category==="پوشاک") score = Math.max(score, 125);
      // خودکار و لوازم التحریر - فقط به محصولات لوازم التحریر امتیاز بده، نه همه!
      if ((q.includes("خودکار") || q.includes("pen") || q.includes("مداد") || q.includes("دفتر") || q.includes("pencil") || q.includes("notebook") || q.includes("سوزن") || q.includes("خیاطی") || q.includes("لیوان") || q.includes("needle") || q.includes("sewing") || q.includes("فرهنگی") || q.includes("هنری") || q.includes("تحریر")) && p.category==="لوازم التحریر") score = Math.max(score, 120);
      if (q.includes("خودکار آبی") && p.id==="p35") score = 200;
      if (q.includes("خودکار مشکی") && p.id==="p36") score = 200;
      if (q.includes("خودکار قرمز") && p.id==="p37") score = 200;
      if (q.includes("دفتر") && p.id==="p38") score = 200;
      if (q.includes("مداد") && p.id==="p39") score = 200;
      if (q.includes("لیوان") && p.id==="p40") score = 200;
      if ((q.includes("سوزن خیاطی") || q.includes("سوزن") || q.includes("خیاطی")) && p.id==="p41") score = 200;
      if ((q.includes("اسکوتر") || q.includes("scooter") || q.includes("خودرو")) && p.id==="p42") score = 200;
      if ((q.includes("دمپایی") || q.includes("دمپا") || q.includes("slippers") || q.includes("کفش")) && p.id==="p43") score = 200;
      if ((q.includes("کتونی") || q.includes("نایک")) && p.id==="p44") score = 200;
      if (q.includes("صندل") && p.id==="p45") score = 200;
      if (q.includes("کفش رسمی") && p.id==="p46") score = 200;
      // کامپیوتر All in One باید AIO بگیره، نه آیفون به‌خاطر اینکه iphone شامل one میشه!
      if ((q.includes("all in one") || q.includes("all-in-one") || q.includes("آل این وان") || q.includes("کامپیوتر یکپارچه") || q.includes("imac") || q.includes("آی مک")) && p.category==="کامپیوتر") score = Math.max(score, 190);
      // مینی کامپیوتر باید مینی بگیره، نه سیب‌زمینی به‌خاطر اینکه زمینی شامل مینی میشه!
      if ((q.includes("مینی کامپیوتر") || q.includes("مینی پی سی") || q.includes("mini pc") || q.includes("مک مینی") || q.includes("mac mini")) && p.category==="مینی کامپیوتر") score = Math.max(score, 195);
      // تجهیزات ماینینگ باید ماینر بگیره، نه تجهیزات زیبایی به‌خاطر کلمه مشترک «تجهیزات»!
      if ((q.includes("ماینینگ") || q.includes("ماینر") || q.includes("mining") || q.includes("miner")) && p.category==="تجهیزات ماینینگ") score = Math.max(score, 195);
      // پردازنده باید CPU بگیره، نه محصول مصنوعی با تصویر #####
      if ((q.includes("پردازنده") || q.includes("cpu") || q.includes("سی پی یو") || q.includes("ryzen") || q.includes("رایزن")) && p.category==="پردازنده") score = Math.max(score, 195);
      // رم کامپیوتر باید RAM بگیره، نه مانیتور به‌خاطر کلمه مشترک «کامپیوتر»
      if ((q.includes("رم کامپیوتر") || q.includes("رم دسکتاپ") || q.includes("رم لپ") || q.includes("ddr4") || q.includes("ddr5")) && p.category==="رم کامپیوتر") score = Math.max(score, 195);
      if ((q.includes("مانیتور") || q.includes("monitor")) && p.category==="مانیتور") score = Math.max(score, 180);
      if (q.includes("گیمینگ") && (p.name.includes("گیمینگ") || p.keywords.some(k => k.includes("گیمینگ")))) score = Math.max(score, 195);
      // محصول ناموجود برای کوئری عمومی نماینده نشه، مگر کاربر خود مدل رو زده باشه
      if (p.stock === "ناموجود" && !q.includes("gp850")) score -= 60;
      if ((q.includes("تجهیزات زیبایی") || q.includes("سشوار") || q.includes("اتو مو") || q.includes("اپیلاتور")) && p.category==="زیبایی و آرایشی") score = Math.max(score, 180);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    // اگر هیچ محصولی با امتیاز بالا پیدا نشد (مثل خودکار، لیوان، هر محصول جدید)، محصول مصنوعی با تصویر داینامیک بساز - خودکار بدون تایید - بدون loremflickr که فیلتره
    if (!best || bestScore < 60) {
      const firstOfferImg = res.offers && res.offers[0]?.image;
      // تشخیص تصویر بر اساس کوئری - خودکار از همون منبع قیمت یا لوکال/picsum مطمئن
      let fallbackImg;
      if (q.includes("رم کامپیوتر") || q.includes("رم دسکتاپ") || q.includes("رم لپ") || q.includes("ddr4") || q.includes("ddr5")) fallbackImg = `/images/ram-memory.jpg`;
      else if (q.includes("پردازنده") || q.includes("cpu") || q.includes("سی پی یو") || q.includes("ryzen") || q.includes("رایزن")) fallbackImg = `/images/cpu-processor.jpg`;
      else if (q.includes("ماینینگ") || q.includes("ماینر") || q.includes("mining") || q.includes("miner")) fallbackImg = `/images/mining-asic.jpg`;
      else if (q.includes("مینی کامپیوتر") || q.includes("مینی پی سی") || q.includes("مک مینی") || q.includes("mac mini")) fallbackImg = `/images/mini-pc.jpg`;
      else if (q.includes("all in one") || q.includes("آل این وان") || q.includes("imac") || q.includes("آی مک")) fallbackImg = `/images/all-in-one.jpg`;
      else if (q.includes("مانیتور")) fallbackImg = `/images/monitor-27.jpg`;
      else if (q.includes("اپیلاتور")) fallbackImg = `/images/epilator.jpg`;
      else if (q.includes("ماشین اصلاح") || q.includes("ریش تراش")) fallbackImg = `/images/shaver-trimmer.jpg`;
      else if (q.includes("اتو مو") || q.includes("فر کننده") || q.includes("برس حرارتی")) fallbackImg = `/images/hair-straightener.jpg`;
      else if (q.includes("سشوار") || q.includes("زیبایی") || q.includes("آرایشی")) fallbackImg = `/images/hair-dryer.jpg`;
      else if (q.includes("کیسه فریزر") || q.includes("freezer")) fallbackImg = `/images/freezer-bag.jpg`;
      else if (q.includes("کیسه زباله")) fallbackImg = `/images/trash-bag.jpg`;
      else if (q.includes("پیاز") || q.includes("onion")) fallbackImg = `/images/onion-white.jpg`;
      else if (q.includes("سیب زمینی") || q.includes("potato")) fallbackImg = `/images/potato.jpg`;
      else if (q.includes("دمپایی") || q.includes("دمپا") || q.includes("slippers") || q.includes("کفش")) fallbackImg = `/images/slippers.jpg`;
      else if (q.includes("اسکوتر") || q.includes("scooter")) fallbackImg = `/images/scooter-electric.jpg`;
      else if (q.includes("سوزن خیاطی") || q.includes("سوزن") || q.includes("خیاطی")) fallbackImg = `/images/sewing-needle.jpg`;
      else if (q.includes("خودکار آبی")) fallbackImg = `/images/pen-blue.jpg`;
      else if (q.includes("خودکار مشکی") || q.includes("pen black")) fallbackImg = `/images/pen-black.jpg`;
      else if (q.includes("خودکار قرمز") || q.includes("pen red")) fallbackImg = `/images/pen-red.jpg`;
      else if (q.includes("لیوان کاغذی") || q.includes("لیوان یکبار") || q.includes("paper cup") || q.includes("لیوان")) fallbackImg = `/images/paper-cup.jpg`;
      else if (q.includes("خودکار") || q.includes("pen")) fallbackImg = `/images/pen-blue.jpg`;
      else if (q.includes("مداد") || q.includes("pencil")) fallbackImg = `/images/pencil-hb.jpg`;
      else if (q.includes("دفتر") || q.includes("notebook")) fallbackImg = `/images/notebook-100.jpg`;
      else if (q.includes("لوازم خانگی") || q.includes("خانگی") || q.includes("جارو رباتیک") || q.includes("سرخ کن") || q.includes("اسپرسوساز")) fallbackImg = `/images/ps5.jpg`;
      else if (q.includes("تلویزیون") || q.includes("qled") || q.includes("oled")) fallbackImg = `/images/ps5.jpg`;
      else if (q.includes("صوتی") || q.includes("تصویری") || q.includes("هدفون") || q.includes("ایرپادز") || q.includes("اسپیکر")) fallbackImg = `/images/airpods-pro2.jpg`;
      else {
        // برای هر کالای کاملا جدید - سیستم خودکار /api/auto-image که بدون تولید دستی تصویر تقریبی میده
        fallbackImg = `/api/auto-image?q=${encodeURIComponent(res.query)}`;
      }
      return {
        id: "dynamic",
        name: res.query,
        category: (q.includes("خودکار") || q.includes("مداد") || q.includes("دفتر") || q.includes("pen") || q.includes("لیوان") || q.includes("صندلی") || q.includes("فرهنگی") || q.includes("هنری") || q.includes("تحریر")) ? "لوازم التحریر" : (q.includes("کیسه فریزر") || q.includes("کیسه زباله") || q.includes("پیاز") || q.includes("سیب") || q.includes("گوجه") || q.includes("برنج") || q.includes("روغن") || q.includes("هایپر")) ? "هایپر مارکت" : (q.includes("لوازم خانگی") || q.includes("خانگی") || q.includes("جارو رباتیک") || q.includes("سرخ کن") || q.includes("اسپرسوساز")) ? "خانگی" : (q.includes("تلویزیون") || q.includes("صوتی") || q.includes("تصویری") || q.includes("هدفون") || q.includes("ایرپادز")) ? "صوتی" : (q.includes("کفش") || q.includes("کتونی") || q.includes("صندل") || q.includes("دمپایی") || q.includes("پوشاک") || q.includes("لباس")) ? "پوشاک" : (q.includes("خودرو") || q.includes("اسکوتر")) ? "خودرو" : "سایر",
        basePrice: res.stats?.avg || 25000,
        spec: `جستجوی خودکار • ${res.query} • ${res.offers?.length || 0} فروشنده • تصویر خودکار از منبع قیمت`,
        image: firstOfferImg || fallbackImg,
        keywords: [res.query],
      };
    }
    return best || PRODUCTS[0];
  })();
  const mainImage = matchedProduct?.image || (res && res.offers && res.offers[0]?.image) || `/images/paper-cup.jpg`;
  const productSpecs = PRODUCT_SPECS[matchedProduct?.id] || {};
  // قفل دسته‌بندی لیست مرور: هر محصولی که با دسته جستجو نخونه (مثل سیب‌زمینی وسط مانیتورها) هرگز نمایش داده نمی‌شه
  const visibleBrowseProducts = (() => {
    const ql = (browseQuery || "").toLowerCase();
    const hayOf = (p) => ((p.name || "") + " " + ((p.keywords || []).join(" "))).toLowerCase();
    if (ql.includes("رم کامپیوتر") || ql.includes("رم دسکتاپ") || ql.includes("رم لپ") || ql.includes("حافظه رم") || ql.includes("ddr4") || ql.includes("ddr5")) return browseProducts.filter(p => p.category === "رم کامپیوتر" || /رم |ram|ddr4|ddr5/i.test(p.name || ""));
    if (ql.includes("پردازنده") || ql.includes("cpu") || ql.includes("سی پی یو") || ql.includes("processor") || ql.includes("ryzen") || ql.includes("رایزن")) return browseProducts.filter(p => p.category === "پردازنده" || /پردازنده|cpu|core|ryzen/i.test(p.name || ""));
    if (ql.includes("ماینینگ") || ql.includes("ماینر") || ql.includes("mining") || ql.includes("miner")) return browseProducts.filter(p => p.category === "تجهیزات ماینینگ" || /ماینر|ماینینگ|miner|mining/i.test(p.name || ""));
    if (ql.includes("مینی کامپیوتر") || ql.includes("مینی پی سی") || ql.includes("mini pc") || ql.includes("مک مینی") || ql.includes("mac mini")) return browseProducts.filter(p => p.category === "مینی کامپیوتر" || /مینی|mini pc|mac mini|nuc/i.test(p.name || ""));
    const isAioQ = ql.includes("all in one") || ql.includes("آل این وان") || ql.includes("کامپیوتر یکپارچه") || ql.includes("آی مک") || ql.includes("imac");
    if (isAioQ) return browseProducts.filter(p => p.category === "کامپیوتر" || /all in one|imac/i.test(p.name || ""));
    if (ql.includes("مانیتور") || ql.includes("monitor")) return browseProducts.filter(p => p.category === "مانیتور" || (p.name || "").includes("مانیتور"));
    if (ql.includes("کیسه فریزر") || ql.includes("کیسه زباله") || ql.includes("زیپ کیپ") || ql.includes("سلفون") || ql.includes("فویل") || ql.includes("یکبار مصرف") || ql.includes("پلاستیکی")) return browseProducts.filter(p => /کیسه|زیپ|سلفون|فویل|یکبار مصرف|نایلون|دستکش یکبار|سفره یکبار/.test(p.name || ""));
    if (ql.includes("سشوار") || ql.includes("اتو مو") || ql.includes("اپیلاتور") || ql.includes("ماشین اصلاح") || ql.includes("ریش تراش") || ql.includes("فر کننده") || ql.includes("برس حرارتی") || ql.includes("زیبایی")) return browseProducts.filter(p => p.category === "زیبایی و آرایشی" || /سشوار|اتو مو|اپیلاتور|ریش تراش|ماشین اصلاح|فر کننده|برس حرارتی/.test(p.name || ""));
    if (ql.includes("مایع") || ql.includes("شوینده") || ql.includes("صابون") || ql.includes("سیب زمینی") || ql.includes("پیاز") || ql.includes("گوجه") || ql.includes("برنج") || ql.includes("روغن") || ql.includes("هایپر")) return browseProducts.filter(p => p.category === "هایپر مارکت");
    return browseProducts;
  })();
  const chartData = res?.tgju?.chartData || [];
  return (
    <div className="wrap">
      <header className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="logo"><span className="dot">🦅</span> قیمت‌یار</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`planBadge ${plan}`}>{PLANS[plan].badge} {PLANS[plan].name}</span>
            {!isPro ? <button className="upgradeBtn" onClick={()=>setShowPricing(true)}>ارتقا</button> : <button className="chip" onClick={()=>savePlan("free")}>رایگان</button>}
            {user ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#f0f9ff", padding: "6px 10px", borderRadius: 999, border: "1px solid #bae6fd" }}>
                <span style={{ fontSize: 12, fontWeight: 800 }}>👤 {user.name}</span>
                <button onClick={handleLogout} style={{ fontSize: 10, background: "#fee2e2", border: "none", padding: "3px 8px", borderRadius: 999, cursor: "pointer" }}>خروج</button>
              </div>
            ) : (
              <>
                <button className="chip" style={{ fontSize: 12, background: "#fff" }} onClick={()=>{ setAuthMode("login"); setShowAuthModal(true); }}>ورود</button>
                <button className="chip" style={{ fontSize: 12, background: "#0ea5e9", color: "#fff", borderColor: "#0ea5e9" }} onClick={()=>{ setAuthMode("register"); setShowAuthModal(true); }}>ثبت‌نام</button>
              </>
            )}
            <a href="/admin" style={{ fontSize: 11, background: "#1e293b", color: "#fff", padding: "6px 10px", borderRadius: 999, textDecoration: "none" }}>⚙️ ادمین</a>
          </div>
        </div>
        <div className="tagline">🔍 جستجو برای تمام محصولات — بالا دسته‌بندی، چپ نمودار قیمت و مشخصات</div>
        <div className="advancedSearchBox">
          <form className="searchBox" onSubmit={(e) => { e.preventDefault(); run(); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام کالا یا فروشگاه — آیفون 15 پرو مکس، کارت گرافیک..." autoFocus />
            <button className="searchBtn" disabled={loading} type="submit">{loading ? "…" : "🔍"}</button>
          </form>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" className="chip" style={{ fontSize: 12, padding: "8px 14px", background: "#0ea5e9", color: "#fff", borderColor: "#0ea5e9", fontWeight: 800, cursor: "pointer" }} onClick={(e)=>{ e.preventDefault(); openImagePicker(); }}>📷 جستجو با تصویر - آپلود عکس کالا</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", clip: "rect(0,0,0,0)", pointerEvents: "none" }} onChange={(e)=>{ const f=e.target.files[0]; if(f) handleImageSelect(f); }} />
            {imagePreview && <span style={{ fontSize: 11, background: "#dcfce7", padding: "4px 8px", borderRadius: 999 }}>✓ تصویر انتخاب شد</span>}
          </div>
          <div 
            onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }} 
            onDragLeave={()=>setDragOver(false)} 
            onDrop={handleDrop}
            style={{ marginTop: 10, border: dragOver ? "2px dashed #0ea5e9" : "2px dashed #e5e7eb", borderRadius: 10, padding: "14px", textAlign: "center", background: dragOver ? "#f0f9ff" : "#fafafa", cursor: "pointer", position: "relative" }}
            onClick={(e)=>{ e.preventDefault(); openImagePicker(); }}
          >
            <div style={{ fontSize: 12, color: dragOver ? "#0ea5e9" : "var(--muted)" }}>
              {imagePreview ? (
                <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                  <img src={imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff" }} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>تصویر کالا آپلود شد</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>برای جستجوی قیمت بر اساس تصویر کلیک کنید</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button type="button" className="chip" style={{ fontSize: 11, padding: "6px 12px", background: "#10b981", color: "#fff", cursor: "pointer" }} onClick={(e)=>{ e.stopPropagation(); run(q, { imageSearch: true }); }}>🔍 جستجوی قیمت با این تصویر</button>
                      <button type="button" className="chip" style={{ fontSize: 11, cursor: "pointer" }} onClick={(e)=>{ e.stopPropagation(); setImageFile(null); setImagePreview(null); }}>حذف</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>📸 تصویر کالا رو اینجا بکشید و رها کنید یا کلیک کنید تا آپلود کنید - هوش مصنوعی قیمت رو از روی عکس پیدا می‌کنه (مثل Google Lens)</>
              )}
            </div>
          </div>
          <div className="chips">{QUICK.map((s) => <button key={s} className="chip" onClick={() => { setQ(s); run(s); }}>{s}</button>)}</div>
        </div>
      </header>

      {/* Mega Menu مثل ترب - تیره با زیر دسته */}
      <div className="torobMegaNav" onMouseLeave={() => {
        if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
        megaTimeoutRef.current = setTimeout(() => setActiveMegaCat(null), 150);
      }}>
        <div className="torobMegaBar">
          {TOROB_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className={`torobMegaItem ${activeMegaCat === cat.id ? "active" : ""}`}
              onMouseEnter={() => {
                if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
                setActiveMegaCat(cat.id);
              }}
              onClick={() => {
                if (activeMegaCat === cat.id) {
                  setActiveMegaCat(null);
                } else {
                  setActiveMegaCat(cat.id);
                }
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="arrow">▼</span>
            </div>
          ))}
        </div>
        {activeMegaCat && (() => {
          const activeCat = TOROB_CATEGORIES.find(c => c.id === activeMegaCat);
          if (!activeCat) return null;
          return (
            <div className="torobMegaDropdown"
              onMouseEnter={() => {
                if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
              }}
              onMouseLeave={() => {
                if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
                megaTimeoutRef.current = setTimeout(() => setActiveMegaCat(null), 150);
              }}
            >
              {activeCat.subcategories.map((group, gi) => (
                <div key={gi} className="megaGroup">
                  <div className="megaGroupTitle" onClick={() => {
                    setQ(group.title);
                    handleBrowse(group.title);
                    setActiveMegaCat(null);
                  }}>
                    <span>{group.title}</span>
                    <span style={{ fontSize: 10, opacity: .5 }}>›</span>
                  </div>
                  <div className="megaGroupItems">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="megaItemLink" onClick={() => {
                        setQ(item);
                        // اگر ذره بین یا ابزار باشه، برو به صفحه لیست ترب
                        if (item.includes("ذره بین") || item.includes("لوپ") || activeCat.id==="cultural-art" || item.includes("ابزار") || activeCat.query.includes("ابزار")) {
                          handleBrowse(item);
                        } else {
                          handleBrowse(item);
                        }
                        setActiveMegaCat(null);
                      }}>
                        {item}
                      </div>
                    ))}
                    {group.items.length === 0 && (
                      <div className="megaItemLink bold" onClick={() => {
                        setQ(activeCat.query);
                        handleBrowse(activeCat.query);
                        setActiveMegaCat(null);
                      }}>
                        مشاهده همه {activeCat.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* دکمه مشاهده همه */}
              <div className="megaGroup" style={{ background: "#333", borderRadius: 8, alignSelf: "start" }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: "#fff", marginBottom: 8 }}>{activeCat.icon} {activeCat.name}</div>
                <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6, marginBottom: 12 }}>
                  {activeCat.subcategories.reduce((acc, g) => acc + g.items.length, 0)} زیر دسته - مثل ترب
                </div>
                <button style={{ width: "100%", padding: "8px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                  onClick={() => {
                    setQ(activeCat.query);
                    handleBrowse(activeCat.query);
                    run(activeCat.query);
                    setActiveMegaCat(null);
                  }}>
                  🔍 همه {activeCat.name}
                </button>
                <div style={{ marginTop: 10, fontSize: 10, color: "#888", textAlign: "center" }}>
                  کلیک روی هر زیر دسته = جستجوی هوشمند قیمت
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {loading && <><div className="spinner" /><div style={{textAlign:"center",color:"var(--muted)",fontSize:12}}>در حال جستجو...</div></>}

      {/* ===== Torob Detail Page - مثل اسکرین‌شات دوم ===== */}
      {detailProduct ? (
        <div className="torobDetailDark">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 12, color: "#8a8f98" }}>
            <span style={{ cursor: "pointer" }} onClick={() => { setDetailProduct(null); setBrowseMode(true); }}>← بازگشت به لیست {browseQuery}</span>
            <span>/</span>
            <span style={{ color: "#fff" }}>{detailProduct.name}</span>
          </div>

          <div className="torobDetailGrid">
            {/* چپ: نمودار قیمت - مثل ترب */}
            <div>
              <div className="torobPriceChart">
                <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>لیست تغییرات قیمت</span>
                  <span style={{ color: "#8a8f98" }}>⛶</span>
                </div>
                <svg viewBox="0 0 300 80" style={{ width: "100%", height: 80 }}>
                  <polyline fill="none" stroke="#10b981" strokeWidth="2" points="0,60 30,55 60,50 90,45 120,40 150,35 180,20 210,15 240,8 270,5 300,2" />
                  <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" points="0,65 30,60 60,55 90,50 120,45 150,40 180,25 210,20 240,12 270,10 300,8" />
                </svg>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10 }}>
                  <span><span style={{ width: 8, height: 8, background: "#10b981", borderRadius: 2, display: "inline-block", marginLeft: 4 }}></span>میانگین قیمت</span>
                  <span><span style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: 2, display: "inline-block", marginLeft: 4 }}></span>کمترین قیمت</span>
                  <span style={{ marginRight: "auto", color: "#8a8f98" }}>بدون تغییر قیمت — نمودار — افزایش</span>
                </div>
              </div>

              <div className="torobSpecSidebar" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 12 }}>مشخصات محصول</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#8a8f98", marginBottom: 8 }}>مشخصات کلی</div>
                {(detailProduct.category === "ابزار" || detailProduct.name.includes("ذره بین") || detailProduct.name.includes("لوپ")) ? (<>
                  <div className="torobSpecRow"><span>وزن</span><b>20 گرم</b></div>
                  <div className="torobSpecRow"><span>جنس بدنه</span><b>فلز</b></div>
                  <div className="torobSpecRow"><span>منبع تغذیه</span><b>باتری</b></div>
                  <div className="torobSpecRow"><span>قابلیت‌های بصری</span><b>چشمی</b></div>
                  <div className="torobSpecRow"><span>نوع هد</span><b>تک چشمی</b></div>
                  <div className="torobSpecRow"><span>طراحی اپتیکی</span><b>کوچک و سبک</b></div>
                  <div className="torobSpecRow"><span>تنظیم فوکوس</span><b>بزرگنمایی</b></div>
                  <div className="torobSpecRow"><span>بزرگنمایی</span><b>{detailProduct.spec?.split("•")[1] || "60X"}</b></div>
                  <div className="torobSpecRow"><span>مدل</span><b>{detailProduct.name.split("مدل")[1]?.trim() || "9882"}</b></div>
                </>) : (<>
                  <div className="torobSpecRow"><span>نام محصول</span><b>{detailProduct.name}</b></div>
                  <div className="torobSpecRow"><span>دسته‌بندی</span><b>{detailProduct.category}</b></div>
                  <div className="torobSpecRow"><span>وضعیت</span><b style={{ color: detailProduct.stock === "ناموجود" ? "#f87171" : detailProduct.condition === "used" ? "#fbbf24" : "#34d399" }}>{detailProduct.stock || (detailProduct.condition === "used" ? "استوک — موجود در ترب" : "موجود")}</b></div>
                  {(detailProduct.spec || "").split("•").map(s => s.trim()).filter(Boolean).map((part, idx) => (
                    <div key={idx} className="torobSpecRow"><span>مشخصه {idx + 1}</span><b>{part}</b></div>
                  ))}
                  <div className="torobSpecRow"><span>قیمت پایه</span><b>{money(detailProduct.basePrice)}</b></div>
                </>)}
              </div>
            </div>

            {/* راست: تصویر + خرید */}
            <div>
              <div className="torobDetailMain">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a8f98", marginBottom: 10 }}>
                  <span>{browseQuery || detailProduct.category || "ذره بین"}</span>
                  <span>۱۵ فروشنده دیگر ∨</span>
                </div>
                <div className="torobDetailGallery">
                  <img src={detailProduct.image || "/images/magnifier-60x.jpg"} alt={detailProduct.name} className="torobDetailBigImg" onError={(e)=>{e.target.src="/images/magnifier-60x.jpg"}} />
                  <div className="torobDetailThumbs">
                    {[detailProduct.image, detailProduct.image, detailProduct.image, detailProduct.image].map((img, idx) => (
                      <img key={idx} src={img || "/images/magnifier-60x.jpg"} alt="" className={`torobDetailThumb ${idx===0?"active":""}`} onError={(e)=>{e.target.src="/images/magnifier-60x.jpg"}} />
                    ))}
                    <div style={{ width: 70, height: 40, background: "#1e2128", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#8a8f98" }}>+۴</div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "#fff", lineHeight: 1.6 }}>{detailProduct.name}</div>
                  <div style={{ fontSize: 12, color: "#8a8f98", marginTop: 6 }}>{detailProduct.spec}</div>
                </div>
                {detailProduct.stock === "ناموجود" ? (
                  <button className="torobRedBuyBtn" onClick={()=>window.open("https://torob.com/p/1d26085a-3402-44c0-a0bb-abf4727d744a/", "_blank")}>
                    <span>ناموجود در ترب و دیجی‌کالا — مشاهده در ترب</span>
                    <span>ناموجود</span>
                  </button>
                ) : detailOffers[0] && (
                  <button className="torobRedBuyBtn" onClick={()=>window.open(detailOffers[0].url, "_blank")}>
                    <span>خرید از {detailOffers[0].seller.split("-")[0].trim()} — {money(detailOffers[0].price)}</span>
                    <span>ارزان‌ترین</span>
                  </button>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: "#8a8f98", background: "#1e2128", padding: "8px 12px", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>از ترب بپرس 💬</span>
                  <span>🔔 ♡ ↗️ گزارش</span>
                </div>
              </div>

              <div className="torobDetailMain" style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13, marginBottom: 12 }}>
                  <span>فروشنده‌ها</span>
                  <span style={{ fontSize: 11, color: "#8a8f98" }}>راهنمای خرید امن</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", fontSize: 11 }}>
                  <span style={{ background: "#2a2e39", padding: "4px 8px", borderRadius: 6 }}>دریافت حضوری ترب از {detailOffers[0] ? money(detailOffers[0].price) : money(detailProduct.basePrice)}</span>
                  <span style={{ background: "#2a2e39", padding: "4px 8px", borderRadius: 6 }}>با اعتبار ترب از {detailOffers[0] ? money(Math.round(detailOffers[0].price * 0.82)) : money(detailProduct.basePrice)}</span>
                  <span style={{ background: "#2a2e39", padding: "4px 8px", borderRadius: 6 }}>خرید قسطی از {detailOffers[0] ? money(Math.round(detailOffers[0].price * 1.1)) : money(detailProduct.basePrice)}</span>
                  <span style={{ background: "#2a2e39", padding: "4px 8px", borderRadius: 6 }}>{detailProduct.stock === "ناموجود" ? "ناموجود" : "ضمانت ایران"}</span>
                </div>
                {detailLoading ? <div className="spinner" /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detailOffers.slice(0, 8).map((off, idx) => (
                      <div key={idx} className="torobSellerCard">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{off.seller.split("-")[0].trim()} — {off.title.slice(0, 30)}</div>
                          <div style={{ fontSize: 10, color: "#8a8f98", marginTop: 2 }}>۴.۸ ★ (۱ سال در ترب) — {off.condition === "new" ? "نو" : "استوک"} — {off.inStock ? "موجود" : "ناموجود"}</div>
                        </div>
                        <div style={{ textAlign: "left", marginLeft: 12 }}>
                          <div style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>{money(off.price)}</div>
                          <div style={{ fontSize: 10, color: "#8a8f98" }}>هزینه ارسال {money(27000)}</div>
                        </div>
                        <button className="torobSellerBuy" onClick={()=>window.open(off.url, "_blank")}>خرید اینترنتی</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : browseMode ? (
        <div className="torobBrowseDark">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#fff" }}>{browseQuery || "ذره بین"}</h1>
              <span style={{ fontSize: 11, color: "#8a8f98", background: "#2a2e39", padding: "4px 10px", borderRadius: 999 }}>{visibleBrowseProducts.length} کالا • {browseQuery}</span>
            </div>
            <button style={{ background: "#2a2e39", border: "1px solid #323642", color: "#e0e0e0", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer" }} onClick={()=>{ setBrowseMode(false); setBrowseQuery(""); }}>← بازگشت به خانه</button>
          </div>

          <div className="torobBrowseTopBar">
            <div className="torobBrowseFilters">
              <span style={{ cursor: "pointer", color: sortMode==="popular"?"#fff":"" }} onClick={()=>setSortMode("popular")}>مرتب‌سازی ∨</span>
              <label className="torobBrowseFilterToggle"><input type="checkbox" /> فقط موجودها</label>
              <label className="torobBrowseFilterToggle"><input type="checkbox" /> امکان خرید حضوری</label>
              <label className="torobBrowseFilterToggle"><input type="checkbox" /> خرید قسطی ترب</label>
            </div>
            <div style={{ fontSize: 11 }}>{visibleBrowseProducts.length} محصول • پیش‌نمایش کمترین قیمت</div>
          </div>

          <div className="torobBrowseGrid">
            <div className="torobProductGrid">
              {visibleBrowseProducts
                .filter(p => {
                  if (priceMin && p.basePrice < Number(priceMin)) return false;
                  if (priceMax && p.basePrice > Number(priceMax)) return false;
                  if (selectedBrandFilter && !p.name.includes(selectedBrandFilter)) return false;
                  return true;
                })
                .sort((a,b) => sortMode==="cheapest" ? a.basePrice - b.basePrice : 0)
                .map(p => (
                <div key={p.id} className="torobProductCard" onClick={()=>handleDetail(p)}>
                  <img src={p.image} alt={p.name} className="torobProductCardImg" onError={(e)=>{e.target.src="/images/magnifier-60x.jpg"}} />
                  <div className="torobProductCardBody">
                    <div className="torobProductCardTitle">{p.name}</div>
                    {p.stock === "ناموجود" ? (
                      <div className="torobProductCardPrice" style={{ color: "#f87171" }}>ناموجود — آخرین قیمت مرجع {money(p.basePrice)}</div>
                    ) : p.condition === "used" ? (
                      <div className="torobProductCardPrice" style={{ color: "#fbbf24" }}>استوک — از {money(p.basePrice)} تومان</div>
                    ) : (
                      <div className="torobProductCardPrice">از {money(p.basePrice)} تومان</div>
                    )}
                    <div className="torobProductCardMeta">
                      <span>در {p.sellersCount || Math.floor(Math.random()*20)+3} فروشگاه</span>
                      <span>♡ 🔔</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="torobSidebarDark">
              <div className="torobSidebarTitle">
                <span>قیمت</span>
                <span style={{ fontSize: 10, color: "#8a8f98" }}>^</span>
              </div>
              <input className="torobPriceInput" placeholder="از — تومان" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
              <input className="torobPriceInput" placeholder="تا — تومان" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="torobFilterBtn" style={{ background: "#323642", color: "#8a8f98" }} onClick={()=>{setPriceMin(""); setPriceMax("");}}>حذف</button>
                <button className="torobFilterBtn" style={{ background: "#fff", color: "#000" }}>اعمال فیلتر</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "#8a8f98", textAlign: "center" }}>{visibleBrowseProducts.length ? `از ${money(Math.min(...visibleBrowseProducts.map(p => p.basePrice || 0)))} تا ${money(Math.max(...visibleBrowseProducts.map(p => p.basePrice || 0)))}` : "از ۳۰ هزار تا ۲۰ میلیون"}</div>

              {(() => {
                const qLower = (browseQuery || "").toLowerCase();
                let brands = [];
                let similarCats = [];
                if (qLower.includes("رم کامپیوتر") || qLower.includes("رم دسکتاپ") || qLower.includes("رم لپ") || qLower.includes("حافظه رم") || qLower.includes("ddr4") || qLower.includes("ddr5")) {
                  brands = ["Corsair - کورسیر", "G.Skill - جی اسکیل", "Kingston - کینگستون", "Crucial - کروشیال", "TeamGroup - تیم گروپ", "ADATA - ای دیتا", "GeIL - گیل"];
                  similarCats = ["رم کامپیوتر", "رم DDR5", "رم DDR4", "رم لپ تاپ", "پردازنده", "مادربرد", "کارت گرافیک", "مینی کامپیوتر"];
                } else if (qLower.includes("پردازنده") || qLower.includes("cpu") || qLower.includes("سی پی یو") || qLower.includes("processor") || qLower.includes("ryzen") || qLower.includes("رایزن")) {
                  brands = ["Intel - اینتل", "AMD - ای ام دی"];
                  similarCats = ["پردازنده", "پردازنده اینتل Core i5", "پردازنده اینتل Core i7", "پردازنده AMD Ryzen 5", "پردازنده AMD Ryzen 7", "مادربرد", "رم کامپیوتر", "کارت گرافیک"];
                } else if (qLower.includes("ماینینگ") || qLower.includes("ماینر") || qLower.includes("mining") || qLower.includes("miner")) {
                  brands = ["Bitmain - بیتمین", "MicroBT - واتس ماینر", "IceRiver - آیس ریور", "Canaan - کنان", "Goldshell - گلدشل"];
                  similarCats = ["تجهیزات ماینینگ", "ماینر Antminer", "ماینر Whatsminer", "پاور ماینر", "سایلنت باکس ماینر", "مینی کامپیوتر", "کامپیوتر All in one"];
                } else if (qLower.includes("مینی کامپیوتر") || qLower.includes("مینی پی سی") || qLower.includes("mini pc") || qLower.includes("مک مینی") || qLower.includes("mac mini")) {
                  brands = ["Apple - اپل", "Asus - ایسوس", "HP - اچ پی", "Lenovo - لنوو", "Dell - دل", "MSI - ام اس آی", "Gigabyte - گیگابایت"];
                  similarCats = ["مینی کامپیوتر", "مک مینی Mac mini", "مینی کامپیوتر ایسوس NUC", "مینی کامپیوتر لنوو ThinkCentre", "کامپیوتر All in one", "مانیتور"];
                } else if (qLower.includes("all in one") || qLower.includes("آل این وان") || qLower.includes("کامپیوتر یکپارچه") || qLower.includes("imac") || qLower.includes("آی مک") || (qLower.includes("کامپیوتر") && !qLower.includes("مانیتور"))) {
                  brands = ["Asus - ایسوس", "HP - اچ پی", "Lenovo - لنوو", "Dell - دل", "MSI - ام اس آی", "Acer - ایسر", "Apple - اپل"];
                  similarCats = ["کامپیوتر All in one", "آی مک iMac", "کامپیوتر دسکتاپ", "مانیتور", "کامپیوتر و مانیتور", "لپ تاپ"];
                } else if (qLower.includes("مانیتور") || qLower.includes("monitor")) {
                  brands = ["Samsung - سامسونگ", "LG - ال جی", "Dell - دل", "Asus - ایسوس", "Xiaomi - شیائومی", "MSI - ام اس آی", "BenQ - بنکیو"];
                  similarCats = ["مانیتور", "مانیتور گیمینگ", "مانیتور سامسونگ", "مانیتور ال جی", "مانیتور 24 اینچ", "مانیتور 27 اینچ", "مانیتور اولتراواید", "کامپیوتر و مانیتور"];
                } else if (qLower.includes("گوشی") || qLower.includes("موبایل") || qLower.includes("سامسونگ") || qLower.includes("شیائومی") || qLower.includes("آیفون") || qLower.includes("iphone") || qLower.includes("xiaomi") || qLower.includes("samsung")) {
                  brands = ["Samsung - سامسونگ", "Xiaomi - شیائومی", "Apple - اپل", "Poco - پوکو", "Redmi - ردمی", "Huawei - هوآوی", "Nokia - نوکیا", "Motorola - موتورولا"];
                  similarCats = ["گوشی سامسونگ", "گوشی شیائومی", "گوشی آیفون", "گوشی هوآوی", "گوشی نوکیا", "تبلت سامسونگ", "هدفون", "لوازم جانبی موبایل"];
                } else if (qLower.includes("ذره بین") || qLower.includes("لوپ") || qLower.includes("میکروسکوپ") || qLower.includes("magnifier") || qLower.includes("ابزار")) {
                  brands = ["Camar - کامار", "Deli - دلی", "Proskit - پروسکیت", "INSIZE - اینسایز", "Somo - سومو", "Yaxun - یاکسون", "Nightsky - نایت اسکای", "Maped - مپد"];
                  similarCats = ["سلامت و پزشکی", "آزمایشگاهی", "ذره بین", "میکروسکوپ", "قطعات و لوازم جانبی میکروسکوپ", "مصرفی آزمایشگاهی", "تجهیزات آزمایشگاهی", "سایر آزمایشگاهی"];
                } else if (qLower.includes("تجهیزات زیبایی") || qLower.includes("زیبایی") || qLower.includes("آرایشی") || qLower.includes("سشوار") || qLower.includes("اتو مو") || qLower.includes("اپیلاتور") || qLower.includes("ماشین اصلاح") || qLower.includes("ریش تراش")) {
                  brands = ["Philips - فیلیپس", "Dyson - دایسون", "Remington - رمینگتون", "Braun - براون", "Babyliss - بابیلیس"];
                  similarCats = ["سشوار", "اتو مو", "فر کننده مو", "برس حرارتی", "ماشین اصلاح", "ریش تراش", "اپیلاتور", "تجهیزات زیبایی و آرایشی"];
                } else if (qLower.includes("کیسه فریزر") || qLower.includes("کیسه زباله") || qLower.includes("زیپ کیپ") || qLower.includes("سلفون") || qLower.includes("فویل") || qLower.includes("پلاستیک") || qLower.includes("یکبار مصرف") || qLower.includes("freezer")) {
                  brands = ["Pilgon - پیلگون", "Badook - بادوک", "Landi - لندی", "Home Plus - هوم پلاس"];
                  similarCats = ["کیسه فریزر", "کیسه زباله", "زیپ کیپ", "سلفون بسته‌بندی", "فویل آلومینیومی", "دستکش یکبار مصرف", "سفره یکبار مصرف", "ظروف یکبار مصرف"];
                } else if (qLower.includes("مایع دستشویی") || qLower.includes("دستشویی") || qLower.includes("شوینده") || qLower.includes("ظرفشویی") || qLower.includes("صابون") || qLower.includes("سفید کننده") || qLower.includes("دامستوس") || qLower.includes("پریل") || qLower.includes("شیشه پاک")) {
                  brands = ["Dove - داو", "Pril - پریل", "Domestos - دامستوس", "Persil - پرسیل", "Sio - سیو", "Oh - اوه", "Man - من", "Daryan - دریان"];
                  similarCats = ["مایع دستشویی", "مایع ظرفشویی", "شیشه پاک کن", "جرم گیر", "سفید کننده", "مایع لباسشویی", "صابون", "شوینده‌های مشابه"];
                } else if (qLower.includes("هایپر") || qLower.includes("پیاز") || qLower.includes("سیب زمینی") || qLower.includes("روغن") || qLower.includes("برنج") || qLower.includes("گوجه")) {
                  brands = ["اویلا - Ovila", "لادن - Ladan", "طبیعت - Tabiat", "مزرعه - Mazrae", "برنج هاشمی", "روغن لادن"];
                  similarCats = ["صیفی‌جات", "میوه و تره‌بار", "غلات و برنج", "روغن مایع", "حبوبات", "لبنیات", "مواد غذایی", "سایر هایپر"];
                } else {
                  brands = ["Camar - کامار", "Deli - دلی", "Samsung - سامسونگ", "Xiaomi - شیائومی", "Apple - اپل", "Dove - داو", "Pril - پریل"];
                  similarCats = ["محصولات مشابه", "دسته‌های مرتبط", "پیشنهاد ترب"];
                }
                return (
                  <>
                    <div className="torobSidebarTitle" style={{ marginTop: 20 }}>
                      <span>انتخاب برند - مرتبط با {browseQuery}</span>
                      <span style={{ fontSize: 10, color: "#8a8f98" }}>^</span>
                    </div>
                    <input className="torobBrandSearch" placeholder={`جستجوی برند ${browseQuery}`} />
                    {brands.map((b, idx) => {
                      const brandName = b.split(" - ")[1] || b;
                      return (
                        <div key={idx} className="torobBrandItem" onClick={()=>setSelectedBrandFilter(selectedBrandFilter===brandName ? null : brandName)} style={{ color: selectedBrandFilter===brandName ? "#fff" : "" }}>
                          <span>{b}</span>
                          <span>{selectedBrandFilter===brandName ? "✓" : ""}</span>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 11, color: "#8a8f98", marginTop: 8, cursor: "pointer" }}>نمایش سایر برندهای {browseQuery} ∨</div>

                    <div className="torobSidebarTitle" style={{ marginTop: 20 }}>
                      <span>دسته‌های مشابه {browseQuery}</span>
                      <span style={{ fontSize: 10, color: "#8a8f98" }}>^</span>
                    </div>
                    {similarCats.map((cat, idx) => (
                      <div key={idx} className="torobBrandItem" onClick={()=>handleBrowse(cat)} style={{ fontSize: 11 }}>
                        <span>{cat}</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : !res ? (
        <div className="torobHome">
          <div className="torobHero">
            <div style={{ fontSize: 48 }}>🔍</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "12px 0 0" }}>جستجوی همه محصولات</h1>
            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>بدون فیلتر RAM — فقط همه محصولات مرتبط — بالا دسته‌بندی، چپ نمودار و مشخصات بعد از جستجو</div>
            <div className="chips" style={{ marginTop: 16 }}>{QUICK.map(s => <button key={s} className="chip" onClick={()=>{ setQ(s); run(s); }}>{s}</button>)}</div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🔥 محصولات محبوب — کلیک کنید تا جستجو شود</span>
              <span className="muted2" style={{ fontSize: 13 }}>{PRODUCTS.length} محصول</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14, marginTop: 14 }}>
              {PRODUCTS.map(p => (
                <div key={p.id} className="sugCard" style={{ padding: 14, textAlign: "center", cursor: "pointer", border: "1px solid var(--line)" }} 
                  onClick={()=>{ console.log('click product', p.name); setQ(p.name); run(p.name); window.scrollTo({top:0, behavior:'smooth'}); }}>
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: 100, objectFit: "contain", background: "#fff", borderRadius: 8 }} onError={(e)=>{ e.target.src="/images/iphone15promax.jpg"; }} />
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 10, lineHeight: 1.5, minHeight: 36 }}>{p.name.slice(0,45)}</div>
                  <div className="muted2" style={{ fontSize: 12, marginTop: 4 }}>{p.category}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--good)", marginTop: 6 }}>{money(p.basePrice)}</div>
                  <div style={{ marginTop: 8, fontSize: 11, background: "#f0f9ff", color: "#0369a1", padding: "4px 8px", borderRadius: 999, display: "inline-block" }}>کلیک برای جستجو 🔍</div>
                </div>
              ))}
            </div>
            <div className="muted2" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>💡 روی هر کالایی کلیک کنید — مستقیم جستجو می‌شود — محدودیت رایگان: {freeLimit} جستجو در روز (قبلا ۵ بود)</div>
          </div>
        </div>
      ) : (
        <div>
          <main>
            <div className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 12 }}>🔍 {res.query} — {res.offers.length} فروشنده — ایجنت هوشمند</div>
              <div className="muted2" style={{ fontSize: 10 }}>برند یکسان = مقایسه دقیق | اینستا، تلگرام، گوگل هم فعال</div>
            </div>

            {/* 🤖 نتیجه تشخیص هوش مصنوعی از روی تصویر */}
            {res && res.imageMessage && (
              <div className="card" style={{ marginTop: 8, padding: "14px", background: "linear-gradient(135deg, #ecfdf5, #f0f9ff)", borderColor: "#6ee7b7", borderWidth: 2 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 32 }}>🤖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, color: "#065f46" }}>هوش مصنوعی تصویر شما رو تشخیص داد!</div>
                    <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.8, background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                      {res.imageMessage}
                    </div>
                    {res.imageAnalysis && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 10 }}>
                        <span style={{ background: "#dcfce7", padding: "4px 8px", borderRadius: 999 }}>📁 {res.imageAnalysis.fileName}</span>
                        <span style={{ background: "#dbeafe", padding: "4px 8px", borderRadius: 999 }}>📐 {res.imageAnalysis.width}×{res.imageAnalysis.height} {res.imageAnalysis.aspectRatio ? `(${res.imageAnalysis.aspectRatio})` : ""}</span>
                        <span style={{ background: "#fef3c7", padding: "4px 8px", borderRadius: 999 }}>🎯 اعتماد {Math.round((res.imageAnalysis.confidence||0.8)*100)}٪</span>
                        <span style={{ background: "#f3e8ff", padding: "4px 8px", borderRadius: 999 }}>🏷️ {res.imageAnalysis.category}</span>
                      </div>
                    )}
                    {res.imageGuesses && res.imageGuesses.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>حدس‌های دیگر هوش مصنوعی:</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {res.imageGuesses.map((g, i) => (
                            <button key={i} type="button" className="chip" style={{ fontSize: 11, padding: "4px 8px", background: i===0 ? "#10b981" : "#fff", color: i===0 ? "#fff" : "#333", borderColor: i===0 ? "#10b981" : "var(--line)" }} onClick={()=>{ setQ(g); run(g); }}>
                              {i===0 ? "✓ " : ""}{g}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {imagePreview && <img src={imagePreview} alt="uploaded" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "2px solid #10b981", background: "#fff" }} />}
                </div>
              </div>
            )}

            {/* فیلتر برندمحور - مثل با مثل - برای مقایسه دقیق */}
            {res && (res.query.toLowerCase().includes("خودکار") || res.query.toLowerCase().includes("pen") || matchedProduct?.category==="لوازم التحریر") && (
              <div className="card" style={{ marginTop: 8, padding: "10px 14px", background: "linear-gradient(135deg, #f0f9ff, #fff)", borderColor: "#7dd3fc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>🏷️ فیلتر برند - مقایسه دقیق مثل با مثل:</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>
                    {selectedBrand ? `فقط ${selectedBrand} - ${filteredOffers.length} آفر` : `همه برندها - ${filteredOffers.length} آفر (بیک، پارکر، کنکو)`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button className={`chip ${!selectedBrand ? "chipActive" : ""}`} style={{ fontSize: 12, padding: "6px 12px", background: !selectedBrand ? "#0ea5e9" : "#fff", color: !selectedBrand ? "#fff" : "#333" }} onClick={()=>setSelectedBrand(null)}>همه برندها - {res.query}</button>
                  <button className={`chip ${selectedBrand==="بیک" ? "chipActive" : ""}`} style={{ fontSize: 12, padding: "6px 12px", background: selectedBrand==="بیک" ? "#0ea5e9" : "#fff", color: selectedBrand==="بیک" ? "#fff" : "#333" }} onClick={()=>setSelectedBrand("بیک")}>بیک - فقط بیک آبی</button>
                  <button className={`chip ${selectedBrand==="پارکر" ? "chipActive" : ""}`} style={{ fontSize: 12, padding: "6px 12px", background: selectedBrand==="پارکر" ? "#0ea5e9" : "#fff", color: selectedBrand==="پارکر" ? "#fff" : "#333" }} onClick={()=>setSelectedBrand("پارکر")}>پارکر - فقط پارکر</button>
                  <button className={`chip ${selectedBrand==="کنکو" ? "chipActive" : ""}`} style={{ fontSize: 12, padding: "6px 12px", background: selectedBrand==="کنکو" ? "#0ea5e9" : "#fff", color: selectedBrand==="کنکو" ? "#fff" : "#333" }} onClick={()=>setSelectedBrand("کنکو")}>کنکو - فقط کنکو</button>
                </div>
                <div className="muted2" style={{ fontSize: 10, marginTop: 8, lineHeight: 1.6 }}>
                  💡 <b>هوش مصنوعی قیمت‌یاب:</b> اگه بزنید <b>خودکار آبی</b> → همه برندها (بیک 25k، پارکر 185k، کنکو 22k) میان. اگه بزنید <b>خودکار بیک آبی</b> → فقط بیک آبی از همه منابع (ترب، دیجی‌کالا، باسلام، باسکول، گوگل، تلگرام، اینستاگرام) با مقایسه دقیق مثل با مثل.
                </div>
              </div>
            )}

            {/* راهنمای هوشمند برای دسته‌های گسترده - کفش، گوشی، لپ تاپ و... */}
            {res && (() => {
              const ql = res.query.toLowerCase().trim();
              const broadCategories = {
                "کفش": { 
                  category: "پوشاک", 
                  label: "کفش",
                  items: [
                    { name: "دمپایی روفرشی", price: "185,000", img: "/images/slippers.jpg" },
                    { name: "کتونی نایک", price: "2,850,000", img: "/images/sneakers-nike.jpg" },
                    { name: "صندل چرمی", price: "650,000", img: "/images/sandal-leather.jpg" },
                    { name: "کفش رسمی", price: "1,250,000", img: "/images/formal-shoes.jpg" },
                  ],
                  questions: [
                    { q: "برای چه استفاده‌ای؟", opts: ["روزمره - دمپایی", "ورزشی - کتونی", "مجلسی - رسمی", "تابستانی - صندل"] },
                    { q: "سایز و جنسیت؟", opts: ["مردانه سایز 42", "زنانه سایز 38", "بچگانه", "طبی"] },
                    { q: "برند؟", opts: ["نایک", "آدیداس", "چرم طبیعی", "ارزان‌ترین"] },
                  ]
                },
                "موبایل": {
                  category: "موبایل",
                  label: "گوشی موبایل",
                  items: [
                    { name: "آیفون 15 پرو مکس", price: "195,000,000", img: "/images/iphone15promax.jpg" },
                    { name: "گلکسی S24 الترا", price: "263,400,000", img: "/images/s24ultra.jpg" },
                    { name: "سامسونگ A55", price: "18,400,000", img: "/images/s24ultra.jpg" },
                    { name: "شیائومی 14 پرو", price: "31,800,000", img: "/images/s24ultra.jpg" },
                  ],
                  questions: [
                    { q: "برند مورد نظر؟", opts: ["آیفون - Apple", "سامسونگ - Galaxy", "شیائومی - Xiaomi", "همه برندها"] },
                    { q: "حافظه و رم؟", opts: ["256GB - 8GB RAM", "512GB - 12GB RAM", "128GB اقتصادی", "1TB حرفه‌ای"] },
                    { q: "رنج قیمت؟", opts: ["زیر 20 میلیون", "20 تا 50 میلیون", "بالای 100 میلیون", "پرچمدار"] },
                  ]
                },
                "لپ تاپ": {
                  category: "لپ‌تاپ",
                  label: "لپ‌تاپ",
                  items: [
                    { name: "مک‌بوک ایر M1", price: "125,822,000", img: "/images/macbook-air-m1.jpg" },
                    { name: "Dell Latitude 7420", price: "108,000,000", img: "/images/macbook-air-m1.jpg" },
                    { name: "لنوو Legion Pro 5", price: "84,500,000", img: "/images/macbook-air-m1.jpg" },
                    { name: "ایسوس ROG Strix", price: "71,900,000", img: "/images/macbook-air-m1.jpg" },
                  ],
                  questions: [
                    { q: "برای چه کاری؟", opts: ["دانشجویی - سبک", "گیمینگ - قوی", "برنامه‌نویسی - حرفه‌ای", "اداری - اقتصادی"] },
                    { q: "برند؟", opts: ["اپل - مک‌بوک", "Dell - دل", "لنوو - Lenovo", "ایسوس - Asus"] },
                    { q: "رم و حافظه؟", opts: ["8GB RAM 256GB", "16GB RAM 512GB", "32GB RAM 1TB", "ارزان‌ترین"] },
                  ]
                },
                "لوازم خانگی": {
                  category: "خانگی",
                  label: "لوازم خانگی",
                  items: [
                    { name: "جارو رباتیک روبوروک S8", price: "24,600,000", img: "/images/ps5.jpg" },
                    { name: "سرخ‌کن فیلیپس HD9252", price: "8,900,000", img: "/images/ps5.jpg" },
                    { name: "اسپرسوساز دلونگی EC685", price: "13,400,000", img: "/images/ps5.jpg" },
                    { name: "تلویزیون سامسونگ QLED 65 اینچ", price: "68,000,000", img: "/images/ps5.jpg" },
                  ],
                  questions: [
                    { q: "چه نوع لوازم خانگی؟", opts: ["جارو رباتیک - هوشمند", "سرخ‌کن - بدون روغن", "اسپرسوساز - قهوه", "تلویزیون - QLED/OLED"] },
                    { q: "برند؟", opts: ["روبوروک", "فیلیپس", "دلونگی", "سامسونگ/ال‌جی"] },
                    { q: "رنج قیمت؟", opts: ["زیر 10 میلیون", "10 تا 30 میلیون", "بالای 50 میلیون", "بهترین فروش"] },
                  ]
                },
                "هایپر مارکت": {
                  category: "هایپر مارکت",
                  label: "هایپر مارکت",
                  items: [
                    { name: "پیاز سفید 1 کیلو", price: "45,000", img: "/images/onion-white.jpg" },
                    { name: "سیب زمینی 1 کیلو", price: "32,000", img: "/images/potato.jpg" },
                    { name: "برنج هاشمی 10 کیلو", price: "1,200,000", img: "/images/rice.jpg" },
                    { name: "روغن آفتابگردان 1.5 لیتری", price: "95,000", img: "/images/oil-1-5l.jpg" },
                  ],
                  questions: [
                    { q: "چه محصولی؟", opts: ["صیفی‌جات - پیاز، سیب‌زمینی", "غلات - برنج", "روغن - مایع", "همه هایپر"] },
                    { q: "مقدار؟", opts: ["1 کیلو", "5 کیلو", "10 کیلو عمده", "ارزان‌ترین"] },
                  ]
                },
                "شوینده": {
                  category: "هایپر مارکت",
                  label: "شوینده و بهداشتی",
                  items: [
                    { name: "مایع دستشویی داو 500ml", price: "85,000", img: "/images/hand-wash.jpg" },
                    { name: "مایع ظرفشویی پریل 1 لیتری", price: "62,000", img: "/images/dish-wash.jpg" },
                    { name: "شیشه پاک کن 500ml", price: "38,000", img: "/images/glass-cleaner.jpg" },
                    { name: "سفید کننده دامستوس 750ml", price: "42,000", img: "/images/bleach.jpg" },
                  ],
                  questions: [
                    { q: "نوع شوینده؟", opts: ["دستشویی - داو", "ظرفشویی - پریل", "شیشه پاک کن", "سفید کننده - دامستوس"] },
                    { q: "برند؟", opts: ["داو", "پریل", "دامستوس", "پرسیل"] },
                    { q: "حجم؟", opts: ["500ml", "1 لیتری", "750ml", "ارزان‌ترین"] },
                  ]
                },
                "مایع دستشویی": {
                  category: "هایپر مارکت",
                  label: "مایع دستشویی",
                  items: [
                    { name: "مایع دستشویی کرمی داو 500ml", price: "85,000", img: "/images/hand-wash.jpg" },
                    { name: "مایع دستشویی سیو 500ml", price: "72,000", img: "/images/hand-wash.jpg" },
                    { name: "مایع دستشویی اوه 450ml", price: "58,000", img: "/images/hand-wash.jpg" },
                    { name: "مایع دستشویی درما 500ml", price: "92,000", img: "/images/hand-wash.jpg" },
                  ],
                  questions: [
                    { q: "برند؟", opts: ["داو - Dove", "سیو - Sio", "اوه - Oh", "درما"] },
                    { q: "رایحه؟", opts: ["کرمی", "آنتی باکتریال", "لیمو", "زیتون"] },
                    { q: "حجم؟", opts: ["450ml", "500ml", "1 لیتری", "ارزان‌ترین"] },
                  ]
                },
                "کامپیوتر All in one": {
                  category: "کامپیوتر",
                  label: "کامپیوتر All in One",
                  items: [
                    { name: "کامپیوتر All in One ایسوس A3402", price: "52,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One اچ پی ProOne 440 G9", price: "68,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One لنوو IdeaCentre 3", price: "34,500,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One دل Inspiron 7710", price: "98,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One ام اس آی Modern AM272", price: "57,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One ایسر Aspire C24", price: "49,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One اپل iMac M4", price: "189,000,000", img: "/images/all-in-one.jpg" },
                    { name: "کامپیوتر All in One اپل iMac M3", price: "148,000,000", img: "/images/all-in-one.jpg" },
                  ],
                  questions: [
                    { q: "برند؟", opts: ["ایسوس", "اچ پی", "لنوو", "دل", "ام اس آی", "ایسر", "اپل - iMac"] },
                    { q: "پردازنده؟", opts: ["Core i3 اقتصادی", "Core i5", "Core i7", "Ryzen 5", "Apple M4"] },
                    { q: "رنج قیمت؟", opts: ["زیر 45 میلیون", "45 تا 75 میلیون", "75 تا 100 میلیون", "بالای 100 میلیون - iMac", "ارزان‌ترین"] },
                  ]
                },
                "مینی کامپیوتر": {
                  category: "مینی کامپیوتر",
                  label: "مینی کامپیوتر",
                  items: [
                    { name: "مینی کامپیوتر اپل Mac mini M4", price: "98,000,000", img: "/images/mini-pc.jpg" },
                    { name: "مینی کامپیوتر ایسوس NUC 14 Pro", price: "62,000,000", img: "/images/mini-pc.jpg" },
                    { name: "مینی کامپیوتر لنوو ThinkCentre M70q Tiny", price: "51,000,000", img: "/images/mini-pc.jpg" },
                    { name: "مینی کامپیوتر ام اس آی Cubi 5", price: "39,500,000", img: "/images/mini-pc.jpg" },
                    { name: "مینی کامپیوتر اینتل NUC 11 اقتصادی", price: "24,500,000", img: "/images/mini-pc.jpg" },
                  ],
                  questions: [
                    { q: "برند؟", opts: ["اپل - Mac mini", "ایسوس NUC", "لنوو ThinkCentre", "اچ پی", "دل"] },
                    { q: "پردازنده؟", opts: ["Core i3 اقتصادی", "Core i5", "Core i7", "Apple M4"] },
                    { q: "رنج قیمت؟", opts: ["زیر 40 میلیون", "40 تا 65 میلیون", "بالای 65 میلیون", "ارزان‌ترین"] },
                  ]
                },
                "رم کامپیوتر": {
                  category: "رم کامپیوتر",
                  label: "رم کامپیوتر",
                  items: [
                    { name: "رم Corsair Vengeance RGB DDR5 32GB", price: "21,500,000", img: "/images/ram-memory.jpg" },
                    { name: "رم G.Skill Trident Z5 DDR5 32GB", price: "24,000,000", img: "/images/ram-memory.jpg" },
                    { name: "رم Kingston Fury Beast DDR4 16GB", price: "3,900,000", img: "/images/ram-memory.jpg" },
                    { name: "رم Crucial DDR4 8GB اقتصادی", price: "1,850,000", img: "/images/ram-memory.jpg" },
                    { name: "رم لپ تاپ Crucial DDR4 16GB", price: "3,400,000", img: "/images/ram-memory.jpg" },
                  ],
                  questions: [
                    { q: "نوع؟", opts: ["DDR4 دسکتاپ", "DDR5 دسکتاپ", "رم لپ تاپ SODIMM"] },
                    { q: "ظرفیت؟", opts: ["8GB اقتصادی", "16GB", "32GB کیت دوکاناله"] },
                    { q: "برند؟", opts: ["Corsair", "G.Skill", "Kingston", "Crucial"] },
                  ]
                },
                "پردازنده": {
                  category: "پردازنده",
                  label: "پردازنده",
                  items: [
                    { name: "پردازنده اینتل Core i9-14900K", price: "68,000,000", img: "/images/cpu-processor.jpg" },
                    { name: "پردازنده اینتل Core i7-14700K", price: "52,000,000", img: "/images/cpu-processor.jpg" },
                    { name: "پردازنده AMD Ryzen 7 7800X3D گیمینگ", price: "48,000,000", img: "/images/cpu-processor.jpg" },
                    { name: "پردازنده اینتل Core i5-12400F اقتصادی", price: "16,500,000", img: "/images/cpu-processor.jpg" },
                    { name: "پردازنده AMD Ryzen 5 5600 اقتصادی", price: "11,500,000", img: "/images/cpu-processor.jpg" },
                  ],
                  questions: [
                    { q: "برند؟", opts: ["اینتل - Intel", "ای ام دی - AMD"] },
                    { q: "سری؟", opts: ["Core i5", "Core i7", "Core i9", "Ryzen 5", "Ryzen 7", "Ryzen 9"] },
                    { q: "رنج قیمت؟", opts: ["زیر 20 میلیون", "20 تا 50 میلیون", "بالای 50 میلیون", "ارزان‌ترین"] },
                  ]
                },
                "تجهیزات ماینینگ": {
                  category: "تجهیزات ماینینگ",
                  label: "تجهیزات ماینینگ",
                  items: [
                    { name: "ماینر Antminer S21 Pro 234TH", price: "435,000,000", img: "/images/mining-asic.jpg" },
                    { name: "ماینر Whatsminer M60S 186TH", price: "355,000,000", img: "/images/mining-asic.jpg" },
                    { name: "ماینر Antminer S19 XP 140TH", price: "165,000,000", img: "/images/mining-asic.jpg" },
                    { name: "ماینر Antminer S19j Pro 104TH اقتصادی", price: "88,000,000", img: "/images/mining-asic.jpg" },
                    { name: "پاور ماینر APW12", price: "16,500,000", img: "/images/mining-asic.jpg" },
                  ],
                  questions: [
                    { q: "برند؟", opts: ["Bitmain - Antminer", "MicroBT - Whatsminer", "IceRiver", "Canaan"] },
                    { q: "الگوریتم؟", opts: ["بیت‌کوین SHA-256", "لایت‌کوین Scrypt", "کسپا", "کادنا"] },
                    { q: "رنج قیمت؟", opts: ["زیر 100 میلیون", "100 تا 300 میلیون", "بالای 300 میلیون", "ارزان‌ترین"] },
                  ]
                },
                "مانیتور": {
                  category: "مانیتور",
                  label: "مانیتور",
                  items: [
                    { name: "مانیتور سامسونگ 27 اینچ FHD", price: "32,000,000", img: "/images/monitor-27.jpg" },
                    { name: "مانیتور گیمینگ ال جی 27GP850-B QHD (ناموجود)", price: "90,000,000", img: "/images/monitor-gaming.jpg" },
                    { name: "مانیتور شیائومی Redmi G27", price: "38,500,000", img: "/images/monitor-gaming.jpg" },
                    { name: "مانیتور ال جی 24 اینچ FHD", price: "24,500,000", img: "/images/monitor-24.jpg" },
                  ],
                  questions: [
                    { q: "سایز؟", opts: ["24 اینچ", "27 اینچ", "34 اینچ اولتراواید", "ارزان‌ترین"] },
                    { q: "برند؟", opts: ["سامسونگ", "ال جی", "دل", "ایسوس"] },
                    { q: "کاربرد؟", opts: ["اداری - FHD", "گیمینگ - 165Hz", "طراحی - QHD", "اولتراواید"] },
                  ]
                },
                "تجهیزات زیبایی و آرایشی": {
                  category: "زیبایی و آرایشی",
                  label: "تجهیزات زیبایی و آرایشی",
                  items: [
                    { name: "سشوار فیلیپس BHD351", price: "3,850,000", img: "/images/hair-dryer.jpg" },
                    { name: "اتو مو رمینگتون S8500", price: "2,950,000", img: "/images/hair-straightener.jpg" },
                    { name: "ماشین اصلاح فیلیپس MG3747", price: "4,200,000", img: "/images/shaver-trimmer.jpg" },
                    { name: "اپیلاتور براون Silk-epil 9", price: "8,900,000", img: "/images/epilator.jpg" },
                  ],
                  questions: [
                    { q: "نوع دستگاه؟", opts: ["سشوار", "اتو مو", "ماشین اصلاح - ریش تراش", "اپیلاتور"] },
                    { q: "برند؟", opts: ["فیلیپس", "دایسون", "رمینگتون", "براون"] },
                    { q: "رنج قیمت؟", opts: ["زیر 3 میلیون", "3 تا 9 میلیون", "بالای 10 میلیون", "ارزان‌ترین"] },
                  ]
                },
                "کیسه فریزر": {
                  category: "هایپر مارکت",
                  label: "کیسه فریزر و پلاستیکی",
                  items: [
                    { name: "کیسه فریزر رولی پیلگون 100 عددی", price: "68,000", img: "/images/freezer-bag-roll.jpg" },
                    { name: "کیسه فریزر چسبی بادوک 100 عددی", price: "82,000", img: "/images/freezer-bag.jpg" },
                    { name: "کیسه فریزر زیپ‌دار هوم پلاس 20 عددی", price: "95,000", img: "/images/freezer-bag-zip.jpg" },
                    { name: "کیسه فریزر جعبه‌ای لندی 250 عددی", price: "145,000", img: "/images/freezer-bag.jpg" },
                  ],
                  questions: [
                    { q: "نوع کیسه؟", opts: ["رولی - 100 عددی", "چسبی - 100 عددی", "زیپ‌دار - 20 عددی", "جعبه‌ای - 250 عددی"] },
                    { q: "برند؟", opts: ["پیلگون", "بادوک", "لندی", "هوم پلاس"] },
                    { q: "تعداد؟", opts: ["20 عددی", "100 عددی", "250 عددی", "ارزان‌ترین"] },
                  ]
                },
                "صوتی و تصویری": {
                  category: "صوتی",
                  label: "صوتی و تصویری",
                  items: [
                    { name: "ایرپادز پرو 2", price: "11,200,000", img: "/images/airpods-pro2.jpg" },
                    { name: "هدفون سونی WH-1000XM5", price: "15,600,000", img: "/images/airpods-pro2.jpg" },
                    { name: "تلویزیون ال‌جی OLED 55", price: "79,500,000", img: "/images/ps5.jpg" },
                    { name: "اسپیکر JBL Charge 5", price: "5,800,000", img: "/images/airpods-pro2.jpg" },
                  ],
                  questions: [
                    { q: "چه نوع؟", opts: ["هدفون - سونی/ایرپادز", "تلویزیون - QLED/OLED", "اسپیکر - JBL", "ساعت هوشمند"] },
                    { q: "برند؟", opts: ["اپل", "سونی", "سامسونگ", "JBL"] },
                  ]
                },
                "مد و پوشاک": {
                  category: "پوشاک",
                  label: "مد و پوشاک",
                  items: [
                    { name: "کتونی نایک", price: "2,850,000", img: "/images/sneakers-nike.jpg" },
                    { name: "صندل چرمی مردانه", price: "650,000", img: "/images/sandal-leather.jpg" },
                    { name: "کفش رسمی چرمی", price: "1,250,000", img: "/images/formal-shoes.jpg" },
                    { name: "دمپایی روفرشی طبی", price: "185,000", img: "/images/slippers.jpg" },
                  ],
                  questions: [
                    { q: "دسته؟", opts: ["کفش ورزشی - کتونی", "کفش رسمی - چرمی", "صندل - تابستانی", "دمپایی - روفرشی"] },
                    { q: "سایز؟", opts: ["38-40", "41-43", "44-45", "همه سایزها"] },
                  ]
                },
                "خودرو": {
                  category: "خودرو",
                  label: "خودرو و وسایل نقلیه",
                  items: [
                    { name: "اسکوتر برقی شیائومی M365", price: "28,000,000", img: "/images/scooter-electric.jpg" },
                    { name: "جارو رباتیک - برای خودرو", price: "24,600,000", img: "/images/ps5.jpg" },
                  ],
                  questions: [
                    { q: "نوع وسیله؟", opts: ["اسکوتر برقی", "لوازم خودرو", "دوچرخه", "همه"] },
                  ]
                },
                "فرهنگی هنری": {
                  category: "لوازم التحریر",
                  label: "لوازم التحریر",
                  items: [
                    { name: "خودکار آبی بیک", price: "25,000", img: "/images/pen-blue.jpg" },
                    { name: "دفتر 100 برگ", price: "65,000", img: "/images/notebook-100.jpg" },
                    { name: "مداد HB استدلر", price: "18,000", img: "/images/pencil-hb.jpg" },
                    { name: "لیوان کاغذی 200cc", price: "95,000", img: "/images/paper-cup.jpg" },
                  ],
                  questions: [
                    { q: "نوع؟", opts: ["خودکار - آبی/مشکی", "دفتر - سیمی", "مداد - HB", "لیوان کاغذی"] },
                  ]
                },
              };
              
              // تشخیص دسته گسترده
              let currentBroad = null;
              for (const [key, val] of Object.entries(broadCategories)) {
                if (ql === key || ql === key.replace(" ", "") || ql.includes(key) || 
                    (key === "مایع دستشویی" && (ql.includes("مایع دستشویی") || ql.includes("دستشویی"))) ||
                    (key === "شوینده" && (ql.includes("شوینده") || ql.includes("مایع") && (ql.includes("دستشویی") || ql.includes("ظرفشویی") || ql.includes("لباسشویی") || ql.includes("صابون")))) ||
                    (key === "لپ تاپ" && (ql.includes("لپ تاپ") || ql.includes("لپ‌تاپ") || ql.includes("لب تاب"))) || 
                    (key === "لوازم خانگی" && (ql.includes("لوازم خانگی") || ql.includes("لوازم") && ql.includes("خانگی") || ql.includes("خانگی"))) || 
                    (key === "هایپر مارکت" && (ql.includes("هایپر") || ql.includes("سوپر مارکت"))) || 
                    (key === "صوتی و تصویری" && (ql.includes("صوتی") || ql.includes("تصویری"))) || 
                    (key === "مد و پوشاک" && (ql.includes("پوشاک") || ql.includes("مد") || ql.includes("لباس"))) || 
                    (key === "فرهنگی هنری" && (ql.includes("فرهنگی") || ql.includes("هنری") || ql.includes("تحریر"))) || 
                    (key === "خودرو" && ql.includes("خودرو"))) {
                  currentBroad = val;
                  break;
                }
                if (matchedProduct?.category === val.category && ql.length <= 12) {
                  // اگر دسته هایپر مارکت هست ولی کوئری شوینده هست، شوینده رو نشون بده نه هایپر عمومی
                  if (val.category === "هایپر مارکت" && (ql.includes("مایع") || ql.includes("شوینده") || ql.includes("صابون") || ql.includes("دستشویی"))) {
                    if (key === "مایع دستشویی" || key === "شوینده") {
                      currentBroad = val;
                    }
                    continue;
                  }
                  currentBroad = val;
                }
              }
              // اگر کوئری دقیقا نام دسته باشه یا خیلی کوتاه باشه
              // اولویت با شوینده اگر کوئری شوینده باشه
              if (ql.includes("رم کامپیوتر") || ql.includes("رم دسکتاپ") || ql.includes("رم لپ") || ql.includes("ddr4") || ql.includes("ddr5")) {
                currentBroad = broadCategories["رم کامپیوتر"];
              } else if (ql.includes("پردازنده") || ql.includes("cpu") || ql.includes("سی پی یو") || ql.includes("ryzen") || ql.includes("رایزن")) {
                currentBroad = broadCategories["پردازنده"];
              } else if (ql.includes("ماینینگ") || ql.includes("ماینر") || ql.includes("mining") || ql.includes("miner")) {
                currentBroad = broadCategories["تجهیزات ماینینگ"];
              } else if (ql.includes("مینی کامپیوتر") || ql.includes("مینی پی سی") || ql.includes("مک مینی") || ql.includes("mac mini")) {
                currentBroad = broadCategories["مینی کامپیوتر"];
              } else if (ql.includes("all in one") || ql.includes("آل این وان") || ql.includes("کامپیوتر یکپارچه") || ql.includes("imac") || ql.includes("آی مک")) {
                currentBroad = broadCategories["کامپیوتر All in one"];
              } else if (ql.includes("مانیتور") || ql.includes("monitor")) {
                currentBroad = broadCategories["مانیتور"];
              } else if (ql.includes("تجهیزات زیبایی") || ql.includes("زیبایی و آرایشی") || ql.includes("سشوار") || ql.includes("اتو مو") || ql.includes("اپیلاتور") || ql.includes("ماشین اصلاح") || ql.includes("ریش تراش")) {
                currentBroad = broadCategories["تجهیزات زیبایی و آرایشی"];
              } else if (ql.includes("کیسه فریزر") || ql.includes("کیسه زباله") || ql.includes("زیپ کیپ")) {
                currentBroad = broadCategories["کیسه فریزر"];
              } else if (ql.includes("مایع دستشویی")) {
                currentBroad = broadCategories["مایع دستشویی"];
              } else if (ql.includes("شوینده") || ql.includes("مایع") && (ql.includes("دستشویی") || ql.includes("ظرفشویی") || ql.includes("صابون") || ql.includes("لباسشویی"))) {
                currentBroad = broadCategories["شوینده"] || broadCategories["مایع دستشویی"];
              }
              const isBroad = currentBroad || (ql.trim().split(" ").length <= 2 && ql.length <= 12 && ["کفش","موبایل","گوشی","لپ","ساعت","کیف","تلویزیون","خانگی","هایپر","صوتی","پوشاک","خودرو","فرهنگی","هنری","تحریر","شوینده","مایع"].some(k => ql.includes(k)));
              if (!isBroad) {
                // برای دسته‌های مختلف حتی اگه دسته باشه و کوئری کوتاه باشه
                if (matchedProduct?.category === "پوشاک" && ql.length <= 12) currentBroad = broadCategories["مد و پوشاک"] || broadCategories["کفش"];
                else if (matchedProduct?.category === "موبایل" && ql.length <= 12) currentBroad = broadCategories["موبایل"];
                else if (matchedProduct?.category === "لپ‌تاپ" && ql.length <= 12) currentBroad = broadCategories["لپ تاپ"];
                else if (matchedProduct?.category === "خانگی" && ql.length <= 12) currentBroad = broadCategories["لوازم خانگی"];
                else if (matchedProduct?.category === "هایپر مارکت" && ql.length <= 12) {
                  if (ql.includes("مایع") || ql.includes("شوینده") || ql.includes("صابون")) {
                    currentBroad = broadCategories["شوینده"] || broadCategories["مایع دستشویی"];
                  } else {
                    currentBroad = broadCategories["هایپر مارکت"];
                  }
                }
                else if ((matchedProduct?.category === "صوتی" || matchedProduct?.category === "تلویزیون" || matchedProduct?.category === "واچ") && ql.length <= 12) currentBroad = broadCategories["صوتی و تصویری"];
                else if (matchedProduct?.category === "لوازم التحریر" && ql.length <= 12) currentBroad = broadCategories["فرهنگی هنری"];
                else if (matchedProduct?.category === "خودرو" && ql.length <= 12) currentBroad = broadCategories["خودرو"];
                else return null;
              }
              if (!currentBroad) return null;
              
              return (
                <div className="card" style={{ marginTop: 8, padding: "14px", background: "linear-gradient(135deg, #fef3c7, #fff)", borderColor: "#fcd34d" }}>
                  <div style={{ fontWeight: 900, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>🤖 ایجنت راهنمای هوشمند - جستجوی "{res.query}" گسترده است!</span>
                    <span style={{ fontSize: 10, background: "#fef3c7", padding: "3px 8px", borderRadius: 999 }}>ریز جزئیات برای قیمت دقیق</span>
                  </div>
                  <div className="muted2" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.7 }}>
                    شما زدین <b>{res.query}</b> که دسته خیلی گسترده‌ایه. برای <b>{currentBroad.label}</b> باید ریز جزئیات (برند، رم، حافظه، سایز، رنگ) معلوم باشه تا مقایسه قیمت دقیق مثل با مثل انجام بشه.
                    الان من هر دو کار رو می‌کنم:
                  </div>
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 12 }}>📊 حالت ۱: مقایسه همه {currentBroad.label}‌های مشابه</div>
                      <div style={{ fontSize: 11, marginTop: 6 }}>برای <b>{res.query}</b> الان {currentBroad.items.length} مدل اصلی:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                        {currentBroad.items.map((item, idx) => (
                          <div key={idx} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 6, textAlign: "center", cursor: "pointer", background: "#fff" }} onClick={()=>{ setQ(item.name); run(item.name); }}>
                            <img src={item.img} alt={item.name} style={{ width: "100%", height: 50, objectFit: "contain" }} />
                            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{item.name.slice(0,20)}</div>
                            <div style={{ fontSize: 10, color: "var(--good)", fontWeight: 800 }}>{item.price} تومان</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, marginTop: 8, color: "var(--muted)" }}>👆 روی هر کدوم کلیک کنید تا فقط همون مدل با جزئیات دقیق و قیمت از ۷ منبع بیاد</div>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 12 }}>💬 حالت ۲: راهنمای سوالی AI - تیک بزنید بعد تایید نهایی</div>
                      <div style={{ fontSize: 11, marginTop: 6 }}>هوش مصنوعی برای هدایت به کالای دقیق - چندتا تیک بزنید بعد جستجو:</div>
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                        {currentBroad.questions.map((qq, qi) => (
                          <div key={qi}>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>{qi+1}. {qq.q}</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                              {qq.opts.map(opt => {
                                const term = opt.includes(" - ") ? opt.split(" - ")[1] : opt;
                                const isSelected = pendingFilters.includes(term);
                                return (
                                  <button key={opt} className="chip" style={{ fontSize: 10, padding: "4px 8px", background: isSelected ? "#3b82f6" : "#fff", color: isSelected ? "#fff" : "#333", borderColor: isSelected ? "#3b82f6" : "var(--line)" }} onClick={()=>{ 
                                    setPendingFilters(prev => isSelected ? prev.filter(f=>f!==term) : [...prev, term]);
                                  }}>{isSelected ? "✓ " : ""}{opt}</button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {pendingFilters.length > 0 && (
                        <div style={{ marginTop: 12, padding: "8px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>فیلترهای انتخاب شده ({pendingFilters.length}):</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                            {pendingFilters.map(f => (
                              <span key={f} style={{ fontSize: 10, background: "#3b82f6", color: "#fff", padding: "3px 8px", borderRadius: 999, display: "flex", gap: 4, alignItems: "center" }}>
                                {f} <span style={{ cursor: "pointer" }} onClick={()=>setPendingFilters(prev=>prev.filter(x=>x!==f))}>✕</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button className="chip" style={{ fontSize: 12, padding: "8px 14px", background: "#10b981", color: "#fff", borderColor: "#10b981", fontWeight: 800 }} onClick={()=>{
                          if (pendingFilters.length === 0) { alert("حداقل یک فیلتر انتخاب کنید"); return; }
                          const newQ = res.query + " " + pendingFilters.join(" ");
                          setQ(newQ); run(newQ); setPendingFilters([]);
                        }}>✅ تایید نهایی و جستجو - {pendingFilters.length} فیلتر</button>
                        <button className="chip" style={{ fontSize: 11, padding: "6px 10px" }} onClick={()=>setPendingFilters([])}>پاک کردن</button>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 10, background: "#eff6ff", padding: "8px", borderRadius: 6, lineHeight: 1.6 }}>
                        🤖 الان می‌تونید چندتا تیک بزنید (مثلا گیمینگ + Dell + 16GB) بعد دکمه تایید نهایی رو بزنید تا بره برای جستجو - نه با هر کلیک!
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="torobProductLayout">
              <aside className="torobLeft">
                <div className="card">
                  <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span>لیست تغییرات قیمت</span>
                    <span>⛶</span>
                  </div>
                  <div style={{ marginTop: 12, background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid var(--line)" }}>
                    {chartData.length > 1 ? (
                      <svg viewBox="0 0 300 100" style={{ width: "100%", height: 100 }}>
                        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={chartData.map((d,i) => { const max = Math.max(...chartData.map(x=>x.avg)); const min = Math.min(...chartData.map(x=>x.avg)); const range = max-min || 1; const x = (i/(chartData.length-1))*300; const y = 100 - ((d.avg-min)/range)*70 - 10; return `${x},${y}`; }).join(" ")} />
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" points={chartData.map((d,i) => { const max = Math.max(...chartData.map(x=>x.avg)); const min = Math.min(...chartData.map(x=>x.avg)); const range = max-min || 1; const x = (i/(chartData.length-1))*300; const y = 100 - ((d.min-min)/range)*70 - 10; return `${x},${y}`; }).join(" ")} />
                      </svg>
                    ) : (
                      <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 11 }}>داده کافی برای نمایش نمودار وجود ندارد.</div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10 }}>
                      <span><span style={{ width: 8, height: 8, background: "#10b981", borderRadius: 2, display: "inline-block", marginLeft: 4 }}></span>میانگین قیمت</span>
                      <span><span style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: 2, display: "inline-block", marginLeft: 4 }}></span>کمترین قیمت</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span>راهنمای جامع محصول</span>
                    <span>📖</span>
                  </div>
                  <div className="muted2" style={{ fontSize: 11, marginTop: 6 }}>نظرات کاربران و توضیحات تخصصی</div>
                </div>

                <div className="card" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>مشخصات محصول — {matchedProduct.name}</div>
                  <div style={{ fontWeight: 700, fontSize: 11, marginTop: 12, color: "var(--muted)" }}>مشخصات کلیدی</div>
                  <div style={{ marginTop: 8 }}>
                    {matchedProduct.category === "کارت گرافیک" ? (
                      <>
                        <div className="specRow"><span>حافظه</span><b>32 گیگابایت</b></div>
                        <div className="specRow"><span>نوع حافظه</span><b>GDDR 7</b></div>
                        <div className="specRow"><span>رابط حافظه</span><b>512 بیت</b></div>
                        <div className="specRow"><span>برند</span><b>ASUS</b></div>
                        <div className="specRow"><span>سازنده</span><b>NVIDIA</b></div>
                      </>
                    ) : matchedProduct.category === "لپ‌تاپ" ? (
                      <>
                        <div className="specRow"><span>برند</span><b>{matchedProduct.name.split(" ")[0]}</b></div>
                        <div className="specRow"><span>پردازنده</span><b>{matchedProduct.spec.split("•")[0] || "-"}</b></div>
                        <div className="specRow"><span>رم</span><b>{matchedProduct.spec.includes("GB") ? matchedProduct.spec.match(/\d+GB/)?.[0] || "16GB" : "16GB"}</b></div>
                        <div className="specRow"><span>حافظه</span><b>{matchedProduct.spec.includes("SSD") ? matchedProduct.spec.match(/\d+GB SSD|\d+TB/)?.[0] || "512GB SSD" : "512GB SSD"}</b></div>
                        <div className="specRow"><span>دسته</span><b>لپ‌تاپ</b></div>
                      </>
                    ) : matchedProduct.category === "هایپر مارکت" ? (
                      <>
                        <div className="specRow"><span>وزن</span><b>{matchedProduct.spec.split("•")[0] || "1kg"}</b></div>
                        <div className="specRow"><span>نوع</span><b>{matchedProduct.name.includes("سفید") ? "سفید" : matchedProduct.name.includes("قرمز") ? "قرمز" : "درجه یک"}</b></div>
                        <div className="specRow"><span>تازگی</span><b>تازه • مزرعه</b></div>
                        <div className="specRow"><span>دسته</span><b>هایپر مارکت</b></div>
                        <div className="specRow"><span>منبع</span><b>باسکول + ترب + باسلام</b></div>
                      </>
                    ) : matchedProduct.category === "سایر" || matchedProduct.id === "dynamic" ? (
                      <>
                        <div className="specRow"><span>نام</span><b>{matchedProduct.name}</b></div>
                        <div className="specRow"><span>دسته</span><b>خودکار / عمومی — تصویر خودکار از منبع قیمت</b></div>
                        <div className="specRow"><span>ویژگی</span><b>{matchedProduct.spec}</b></div>
                        <div className="specRow"><span>منبع تصویر</span><b>همان مرجع قیمت (ترب/دیجی‌کالا/باسلام/باسکول) + loremflickr</b></div>
                        <div className="specRow"><span>قیمت میانگین</span><b>{s ? money(s.avg) : money(matchedProduct.basePrice)}</b></div>
                      </>
                    ) : (
                      <>
                        <div className="specRow"><span>برند</span><b>{productSpecs.brand || matchedProduct.name.split(" ")[0]}</b></div>
                        <div className="specRow"><span>حافظه</span><b>{productSpecs.storage || "256GB"}</b></div>
                        <div className="specRow"><span>رم</span><b>{productSpecs.ram ? `${productSpecs.ram}GB` : "8GB"}</b></div>
                        <div className="specRow"><span>پردازنده</span><b>{productSpecs.cpu || matchedProduct.spec.split("•")[0] || "-"}</b></div>
                      </>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 11, marginTop: 16, color: "var(--muted)" }}>مشخصات کلی</div>
                  <div style={{ marginTop: 8 }}>
                    <div className="specRow"><span>نام محصول</span><b>{matchedProduct.name}</b></div>
                    <div className="specRow"><span>دسته‌بندی</span><b>{matchedProduct.category}</b></div>
                    <div className="specRow"><span>قیمت پایه</span><b>{money(matchedProduct.basePrice)}</b></div>
                  </div>
                </div>
              </aside>

              <div className="torobCenter">
                <div className="card">
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 300px" }}>
                      <img src={mainImage} alt={matchedProduct.name} style={{ width: "100%", height: 260, objectFit: "contain", borderRadius: 12, background: "#fff", border: "1px solid var(--line)", padding: 10 }} />
                      <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                        <img src={mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                        <img src={mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                        <img src={mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                        <div style={{ width: 52, height: 52, borderRadius: 8, border: "1px dashed var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)" }}>+4</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.6 }}>{matchedProduct.name}</div>
                      <div className="muted2" style={{ fontSize: 13, marginTop: 6 }}>{matchedProduct.spec}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                        <span className="muted2" style={{ fontSize: 13 }}>۲۰ فروشنده دیگر</span>
                        <span>🔔</span><span>♡</span>
                      </div>
                      {(() => {
                        const newOffers = filteredOffers.filter(o=>o.condition!=="used").sort((a,b)=>a.price-b.price);
                        const usedOffers = filteredOffers.filter(o=>o.condition==="used").sort((a,b)=>a.price-b.price);
                        const cheapestOverall = filteredOffers[0];
                        const cheapestNew = newOffers[0];
                        const cheapestUsed = usedOffers[0];
                        return (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 12, opacity: .9 }}>خرید از ارزان‌ترین — {cheapestOverall ? (cheapestOverall.condition==="used"?"استوک":"نو") : ""} {cheapestOverall ? srcName(res, cheapestOverall.source) : ""}</div>
                                <div style={{ fontWeight: 900, fontSize: 16, marginTop: 4 }}>{cheapestOverall ? money(cheapestOverall.price) : (s ? money(s.min) : "—")}</div>
                                <div style={{ fontSize: 11, opacity: .85, marginTop: 3 }}>منبع: {cheapestOverall ? cheapestOverall.seller : "—"} | {cheapestOverall ? (cheapestOverall.condition==="used"?"استوک — مثل با مثل":"نو — مثل با مثل") : ""}</div>
                              </div>
                              <div style={{ background: "rgba(0,0,0,.2)", padding: "6px 10px", borderRadius: 8, fontSize: 12, textAlign: "center" }}>
                                <div>ارزان‌ترین</div>
                                <div style={{ fontSize: 10, marginTop: 2 }}>{cheapestOverall?.condition==="used"?"استوک":"نو"}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                                <span>🟢 نو ارزان‌ترین:</span>
                                <b style={{ color: "#166534" }}>{cheapestNew ? money(cheapestNew.price) : "—"}</b>
                              </div>
                              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                                <span>🟡 استوک ارزان‌ترین:</span>
                                <b style={{ color: "#92400e" }}>{cheapestUsed ? money(cheapestUsed.price) : "—"}</b>
                              </div>
                            </div>
                            <div className="muted2" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>💡 تناقض قبلی حل شد: وسط و پایین هر دو از یک منبع فیلتر شده (torob/digikala/basalam) و با تفکیک نو/استوک محاسبه می‌شوند — نو با نو، استوک با استوک</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span>فروشنده‌ها</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>راهنمای خرید امن</span>
                  </div>
                  <div className="table" style={{ marginTop: 12 }}>
                    {filteredOffers.map((o,i) => (
                      <div key={i} className={`row ${i===0?"first":""} ${o.condition==="used"?"rowUsed":"rowNew"}`}>
                        <img src={o.image || "/images/iphone15promax.jpg"} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 6, background: "#fff", border: "1px solid var(--line)", padding: 2 }} />
                        <span className="srcTag" style={{ borderColor: srcColor(res, o.source), color: srcColor(res, o.source), fontSize: 12 }}>{srcName(res, o.source)}</span>
                        <div className="rowTitle"><div style={{ fontSize: 13 }}>{o.title}</div><div className="muted2" style={{ fontSize: 12, marginTop: 2 }}>{o.seller}</div></div>
                        <div className="rowPrice"><b style={{ fontSize: 13 }}>{money(o.price)}</b></div>
                        <div className="rowAction"><button className="buyLink" style={{ padding: "8px 14px", fontSize: 12, background: "#ef4444" }} onClick={()=>{ window.open(o.url,"_blank"); }}>خرید اینترنتی</button></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>محصولات مشابه — مثل ترب</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 10, marginTop: 12 }}>
                    {PRODUCTS.slice(0,6).map(p => (
                      <div key={p.id} className="sugCard" style={{ padding: 10, textAlign: "center", cursor: "pointer" }} onClick={()=>{ setQ(p.name); run(p.name); }}>
                        <img src={p.image} alt={p.name} style={{ width: "100%", height: 80, objectFit: "contain" }} />
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{p.name.slice(0,28)}</div>
                        <div className="muted2" style={{ fontSize: 11, marginTop: 2 }}>{money(p.basePrice)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* بهترین مبدا خرید و بهترین مقصد فروش - پایین صفحه مثل درخواست کاربر - پایه ایجنت خرید/فروش - نو با نو، استوک با استوک */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card" style={{ borderColor: "#86efac", background: "linear-gradient(135deg, #f0fdf4, #fff)" }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>🟢 بهترین مبدا خرید — نو با نو، استوک با استوک</span>
                  <span style={{ fontSize: 12, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 999 }}>مثل با مثل</span>
                </div>
                {(() => {
                  const newOffers = filteredOffers.filter(o=>o.condition!=="used").sort((a,b)=>a.price-b.price);
                  const usedOffers = filteredOffers.filter(o=>o.condition==="used").sort((a,b)=>a.price-b.price);
                  const cheapestNew = newOffers[0];
                  const cheapestUsed = usedOffers[0];
                  const buyInfo = res.buy;
                  return (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* نو */}
                      <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                          <span>🟢 نو — بهترین مبدا</span>
                          <span className="condBadge new" style={{ fontSize: 11 }}>نو</span>
                        </div>
                        {cheapestNew ? (
                          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                            <img src={cheapestNew.image || mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{srcName(res, cheapestNew.source)} — {cheapestNew.seller.slice(0,24)}</div>
                              <div style={{ fontWeight: 900, color: "var(--good)", fontSize: 14, marginTop: 3 }}>{money(cheapestNew.price)}</div>
                            </div>
                            <button className="buyLink" style={{ padding: "6px 12px", fontSize: 12, background: "#16a34a" }} onClick={()=>window.open(cheapestNew.url,"_blank")}>خرید</button>
                          </div>
                        ) : <div className="muted2" style={{ fontSize: 12, marginTop: 8 }}>نو موجود نیست</div>}
                      </div>
                      {/* استوک */}
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                          <span>🟡 استوک — بهترین مبدا</span>
                          <span className="condBadge used" style={{ fontSize: 11 }}>استوک</span>
                        </div>
                        {cheapestUsed ? (
                          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                            <img src={cheapestUsed.image || mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{srcName(res, cheapestUsed.source)} — {cheapestUsed.seller.slice(0,24)}</div>
                              <div style={{ fontWeight: 900, color: "#92400e", fontSize: 14, marginTop: 3 }}>{money(cheapestUsed.price)}</div>
                            </div>
                            <button className="buyLink" style={{ padding: "6px 12px", fontSize: 12, background: "#d97706" }} onClick={()=>window.open(cheapestUsed.url,"_blank")}>خرید</button>
                          </div>
                        ) : <div className="muted2" style={{ fontSize: 12, marginTop: 8 }}>استوک موجود نیست</div>}
                      </div>
                      {buyInfo && <div className="muted2" style={{ fontSize: 12, lineHeight: 1.7 }}>قانون: نو با نو، استوک با استوک مقایسه می‌شود — اختلاف نو: {newOffers.length>1 ? money(newOffers[newOffers.length-1].price - newOffers[0].price) : "—"} | اختلاف استوک: {usedOffers.length>1 ? money(usedOffers[usedOffers.length-1].price - usedOffers[0].price) : "—"}</div>}
                    </div>
                  );
                })()}
              </div>

              <div className="card" style={{ borderColor: "#93c5fd", background: "linear-gradient(135deg, #eff6ff, #fff)" }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>🔵 بهترین مقصد فروش — نو با نو، استوک با استوک</span>
                  <span style={{ fontSize: 12, background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 999 }}>مثل با مثل</span>
                </div>
                {(() => {
                  const newOffers = filteredOffers.filter(o=>o.condition!=="used").sort((a,b)=>a.price-b.price);
                  const usedOffers = filteredOffers.filter(o=>o.condition==="used").sort((a,b)=>a.price-b.price);
                  const mostExpNew = newOffers.length ? newOffers[newOffers.length-1] : null;
                  const mostExpUsed = usedOffers.length ? usedOffers[usedOffers.length-1] : null;
                  const cheapestNew = newOffers[0];
                  const cheapestUsed = usedOffers[0];
                  const profitNew = mostExpNew && cheapestNew ? mostExpNew.price - cheapestNew.price : 0;
                  const profitUsed = mostExpUsed && cheapestUsed ? mostExpUsed.price - cheapestUsed.price : 0;
                  const roiNew = cheapestNew ? Math.round((profitNew/cheapestNew.price)*100) : 0;
                  const roiUsed = cheapestUsed ? Math.round((profitUsed/cheapestUsed.price)*100) : 0;
                  return (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* نو */}
                      <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                          <span>🔵 نو — بهترین مقصد</span>
                          <span style={{ fontSize: 11, background: roiNew>10?"#dcfce7":"#fef3c7", color: roiNew>10?"#166534":"#92400e", padding: "3px 8px", borderRadius: 999, fontWeight: 800 }}>ROI {roiNew}%</span>
                        </div>
                        {mostExpNew ? (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <img src={mostExpNew.image || mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{srcName(res, mostExpNew.source)} — {mostExpNew.seller.slice(0,24)}</div>
                                <div style={{ fontWeight: 900, color: "#2563eb", fontSize: 14, marginTop: 3 }}>{money(mostExpNew.price)}</div>
                              </div>
                              <button className="buyLink" style={{ padding: "6px 12px", fontSize: 12, background: "#2563eb" }} onClick={()=>window.open(mostExpNew.url,"_blank")}>فروش</button>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                              <span>سود نو: <b style={{ color: profitNew>0?"#16a34a":"#dc2626" }}>{money(profitNew)}</b></span>
                              <span>از {cheapestNew ? money(cheapestNew.price) : "—"} به {money(mostExpNew.price)}</span>
                            </div>
                          </div>
                        ) : <div className="muted2" style={{ fontSize: 12, marginTop: 8 }}>نو موجود نیست</div>}
                      </div>
                      {/* استوک */}
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                          <span>🟡 استوک — بهترین مقصد</span>
                          <span style={{ fontSize: 11, background: roiUsed>10?"#dcfce7":"#fef3c7", color: roiUsed>10?"#166534":"#92400e", padding: "3px 8px", borderRadius: 999, fontWeight: 800 }}>ROI {roiUsed}%</span>
                        </div>
                        {mostExpUsed ? (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <img src={mostExpUsed.image || mainImage} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", padding: 4 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{srcName(res, mostExpUsed.source)} — {mostExpUsed.seller.slice(0,24)}</div>
                                <div style={{ fontWeight: 900, color: "#92400e", fontSize: 14, marginTop: 3 }}>{money(mostExpUsed.price)}</div>
                              </div>
                              <button className="buyLink" style={{ padding: "6px 12px", fontSize: 12, background: "#d97706" }} onClick={()=>window.open(mostExpUsed.url,"_blank")}>فروش</button>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                              <span>سود استوک: <b style={{ color: profitUsed>0?"#16a34a":"#dc2626" }}>{money(profitUsed)}</b></span>
                              <span>از {cheapestUsed ? money(cheapestUsed.price) : "—"} به {money(mostExpUsed.price)}</span>
                            </div>
                          </div>
                        ) : <div className="muted2" style={{ fontSize: 12, marginTop: 8 }}>استوک موجود نیست</div>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 🌍 فاز خارج به داخل - فقط وقتی ادمین فعال کرده باشه */}
            {outsideSettings.outsideInsideEnabled && res && (
              <div className="card" style={{ marginTop: 12, borderColor: "#0ea5e9", background: "linear-gradient(135deg, #f0f9ff, #fff)", borderWidth: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span>🌍 فاز خارج به داخل - خرید از خارج، تحویل ایران (Import Dropship)</span>
                  <span style={{ fontSize: 11, background: "#dcfce7", color: "#065f46", padding: "4px 10px", borderRadius: 999 }}>✅ فعال - ادمین</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 1.7, background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #bae6fd" }}>
                  💡 <b>مدل هیبریدی برای کاهش ریسک:</b> کالا از انبار دبی/استانبول (۳-۷ روز) یا موجودی مجازی تهران (فردا) - نه مستقیم از چین ۲۵ روزه. قیمت نهایی با گمرک و حمل حساب شده.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginTop: 14 }}>
                  {generateOutsideInsideOffers().map((offer, idx) => (
                    <div key={idx} style={{ background: "#fff", border: `2px solid ${offer.riskColor}20`, borderRadius: 12, padding: 14, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{offer.flag} {offer.name}</div>
                        <span style={{ fontSize: 10, background: offer.riskColor, color: "#fff", padding: "3px 8px", borderRadius: 999 }}>{offer.risk}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{offer.delivery} - {offer.desc} - {offer.risk === "کم‌ریسک" ? "گمرک روتین" : "نیاز به صبر"}</div>
                      
                      <div style={{ marginTop: 10, background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 10, lineHeight: 1.8, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 4, color: "#0f172a" }}>📦 محاسبه کامل قیمت نهایی (لندد کاست):</div>
                        <div>۱. قیمت کالا: <b>{money(offer.price)}</b></div>
                        <div>۲. حمل بین‌الملل: {money(offer.shipping)} + بیمه {offer.insurancePct}%: {money(offer.insurance)} = CIF: <b>{money(offer.cif)}</b></div>
                        <div>۳. گمرک {offer.duty}%: {money(offer.duty)} + هلال {offer.hilalPct}%: {money(offer.hilal)} + مالیات {offer.vatPct}%: {money(offer.vat)}</div>
                        <div>۴. ترخیص: {money(offer.clearanceFee)} + انبار: {money(offer.warehousingFee)} + صرافی {offer.currencyFeePct}%: {money(offer.currencyFee)}</div>
                        <div>۵. حمل داخل: {money(offer.domesticShipping)} + کارمزد پلتفرم {offer.platformFeePct}%: {money(offer.platformFee)}</div>
                        <div style={{ borderTop: "2px solid #0ea5e9", marginTop: 6, paddingTop: 6, fontWeight: 900, color: "#0f172a", fontSize: 11 }}>💰 قیمت نهایی تمام شده: {money(offer.total)}</div>
                        <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>{offer.breakdown}</div>
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#065f46" }}>⚡ فوری - انبار تهران</div>
                          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{money(offer.immediate)}</div>
                          <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>فردا تحویل - موجودی مجازی</div>
                          <div style={{ fontSize: 9, color: "#10b981", marginTop: 2 }}>+15% بابت انبار و ریسک</div>
                        </div>
                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#1e40af" }}>💰 اقتصادی - از خارج</div>
                          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{money(offer.economyTotal)}</div>
                          <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{offer.delivery} - با تخفیف صبر</div>
                          <div style={{ fontSize: 9, color: "#0ea5e9", marginTop: 2 }}>-10% = {money(offer.total - offer.economyTotal)} تخفیف</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                        <button type="button" className="chip" style={{ flex: 1, fontSize: 11, padding: "8px", background: "#10b981", color: "#fff", borderColor: "#10b981", fontWeight: 800, cursor: "pointer" }} onClick={()=>openOrderModal(offer, "immediate")}>⚡ سفارش فوری - سایز</button>
                        <button type="button" className="chip" style={{ flex: 1, fontSize: 11, padding: "8px", background: "#0ea5e9", color: "#fff", borderColor: "#0ea5e9", fontWeight: 800, cursor: "pointer" }} onClick={()=>openOrderModal(offer, "economy")}>💰 اقتصادی - سایز</button>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 9, color: "#94a3b8", lineHeight: 1.5, background: "#f8fafc", padding: "6px 8px", borderRadius: 6 }}>
                        💡 سود vs داخلی: {offer.economyTotal < (res.offers?.[0]?.price||0) ? `✅ ${money((res.offers?.[0]?.price||0) - offer.economyTotal)} ارزون‌تر - وارد کن` : `⚠️ ${money(offer.economyTotal - (res.offers?.[0]?.price||0))} گرون‌تر ولی اورجینال و گارانتی اصلی`}
                        <br/>📊 CIF: {money(offer.cif)} | گمرک کل: {money(offer.customsTotal)} | نهایی: {money(offer.total)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>📊 مقایسه سریع - داخلی vs خارجی</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8, fontSize: 11 }}>
                    <div style={{ background: "#f0fdf4", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "#475569" }}>ارزان‌ترین داخلی</div>
                      <div style={{ fontWeight: 900, fontSize: 13, marginTop: 4 }}>{s ? money(s.min) : "—"}</div>
                      <div style={{ fontSize: 10, color: "#10b981" }}>فردا تحویل</div>
                    </div>
                    <div style={{ background: "#eff6ff", padding: 8, borderRadius: 6, textAlign: "center", border: "2px solid #0ea5e9" }}>
                      <div style={{ color: "#475569" }}>بهترین خارج (اقتصادی)</div>
                      <div style={{ fontWeight: 900, fontSize: 13, marginTop: 4 }}>{generateOutsideInsideOffers()[0] ? money(generateOutsideInsideOffers()[0].total) : "—"}</div>
                      <div style={{ fontSize: 10, color: "#0ea5e9" }}>{generateOutsideInsideOffers()[0]?.delivery || "—"}</div>
                    </div>
                    <div style={{ background: "#fef3c7", padding: 8, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ color: "#475569" }}>سود دراپ</div>
                      <div style={{ fontWeight: 900, fontSize: 13, marginTop: 4, color: generateOutsideInsideOffers()[0] && s && generateOutsideInsideOffers()[0].total < s.min ? "#10b981" : "#ef4444" }}>
                        {generateOutsideInsideOffers()[0] && s ? money(s.min - generateOutsideInsideOffers()[0].total) : "—"}
                      </div>
                      <div style={{ fontSize: 10 }}>{generateOutsideInsideOffers()[0] && s && generateOutsideInsideOffers()[0].total < s.min ? "✅ وارد کن" : "⚠️ داخلی بخر"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* بهترین مبدا و مقصد داخلی */}
            {res && filteredOffers.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>💰 بهترین مبدا و مقصد خرید داخلی</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div style={{ background: "#f0fdf4", padding: 10, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 11, color: "#065f46", fontWeight: 800 }}>🟢 بهترین مبدا خرید (ارزان‌ترین)</div>
                    <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>{filteredOffers[0] ? srcName(res, filteredOffers[0].source) : "—"} - {filteredOffers[0] ? money(filteredOffers[0].price) : "—"}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>موجودی: {filteredOffers[0]?.inStock ? "✅" : "❌"} - {filteredOffers[0]?.condition === "new" ? "نو" : "استوک"}</div>
                  </div>
                  <div style={{ background: "#fef3c7", padding: 10, borderRadius: 8, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 11, color: "#92400e", fontWeight: 800 }}>🔴 بهترین مقصد فروش (گران‌ترین)</div>
                    <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6 }}>{[...filteredOffers].sort((a,b)=>b.price-a.price)[0] ? srcName(res, [...filteredOffers].sort((a,b)=>b.price-a.price)[0].source) : "—"} - {[...filteredOffers].sort((a,b)=>b.price-a.price)[0] ? money([...filteredOffers].sort((a,b)=>b.price-a.price)[0].price) : "—"}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>سود: {filteredOffers.length>1 ? money([...filteredOffers].sort((a,b)=>b.price-a.price)[0].price - filteredOffers[0].price) : "—"}</div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      <footer className="footer" style={{ marginTop: 20 }}>قیمت‌یار — جستجوی هوشمند قیمت با هوش مصنوعی — تصویر، برند دقیق، نو/استوک</footer>
      {showUpgradeModal && <div className="modalOverlay" onClick={()=>setShowUpgradeModal(false)}><div className="modalBox" onClick={e=>e.stopPropagation()}><div style={{ textAlign: "center" }}>🔒</div><div style={{ fontWeight: 900, textAlign: "center", marginTop: 8 }}>حرفه‌ای</div><div style={{ background: "#f0f9ff", padding: 10, borderRadius: 10, marginTop: 10, fontSize: 11 }}>{upgradeFeature}</div></div></div>}

      {/* Auth Modal - ثبت‌نام و ورود با موبایل و ایمیل */}
      {showAuthModal && (
        <div className="modalOverlay" onClick={()=>setShowAuthModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="modalBox" onClick={e=>e.stopPropagation()} style={{ background: "#fff", padding: 24, borderRadius: 16, width: 380, maxWidth: "90vw", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 900, fontSize: 16 }}>{authMode === "login" ? "🔑 ورود" : "📝 ثبت‌نام"}</h3>
              <button onClick={()=>setShowAuthModal(false)} style={{ background: "#f1f5f9", border: "none", width: 28, height: 28, borderRadius: 999, cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", gap: 8, marginTop: 16, background: "#f1f5f9", padding: 4, borderRadius: 10 }}>
              <button onClick={()=>setAuthMode("login")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: authMode==="login" ? "#fff" : "transparent", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: authMode==="login" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>ورود</button>
              <button onClick={()=>setAuthMode("register")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: authMode==="register" ? "#fff" : "transparent", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: authMode==="register" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>ثبت‌نام</button>
            </div>

            <form onSubmit={handleAuth} style={{ marginTop: 16 }}>
              {authMode === "register" && (
                <input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="نام (اختیاری)" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10, fontSize: 13 }} />
              )}
              <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="ایمیل (مثلا ali@gmail.com)" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10, fontSize: 13 }} />
              <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", margin: "8px 0" }}>یا</div>
              <input value={authMobile} onChange={e=>setAuthMobile(e.target.value)} placeholder="موبایل (مثلا 09123456789)" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10, fontSize: 13, direction: "ltr", textAlign: "right" }} />
              <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="رمز عبور" required style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12, fontSize: 13 }} />
              
              {authError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 10 }}>{authError}</div>}
              
              <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "12px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                {authLoading ? "..." : authMode === "login" ? "🔑 ورود" : "📝 ثبت‌نام"}
              </button>
            </form>

            <div style={{ marginTop: 12, fontSize: 10, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
              با ثبت‌نام، ۱۰۰۰ جستجوی رایگان روزانه + دسترسی به فاز خارج به داخل (وقتی ادمین فعال کنه)
            </div>
          </div>
        </div>
      )}

      {/* Order Modal - سفارش لباس/کفش با سایز - خارج به داخل */}
      {showOrderModal && selectedOrderOffer && (
        <div className="modalOverlay" onClick={()=>setShowOrderModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div className="modalBox" onClick={e=>e.stopPropagation()} style={{ background: "#fff", padding: 20, borderRadius: 16, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 900, fontSize: 15 }}>🛒 سفارش {res?.query} - {selectedOrderOffer.flag} {selectedOrderOffer.name}</h3>
              <button onClick={()=>setShowOrderModal(false)} style={{ background: "#f1f5f9", border: "none", width: 28, height: 28, borderRadius: 999, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>{res?.query} - {selectedDeliveryType === "immediate" ? "⚡ فوری از انبار تهران" : "💰 اقتصادی از خارج"}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{selectedOrderOffer.delivery} - {selectedOrderOffer.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 900, marginTop: 6, color: selectedDeliveryType === "immediate" ? "#065f46" : "#1e40af" }}>
                قیمت نهایی: {money(selectedDeliveryType === "immediate" ? selectedOrderOffer.immediate : selectedOrderOffer.economyTotal)}
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 400 }}> - {selectedDeliveryType === "immediate" ? "فردا + 2 ساعت تست سایز" : `${selectedOrderOffer.delivery} + 10% تخفیف`}</span>
              </div>
            </div>

            {/* سایز - برای لباس و کفش الزامی */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📏 انتخاب سایز - الزامی برای لباس و کفش:</div>
              {(res?.query?.toLowerCase().includes("کفش") || res?.query?.toLowerCase().includes("کتونی") || res?.query?.toLowerCase().includes("صندل") || res?.query?.toLowerCase().includes("دمپایی") || res?.query?.toLowerCase().includes("shoe")) ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {["38","39","40","41","42","43","44","45"].map(sz => (
                      <button key={sz} type="button" onClick={()=>setSelectedSize(sz)} style={{ padding: "10px", borderRadius: 8, border: selectedSize===sz ? "2px solid #0ea5e9" : "1px solid #e2e8f0", background: selectedSize===sz ? "#f0f9ff" : "#fff", fontWeight: selectedSize===sz ? 900 : 400, fontSize: 13, cursor: "pointer" }}>{sz}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, background: "#fffbeb", padding: "6px 8px", borderRadius: 6 }}>💡 راهنمای سایز: 42 ایران = 42 EU = طول پا 26.5cm - اگه بین دو سایزی، بزرگ‌تر رو بگیر</div>
                </div>
              ) : (res?.query?.toLowerCase().includes("لباس") || res?.query?.toLowerCase().includes("پوشاک") || res?.query?.toLowerCase().includes("تیشرت") || res?.query?.toLowerCase().includes("شلوار")) ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                    {["S","M","L","XL","XXL","38","40","42","44","46"].map(sz => (
                      <button key={sz} type="button" onClick={()=>setSelectedSize(sz)} style={{ padding: "10px", borderRadius: 8, border: selectedSize===sz ? "2px solid #0ea5e9" : "1px solid #e2e8f0", background: selectedSize===sz ? "#f0f9ff" : "#fff", fontWeight: selectedSize===sz ? 900 : 400, fontSize: 13, cursor: "pointer" }}>{sz}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, background: "#fffbeb", padding: "6px 8px", borderRadius: 6 }}>💡 لباس ترکیه سایز L = ایران L - قد 175-180 مناسب</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {["38","40","42","44","S","M","L","XL"].map(sz => (
                      <button key={sz} type="button" onClick={()=>setSelectedSize(sz)} style={{ padding: "10px", borderRadius: 8, border: selectedSize===sz ? "2px solid #0ea5e9" : "1px solid #e2e8f0", background: selectedSize===sz ? "#f0f9ff" : "#fff", fontWeight: selectedSize===sz ? 900 : 400, fontSize: 13, cursor: "pointer" }}>{sz}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6, background: "#fef2f2", padding: "6px 8px", borderRadius: 6, border: "1px solid #fecaca" }}>⚠️ برای لباس و کفش سایز الزامیه - بدون سایز سفارش ثبت نمیشه</div>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, background: "#f0fdf4", padding: "6px 10px", borderRadius: 999, display: "inline-block" }}>✅ سایز انتخاب شده: <b>{selectedSize}</b></div>
            </div>

            <form onSubmit={handleCreateOrder} style={{ marginTop: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input value={orderName} onChange={e=>setOrderName(e.target.value)} placeholder="نام و نام خانوادگی" required style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <input value={orderMobile} onChange={e=>setOrderMobile(e.target.value)} placeholder="موبایل 0912..." required style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, direction: "ltr", textAlign: "right" }} />
              </div>
              <textarea value={orderAddress} onChange={e=>setOrderAddress(e.target.value)} placeholder="آدرس کامل: شهر، خیابان، کوچه، پلاک، واحد - برای تحویل" required rows={3} style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical" }} />

              {orderError && <div style={{ marginTop: 10, background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 11 }}>{orderError}</div>}

              <div style={{ marginTop: 12, background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 10, lineHeight: 1.7, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 800, fontSize: 11 }}>📋 خلاصه سفارش:</div>
                <div>کالا: {res?.query} سایز {selectedSize}</div>
                <div>مبدا: {selectedOrderOffer.flag} {selectedOrderOffer.name} - {selectedOrderOffer.delivery}</div>
                <div>نوع: {selectedDeliveryType === "immediate" ? "⚡ فوری - فردا - انبار تهران - 2 ساعت تست سایز" : `💰 اقتصادی - ${selectedOrderOffer.delivery} - از خارج`}</div>
                <div style={{ fontWeight: 900, marginTop: 4 }}>مبلغ قابل پرداخت: {money(selectedDeliveryType === "immediate" ? selectedOrderOffer.immediate : selectedOrderOffer.economyTotal)} - پیش‌پرداخت 50%: {money(Math.round((selectedDeliveryType === "immediate" ? selectedOrderOffer.immediate : selectedOrderOffer.economyTotal)*0.5))}</div>
                <div style={{ color: "#64748b", marginTop: 4 }}>📦 {selectedOrderOffer.breakdown.slice(0, 120)}...</div>
              </div>

              <button type="submit" disabled={orderLoading} style={{ width: "100%", marginTop: 14, padding: "12px", background: selectedDeliveryType === "immediate" ? "#10b981" : "#0ea5e9", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                {orderLoading ? "در حال ثبت..." : `✅ ثبت سفارش ${selectedSize} - ${money(selectedDeliveryType === "immediate" ? selectedOrderOffer.immediate : selectedOrderOffer.economyTotal)}`}
              </button>

              <div style={{ marginTop: 8, fontSize: 9, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
                با ثبت سفارش، 50% پیش‌پرداخت میگیرید - الباقی موقع تحویل + 2 ساعت فرصت تست سایز برای فوری<br/>
                <a href="/orders" style={{ color: "#0ea5e9" }}>پیگیری سفارشات → /orders</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function StatBox({ label, value }) { return <div className="statBox"><div className="muted2">{label}</div><div className="statVal">{value}</div></div>; }
function srcName(res, id) { return res.sources.find((x) => x.id === id)?.name || id; }
function srcColor(res, id) { return res.sources.find((x) => x.id === id)?.color || "var(--muted)"; }
