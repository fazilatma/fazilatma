import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { JsonKycDocument } from "@/lib/json-store";
import {
  getKvNamespace,
  kvDelete,
  kvGetBuffer,
  kvPutBuffer,
} from "@/lib/kv-storage";

// پیشوند کلید KV برای مدارک رمزنگاری‌شده احراز هویت در Cloudflare Workers.
const KV_KYC_PREFIX = "optibid:kyc:";

const uploadRoot =
  process.env.OPTIBID_UPLOAD_DIR ||
  path.join(process.env.TMPDIR || "/tmp", "optibid-uploads");

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const maxFileSize = 5 * 1024 * 1024;
const encryptionSecret =
  process.env.OPTIBID_BANK_ENCRYPTION_KEY ||
  "optibid-development-key-change-this-in-production";
const encryptionKey = createHash("sha256").update(encryptionSecret).digest();

function encryptFile(buffer: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

function decryptFile(buffer: Buffer) {
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function validateKycFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG and WEBP images are allowed");
  }
  if (file.size <= 0 || file.size > maxFileSize) {
    throw new Error("Each KYC image must be between 1 byte and 5 MB");
  }
}

export async function saveKycFile(
  file: File,
  type: JsonKycDocument["type"],
  label: string
): Promise<JsonKycDocument> {
  validateKycFile(file);

  const extension = allowedMimeTypes.get(file.type)!;
  const storedName = `${Date.now().toString(36)}-${randomBytes(16).toString("hex")}${extension}.enc`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const encrypted = encryptFile(buffer);

  if (await getKvNamespace()) {
    // حالت Cloudflare Workers: ذخیره در KV
    await kvPutBuffer(`${KV_KYC_PREFIX}${storedName}`, new Uint8Array(encrypted));
  } else {
    // حالت Node: ذخیره روی دیسک
    await fs.mkdir(uploadRoot, { recursive: true });
    await fs.writeFile(path.join(uploadRoot, storedName), encrypted, { mode: 0o600 });
  }

  return {
    id: randomBytes(12).toString("hex"),
    type,
    label,
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function readKycFile(storedName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(storedName)) {
    throw new Error("Invalid KYC file name");
  }
  if (await getKvNamespace()) {
    const stored = await kvGetBuffer(`${KV_KYC_PREFIX}${storedName}`);
    if (!stored) throw new Error("KYC file not found in KV");
    return decryptFile(Buffer.from(stored));
  }
  return decryptFile(await fs.readFile(path.join(uploadRoot, storedName)));
}

export async function removeKycFiles(documents: JsonKycDocument[]) {
  if (await getKvNamespace()) {
    await Promise.all(
      documents.map((document) => kvDelete(`${KV_KYC_PREFIX}${document.storedName}`))
    );
    return;
  }
  await Promise.all(
    documents.map((document) =>
      fs.unlink(path.join(uploadRoot, document.storedName)).catch(() => undefined)
    )
  );
}

export function getKycUploadInfo() {
  return { uploadRoot, maxFileSize };
}
