import { decodeWindows1256 } from "@/lib/windows-1256";

export type DecodedCsvContent = {
  text: string;
  encoding: string;
  warning: string;
};

function stripTextBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length || 0;
}

function mojibakeSignal(value: string) {
  const cp1256Sequences = countMatches(value, /(?:ط§|ط¨|طھ|ط±|ط¯|ط³|ط¹|ط¬|ط²|ط©|طŒ|ط،|ط؛|ظ„|ظ…|ظ†|ظ‡|ظ¾|ظƒ|ظک|غŒ|ع†|ع©|آ«|آ»)/g);
  const westernSequences = countMatches(value, /[ØÙÛÃÂ]/g);
  const denseArabic = countMatches(value, /[طظغع][؀-ۿ]/g);
  return cp1256Sequences * 5 + westernSequences * 4 + denseArabic;
}

function csvDecodeScore(value: string) {
  const sample = value.slice(0, 120_000);
  let persian = 0;
  let replacement = 0;
  let nulls = 0;
  let controls = 0;
  let readableAscii = 0;
  for (const char of sample) {
    const code = char.codePointAt(0) || 0;
    if (code >= 0x0600 && code <= 0x06ff) persian += 1;
    if (code === 0xfffd) replacement += 1;
    if (code === 0) nulls += 1;
    if ((code >= 1 && code <= 8) || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) controls += 1;
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) readableAscii += 1;
  }
  let separators = 0;
  for (const char of sample) {
    if (char === "," || char === ";" || char === "\t" || char === "\n") separators += 1;
  }
  const mojibake = mojibakeSignal(sample);
  return persian * 12 + separators * 0.4 + readableAscii * 0.03 - replacement * 180 - nulls * 140 - controls * 60 - mojibake * 95;
}

function decodeBytes(bytes: Uint8Array, encoding: string) {
  if (encoding === "windows-1256") return stripTextBom(decodeWindows1256(bytes));
  try {
    return stripTextBom(new TextDecoder(encoding).decode(bytes));
  } catch {
    return "";
  }
}

/**
 * Decode an uploaded CSV without relying on optional ICU encodings in the
 * runtime. UTF-8 is the fast path; Windows-1256 and UTF-16 are fallbacks.
 */
export function decodeCsvBytes(bytes: Uint8Array): DecodedCsvContent {
  const hasUtf16LeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
  const hasUtf16BeBom = bytes[0] === 0xfe && bytes[1] === 0xff;
  let nullByteCount = 0;
  for (const byte of bytes) {
    if (byte === 0) nullByteCount += 1;
  }
  const nullByteRatio = bytes.length > 0 ? nullByteCount / bytes.length : 0;

  if (!hasUtf16LeBom && !hasUtf16BeBom && nullByteRatio <= 0.05) {
    try {
      const text = stripTextBom(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      return { text, encoding: "utf-8", warning: "" };
    } catch {
      // The bytes are not valid UTF-8. Try Windows-1256 and other likely encodings below.
    }
  }

  const encodings = hasUtf16LeBom
    ? ["utf-16le"]
    : hasUtf16BeBom
      ? ["utf-16be"]
      : ["utf-8", "windows-1256", ...(nullByteRatio > 0.05 ? ["utf-16le", "utf-16be"] : [])];
  const candidates = encodings
    .map((encoding) => ({ encoding, text: decodeBytes(bytes, encoding) }))
    .filter((candidate) => candidate.text.length > 0)
    .map((candidate) => ({ ...candidate, score: csvDecodeScore(candidate.text) }));

  const best = candidates.sort((a, b) => b.score - a.score)[0] || {
    encoding: "utf-8",
    text: stripTextBom(new TextDecoder().decode(bytes)),
    score: 0,
  };
  return {
    text: best.text,
    encoding: best.encoding,
    warning: best.encoding === "utf-8"
      ? ""
      : `کدگذاری فایل CSV به‌صورت خودکار ${best.encoding} تشخیص داده شد و متن برای درون‌ریزی به UTF-8 تبدیل شد.`,
  };
}
