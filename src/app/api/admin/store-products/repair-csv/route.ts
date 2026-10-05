import { NextResponse } from "next/server";
import { decodeWindows1256 } from "@/lib/windows-1256";
import { parseEasyScraperCsv } from "@/lib/store-product-csv-import";

export const dynamic = "force-dynamic";

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
  const separators = [...sample].filter((char) => char === "," || char === ";" || char === "\t" || char === "\n").length;
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

async function decodeCsvUpload(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const candidates: { encoding: string; text: string; score: number }[] = [];

  const hasUtf16LeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
  const hasUtf16BeBom = bytes[0] === 0xfe && bytes[1] === 0xff;
  const nullByteRatio = bytes.length > 0 ? bytes.filter((byte) => byte === 0).length / bytes.length : 0;
  const labels = ["utf-8", "windows-1256"];
  if (hasUtf16LeBom || hasUtf16BeBom || nullByteRatio > 0.05) labels.push("utf-16le", "utf-16be");

  for (const encoding of labels) {
    const text = decodeBytes(bytes, encoding);
    if (text) candidates.push({ encoding, text, score: csvDecodeScore(text) });
  }

  const utf8Candidate = candidates.find((candidate) => candidate.encoding === "utf-8");
  return !hasUtf16LeBom && !hasUtf16BeBom && nullByteRatio <= 0.05 && utf8Candidate && !utf8Candidate.text.includes("�")
    ? utf8Candidate
    : candidates.sort((a, b) => b.score - a.score)[0] || { encoding: "utf-8", text: stripTextBom(await file.text()), score: 0 };
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function repairedFileName(original: string) {
  const base = String(original || "digikala.csv").replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "digikala";
  return `${base}-fixed-utf8.csv`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const csvTextValue = formData.get("csvText");
    const sourceLabel = String(formData.get("sourceLabel") || (file instanceof File ? file.name : "easy-scraper"));
    const decoded = file instanceof File
      ? await decodeCsvUpload(file)
      : { encoding: "text", text: stripTextBom(String(csvTextValue || "")), score: 0 };

    if (!decoded.text.trim()) {
      return NextResponse.json({ success: false, message: "فایل CSV یا متن CSV را ارسال کنید." }, { status: 400 });
    }

    const parsed = parseEasyScraperCsv(decoded.text, { sourceLabel });
    if (!parsed.products.length) {
      return NextResponse.json(
        { success: false, message: "محصول معتبری برای ساخت CSV اصلاح‌شده پیدا نشد.", warnings: parsed.warnings, csvEncoding: decoded.encoding },
        { status: 400 },
      );
    }

    const rows = [
      ["title", "price_toman", "url", "brand", "category", "description", "stock", "sourceHost"],
      ...parsed.products.map((product) => [
        product.title,
        product.price,
        product.externalSourceUrl,
        product.brand,
        product.category,
        product.description || product.summary,
        product.stock,
        product.sourceHost,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
    const fileName = repairedFileName(file instanceof File ? file.name : "digikala.csv");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Optibid-CSV-Encoding": decoded.encoding,
        "X-Optibid-Product-Count": String(parsed.products.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ساخت فایل CSV اصلاح‌شده ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown CSV repair error",
      },
      { status: 500 },
    );
  }
}
