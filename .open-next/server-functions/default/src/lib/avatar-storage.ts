import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  getKvNamespace,
  kvDelete,
  kvGetBuffer,
  kvPutBuffer,
} from "@/lib/kv-storage";

const KV_AVATAR_PREFIX = "optibid:avatar:";
const avatarRoot =
  process.env.OPTIBID_AVATAR_DIR ||
  path.join(process.env.TMPDIR || "/tmp", "optibid-avatars");

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const contentTypeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const maxAvatarSize = 3 * 1024 * 1024;

export function validateAvatarFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG and WEBP profile images are allowed");
  }
  if (file.size <= 0 || file.size > maxAvatarSize) {
    throw new Error("Profile image must be between 1 byte and 3 MB");
  }
}

export async function saveAvatarFile(file: File) {
  validateAvatarFile(file);
  const extension = allowedMimeTypes.get(file.type)!;
  const storedName = `${Date.now().toString(36)}-${randomBytes(16).toString("hex")}${extension}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (await getKvNamespace()) {
    await kvPutBuffer(`${KV_AVATAR_PREFIX}${storedName}`, buffer);
  } else {
    await fs.mkdir(avatarRoot, { recursive: true });
    await fs.writeFile(path.join(avatarRoot, storedName), buffer, { mode: 0o644 });
  }

  return storedName;
}

export async function readAvatarFile(storedName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(storedName)) {
    throw new Error("Invalid avatar file name");
  }

  if (await getKvNamespace()) {
    const stored = await kvGetBuffer(`${KV_AVATAR_PREFIX}${storedName}`);
    if (!stored) throw new Error("Avatar file not found in KV");
    return Buffer.from(stored);
  }

  return fs.readFile(path.join(avatarRoot, storedName));
}

export async function removeAvatarFile(storedName?: string) {
  if (!storedName || !/^[a-zA-Z0-9._-]+$/.test(storedName)) return;
  if (await getKvNamespace()) {
    await kvDelete(`${KV_AVATAR_PREFIX}${storedName}`);
    return;
  }
  await fs.unlink(path.join(avatarRoot, storedName)).catch(() => undefined);
}

export function avatarContentType(storedName: string) {
  const extension = path.extname(storedName).toLowerCase();
  return contentTypeByExtension.get(extension) || "application/octet-stream";
}

export function getAvatarUploadInfo() {
  return { avatarRoot, maxAvatarSize };
}
