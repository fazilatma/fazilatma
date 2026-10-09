const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/** Extract technical specifications written in a product title or description. */
export function technicalSpecsFromText(value: string) {
  const text = toEnglishDigits(String(value || "").replace(/[\u200c]/g, " "));
  const specs: Record<string, string> = {};
  const cpu = text.match(/(?:core\s*(?:i[3579]|ultra\s*[3579])\s*[- ]?\s*[a-z0-9]{3,6}|i[3579]\s*[- ]?\s*\d{4,5}[a-z]{0,2}|ryzen\s*[3579]\s*[- ]?\s*\d{3,5}[a-z]{0,2}|celeron\s*[a-z0-9-]*|pentium\s*[a-z0-9-]*)/i)?.[0];
  if (cpu) specs["پردازنده"] = cpu.replace(/\s+/g, " ").trim();

  const ramType = text.match(/\b(?:LPDDR[345X]*|DDR[345])\b/i)?.[0];
  const ramCapacity =
    text.match(/\b(\d{1,3})\s*GB\s*(?:DDR[345]|LPDDR[345X]*|RAM|رم)\b/i)?.[1] ||
    text.match(/\b(?:DDR[345]|LPDDR[345X]*)\s*(\d{1,3})\s*GB\b/i)?.[1] ||
    text.match(/\b(?:RAM|رم)\s*(\d{1,3})\s*GB\b/i)?.[1];
  if (ramCapacity) specs["حافظه رم"] = `${ramCapacity} GB`;
  if (ramType) specs["نوع رم"] = ramType.toUpperCase();
  const ramFrequency = text.match(/\b(\d{3,5})\s*MHz\b/i)?.[1];
  if (ramFrequency) specs["فرکانس رم"] = `${ramFrequency} MHz`;

  const storage =
    text.match(/\b(\d{2,4})\s*(GB|TB)\s*(SSD|NVMe|HDD|eMMC)\b/i) ||
    text.match(/\b(SSD|NVMe|HDD|eMMC)\b[^\d]{0,20}(\d{2,4})\s*(GB|TB)\b/i);
  if (storage) {
    const capacity = /^\d/.test(storage[0]) ? `${storage[1]} ${storage[2]}` : `${storage[2]} ${storage[3]}`;
    const kind = /^\d/.test(storage[0]) ? storage[3] : storage[1];
    specs["حافظه داخلی"] = `${capacity} ${kind.toUpperCase()}`;
  }

  const graphics = text.match(/\b(?:(?:NVIDIA|GeForce)\s*)?(RTX|GTX)\s*(\d{3,4})(?:\s*(Ti|SUPER))?\b/i);
  if (graphics) {
    specs["مدل گرافیک"] = `${graphics[1].toUpperCase()} ${graphics[2]}${graphics[3] ? ` ${graphics[3]}` : ""}`;
    const graphicsMemory = text.match(/\b(?:RTX|GTX)\s*\d{3,4}\s*(\d{1,2})\s*GB\b/i)?.[1];
    if (graphicsMemory) specs["حافظه گرافیک"] = `${graphicsMemory} GB`;
  } else {
    const integratedGraphics = text.match(/\b(Iris\s*Xe|Intel\s*UHD|Radeon\s*Graphics)\b/i)?.[0];
    if (integratedGraphics) specs["گرافیک"] = integratedGraphics;
  }

  const displaySize = text.match(/\b(\d{2}(?:\.\d)?)\s*(?:inch|اینچ(?:ی)?)/i)?.[1];
  if (displaySize) specs["اندازه نمایشگر"] = `${displaySize} اینچ`;
  const panel = text.match(/\b(IPS|TN|OLED|AMOLED|VA|Retina)\b/i)?.[1];
  if (panel) specs["نوع پنل"] = panel.toUpperCase();
  const resolution = text.match(/\b(Full\s*HD|FHD|WUXGA|QHD|WQHD|UHD|4K|2K|HD\+?|\d{3,4}\s*[x×]\s*\d{3,4})\b/i)?.[1];
  if (resolution) specs["وضوح تصویر"] = resolution.replace(/\s+/g, " ").trim().toUpperCase();
  const refreshRate = text.match(/\b(\d{2,3})\s*Hz\b/i)?.[1];
  if (refreshRate) specs["نرخ نوسازی"] = `${refreshRate} Hz`;
  const operatingSystem = text.match(/\b(Windows\s*(?:11|10|7)|Ubuntu|Linux|FreeDOS|macOS)\b/i)?.[0];
  if (operatingSystem) specs["سیستم‌عامل"] = operatingSystem.replace(/\s+/g, " ").trim();
  return specs;
}
