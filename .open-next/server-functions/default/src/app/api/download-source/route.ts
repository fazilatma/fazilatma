import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { listSnapshotPaths, projectFileExists, readProjectFile } from "@/lib/project-source";

export const dynamic = "force-dynamic";

// پوشه‌ها و فایل‌های مهم برای اضافه شدن به زیپ
const foldersToInclude = ["src", "data"];
const filesToInclude = [
  "package.json",
  "tsconfig.json",
  "drizzle.config.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  "README_DEPLOY.md",
  "README_SELLER_RATING.md",
  "README_CLOUDFLARE.md",
  "liara.json",
  "wrangler.jsonc",
  "open-next.config.ts",
  ".env.example",
];

export async function GET() {
  try {
    const zip = new AdmZip();

    // مسیرهای موجود در اسنپ‌شات build (در Node هم اسنپ‌شات پیش از build تولید می‌شود)
    const pathsToAdd = await listSnapshotPaths(
      foldersToInclude.map((folder) => `${folder}/`)
    );

    for (const file of filesToInclude) {
      if (pathsToAdd.includes(file)) continue;
      if (await projectFileExists(file)) {
        pathsToAdd.push(file);
      }
    }

    for (const relativePath of pathsToAdd) {
      const content = await readProjectFile(relativePath);
      if (content === null) continue;
      const zipPath = relativePath;
      zip.addFile(zipPath, Buffer.from(content, "utf8"));
    }

    // ایجاد بافر فایل زیپ
    const zipBuffer = zip.toBuffer();
    const uint8Array = new Uint8Array(zipBuffer);

    // ارسال به کاربر برای دانلود مستقیم
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="parscoders-marketplace-source-code.zip"',
      },
    });
  } catch (error) {
    console.error("Error generating zip:", error);
    return NextResponse.json({ error: "Failed to generate zip file" }, { status: 500 });
  }
}
