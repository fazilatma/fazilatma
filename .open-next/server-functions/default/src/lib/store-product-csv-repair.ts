import { decodeCsvBytes } from "@/lib/store-product-csv-encoding";
import { parseEasyScraperCsv } from "@/lib/store-product-csv-import";

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

export function repairedCsvFileName(original: string) {
  const base = String(original || "digikala.csv")
    .replace(/\.csv$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "digikala";
  return `${base}-fixed-utf8.csv`;
}

export function repairStoreProductCsvBytes(bytes: Uint8Array, sourceLabel = "easy-scraper") {
  const decoded = decodeCsvBytes(bytes);
  const parsed = parseEasyScraperCsv(decoded.text, { sourceLabel });
  if (parsed.products.length === 0) {
    return {
      csv: "",
      encoding: decoded.encoding,
      encodingWarning: decoded.warning,
      productCount: 0,
      imageCount: 0,
      warnings: parsed.warnings,
    };
  }

  const rows = [
    ["title", "price_toman", "url", "image_url", "brand", "category", "description", "stock", "sourceHost"],
    ...parsed.products.map((product) => [
      product.title,
      product.price,
      product.externalSourceUrl,
      product.imageUrl || "",
      product.brand,
      product.category,
      product.description || product.summary,
      product.stock,
      product.sourceHost,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;

  return {
    csv,
    encoding: decoded.encoding,
    encodingWarning: decoded.warning,
    productCount: parsed.products.length,
    imageCount: parsed.products.filter((product) => Boolean(product.imageUrl)).length,
    warnings: parsed.warnings,
  };
}
