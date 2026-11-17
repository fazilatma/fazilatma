// سیستم مشخصات فنی دقیق - مثل ترب - برای فیلترینگ پیشرفته
export const SPEC_DEFINITIONS = {
  "موبایل": {
    ram: { label: "حافظه RAM", unit: "GB", type: "checkbox", options: [4,6,8,12,16] },
    storage: { label: "حافظه داخلی", unit: "GB", type: "checkbox", options: [64,128,256,512,1024] },
    display: { label: "اندازه صفحه", unit: "اینچ", type: "range", options: [5.5,6.1,6.5,6.7,6.9] },
    cpu: { label: "پردازنده", type: "checkbox", options: ["A17 Pro", "A18 Pro", "Snapdragon 8 Gen 3", "Exynos 1480", "Snapdragon 8 Gen 2", "A15"] },
    battery: { label: "ظرفیت باتری", unit: "mAh", type: "checkbox", options: [4000,4323,4441,5000,5000] },
    camera: { label: "دوربین اصلی", unit: "MP", type: "checkbox", options: [12,50,108,200] },
    network: { label: "شبکه", type: "checkbox", options: ["4G","5G"] },
    brand: { label: "برند", type: "checkbox", options: ["Apple","Samsung","Xiaomi","Poco"] },
    os: { label: "سیستم عامل", type: "checkbox", options: ["iOS 17","iOS 18","Android 14","Android 15"] },
  },
  "لپ‌تاپ": {
    ram: { label: "RAM", unit: "GB", type: "checkbox", options: [8,16,32,64] },
    storage: { label: "حافظه", unit: "GB", type: "checkbox", options: [256,512,1024,2048] },
    cpu: { label: "پردازنده", type: "checkbox", options: ["M1","M3","i7","i9","Ryzen 9"] },
    gpu: { label: "کارت گرافیک", type: "checkbox", options: ["RTX 4060","RTX 4070","M1 7-core","M3 10-core"] },
    display: { label: "صفحه نمایش", unit: "اینچ", type: "checkbox", options: [13.3,14,15.6,16] },
    brand: { label: "برند", type: "checkbox", options: ["Apple","Lenovo","Asus"] },
  },
  "صوتی": {
    brand: { label: "برند", type: "checkbox", options: ["Apple","Sony","JBL"] },
    battery: { label: "عمر باتری", unit: "ساعت", type: "checkbox", options: [20,30] },
    feature: { label: "ویژگی", type: "checkbox", options: ["ANC","ضدآب","MagSafe"] },
  },
  "لوازم التحریر": {
    brand: { label: "برند", type: "checkbox", options: ["بیک","پارکر","کنکو","استدلر"] },
    color: { label: "رنگ", type: "checkbox", options: ["آبی","مشکی","قرمز","سبز"] },
    size: { label: "ضخامت نوک", unit: "mm", type: "checkbox", options: ["0.5","0.7","1.0","1.2"] },
    pack: { label: "تعداد در بسته", type: "checkbox", options: ["1","12","20","50"] },
  },
  "سایر": {
    brand: { label: "برند", type: "checkbox", options: ["بیک","پارکر","کنکو"] },
    color: { label: "رنگ", type: "checkbox", options: ["آبی","مشکی","قرمز"] },
  },
};

export const PRODUCT_SPECS = {
  "p1": { ram: 8, storage: 256, display: 6.7, cpu: "A17 Pro", battery: 4441, camera: 48, network: "5G", brand: "Apple", os: "iOS 17", sim: "2 سیم", rom: "ویتنام", register: "رجیستر شده", active: "نات اکتیو" },
  "p1b": { ram: 8, storage: 512, display: 6.7, cpu: "A17 Pro", battery: 4441, camera: 48, network: "5G", brand: "Apple", os: "iOS 17" },
  "p1c": { ram: 8, storage: 256, display: 6.9, cpu: "A18 Pro", battery: 4685, camera: 48, network: "5G", brand: "Apple", os: "iOS 18" },
  "p2": { ram: 12, storage: 256, display: 6.8, cpu: "Snapdragon 8 Gen 3", battery: 5000, camera: 200, network: "5G", brand: "Samsung", os: "Android 14", sim: "2 سیم کارت", rom: "ویتنام", register: "رجیستر شده", active: "نات اکتیو", year: 2024 },
  "p2b": { ram: 12, storage: 512, display: 6.8, cpu: "Snapdragon 8 Gen 3", battery: 5000, camera: 200, network: "5G", brand: "Samsung", os: "Android 14" },
  "p5a": { ram: 8, storage: 256, display: 13.3, cpu: "M1", battery: 0, brand: "Apple", os: "macOS", gpu: "M1 7-core" },
  "p5": { ram: 16, storage: 512, display: 13, cpu: "M3", brand: "Apple", gpu: "M3 10-core" },
  "p35": { brand: "بیک", color: "آبی", size: "1.0", pack: "12", type: "خودکار" },
  "p35b": { brand: "پارکر", color: "آبی", size: "0.7", pack: "1", type: "خودکار" },
  "p35c": { brand: "کنکو", color: "آبی", size: "0.7", pack: "1", type: "خودکار" },
  "p36": { brand: "پارکر", color: "مشکی", size: "0.7", pack: "1", type: "خودکار" },
  "p37": { brand: "کنکو", color: "قرمز", size: "0.7", pack: "1", type: "خودکار" },
  "p38": { brand: "بیک", color: "سفید", size: "A5", pack: "100", type: "دفتر" },
  "p39": { brand: "استدلر", color: "مشکی", size: "HB", pack: "12", type: "مداد" },
  "p40": { brand: "بیک", color: "سفید", size: "200cc", pack: "50", type: "لیوان" },
  "p41": { brand: "بیک", color: "نقره‌ای", size: "18", pack: "20", type: "سوزن" },
};

export function getProductSpecs(productId) {
  return PRODUCT_SPECS[productId] || {};
}

export function matchesFilters(productSpecs, filters) {
  // filters: { ram: [8,12], storage: [256], ... }
  for (const [key, selectedValues] of Object.entries(filters)) {
    if (!selectedValues || selectedValues.length===0) continue;
    const prodVal = productSpecs[key];
    if (prodVal === undefined) return false;
    // برای عددی و رشته‌ای
    if (Array.isArray(selectedValues)) {
      if (!selectedValues.includes(prodVal)) {
        // برای رنج display
        if (key==="display" && typeof prodVal==="number") {
          // اگر فیلتر رنج باشد
          const match = selectedValues.some(v => Math.abs(v-prodVal) < 0.3);
          if (!match) return false;
        } else {
          return false;
        }
      }
    }
  }
  return true;
}

export function getAvailableFiltersForCategory(category) {
  return SPEC_DEFINITIONS[category] || SPEC_DEFINITIONS["موبایل"];
}
