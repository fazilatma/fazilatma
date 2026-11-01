/**
 * آداپتور ذخیره‌سازی برای Cloudflare Workers.
 *
 * در محیط Cloudflare Workers فایل‌سیستم پایدار وجود ندارد، بنابراین
 * داده‌های برنامه (فایل JSON و مدارک KYC) در فضای KV ذخیره می‌شود.
 * در محیط‌های Node (مثل next dev یا سرورهای PaaS) همین کد بدون تغییر
 * از فایل‌سیستم استفاده می‌کند و این ماژول به طور خودکار غیرفعال می‌شود.
 */

type KvValue = string | ArrayBuffer | ArrayBufferView;

export type KvNamespaceLike = {
  get(key: string, type: "text"): Promise<string | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  put(key: string, value: KvValue, options?: Record<string, unknown>): Promise<void>;
  delete(key: string): Promise<void>;
};

let cachedNamespace: KvNamespaceLike | null | undefined;

/**
 * اگر برنامه داخل Cloudflare Worker اجرا شود، binding مربوط به KV را برمی‌گرداند؛
 * در غیر این صورت null برمی‌گرداند تا فراخواننده از فایل‌سیستم استفاده کند.
 */
export async function getKvNamespace(): Promise<KvNamespaceLike | null> {
  if (cachedNamespace !== undefined) {
    return cachedNamespace;
  }
  try {
    const mod = (await import("@opennextjs/cloudflare")) as {
      getCloudflareContext: (...args: unknown[]) => unknown;
    };
    if (typeof mod.getCloudflareContext !== "function") {
      cachedNamespace = null;
      return cachedNamespace;
    }
    const context = mod.getCloudflareContext() as { env?: Record<string, unknown> } | null;
    const namespace = context?.env?.OPTIBID_KV;
    cachedNamespace = namespace ? (namespace as KvNamespaceLike) : null;
  } catch {
    // خارج از Workers (next dev / next start روی Node) در دسترس نیست.
    cachedNamespace = null;
  }
  return cachedNamespace;
}

export async function isCloudflareRuntime(): Promise<boolean> {
  return (await getKvNamespace()) !== null;
}

export async function kvGetText(key: string): Promise<string | null> {
  const namespace = await getKvNamespace();
  if (!namespace) return null;
  // نکته: نوع پاسخ در API ورکرز "text" است (نه "string").
  return namespace.get(key, "text");
}

export async function kvGetBuffer(key: string): Promise<Uint8Array | null> {
  const namespace = await getKvNamespace();
  if (!namespace) return null;
  const value = await namespace.get(key, "arrayBuffer");
  return value ? new Uint8Array(value) : null;
}

export async function kvPutText(key: string, value: string): Promise<void> {
  const namespace = await getKvNamespace();
  if (!namespace) return;
  await namespace.put(key, value);
}

export async function kvPutBuffer(key: string, value: Uint8Array): Promise<void> {
  const namespace = await getKvNamespace();
  if (!namespace) return;
  await namespace.put(key, value);
}

export async function kvDelete(key: string): Promise<void> {
  const namespace = await getKvNamespace();
  if (!namespace) return;
  await namespace.delete(key);
}
